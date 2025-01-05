import * as THREE from 'three';
import * as signalR from 'signalR';
import * as UMPS from 'umps';
import * as objectsModule from './objects.mjs';

const serverTickinMS = 20; //Only every x Milliseconds will the client report its position to server, so server is not flooded with messages
var lastServerSync = 0;
const idleCheckInterval = 1000;
const idleThreshold = 100000000;
const idleTimeout = 60000;
var lastMovementTime = 0;
var lastPosition = new THREE.Vector3();
var lastDirection = new THREE.Vector3();

const roundVector = (v) => new THREE.Vector3(
    Math.round(v.x * 1000) / 1000,
    Math.round(v.y * 1000) / 1000,
    Math.round(v.z * 1000) / 1000
);

export class Multiplayer extends THREE.Mesh {
     constructor(renderer, collidableMeshList, scene) {
        super();
        this.umps = new UMPS.UMPS();
		this.name = 'Multiplayer_' + this.id;
        this.renderer = renderer;
        this.collidableMeshList = collidableMeshList;
        this.scene = scene;
        this.playerBody = new objectsModule.JailBotBody(renderer);
        this.playerId = this.umps.GetPlayerId();
        this.players = [];
        this.peers = {}; // To store WebRTC peers
        this.audioStreams = {}; // To manage audio streams
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    async init() {
        this.umps.hub.on("ReceiveData", (player) => {
            if (player.id === this.playerId) return;

            const existingPlayer = this.players.find(p => p.id === player.id);
            if (existingPlayer) {
                this.updatePlayer(existingPlayer, player);
            } else {
                this.addNewPlayer(player);
            }
        });

        this.playerLastUpdate = {};
        setInterval(() => this.checkIdle(), idleCheckInterval);

        // Setup audio input for current player
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!stream) {
            console.error("Failed to capture local audio stream.");
            return;
        }
        this.localAudioStream = stream;
        console.log("Local audio stream captured:", stream);
        console.log("Audiostream local: " + this.localAudioStream);
        this.umps.hub.on('ReceiveSignal', this.handleSignal.bind(this));
        this.sendSignal(); // Send initial signal to establish voice connections

    }

    sendSignal() {
        const signalData = { id: this.playerId };
        console.log("send Signal");

        this.umps.hub.invoke('SendSignal', signalData).catch(err => console.error('Error sending signal:', err));
    }

    handleSignal(signalData) {
        const { fromId, signal } = signalData;
        console.log("handle signal");
        if (!this.peers[fromId]) {
            const peer = new SimplePeer({
                initiator: fromId > this.playerId, // Prevent collision in initiator role
                trickle: false,
                stream: this.localAudioStream,
            });

            peer.on('signal', (data) => {
                console.log("Sending WebRTC signal to:", fromId);
                this.umps.hub.invoke('SendSignal', { toId: fromId, signal: data });
            });
            
            peer.on('stream', (remoteStream) => {
                console.log("Received remote audio stream from:", fromId);
                this.setupRemoteAudio(fromId, remoteStream);
            });

            this.peers[fromId] = peer;
        }

        this.peers[fromId].signal(signal);
    }

    setupRemoteAudio(playerId, stream) {        
        const audioSource = this.audioContext.createMediaStreamSource(stream);
        const gainNode = this.audioContext.createGain();
        audioSource.connect(gainNode).connect(this.audioContext.destination);
        this.audioStreams[playerId] = { stream, gainNode };
    }

    adjustAudioVolume() {
        const currentPlayerPosition = this.playerBody.position;
        console.log("ajdust audio");

        this.players.forEach((player) => {
            console.log("players known");
            console.log(player);
            if (player.id !== this.playerId && this.audioStreams[player.id]) {
                const distance = currentPlayerPosition.distanceTo(player.body.position);
                const maxDistance = 1000;
                const minDistance = 1;

                let volume = 0;
                if (distance < maxDistance) {
                    volume = 1 - (distance - minDistance) / (maxDistance - minDistance);
                    volume = Math.max(0, Math.min(volume, 1)); // Clamp volume between 0 and 1
                }

                this.audioStreams[player.id].gainNode.gain.value = volume;
            }
        });
    }


    getPlayerId() {
        return this.playerId;
    }

    getCurrentPlayerBody() {
        this.playerBody;
    }

 
    sendData(pos, dir, forceSend = false) {
       
        var currentTime = performance.now();
        if (lastServerSync === 0) {
            lastServerSync = currentTime;
        } else {
            if ((currentTime - lastServerSync) > serverTickinMS) {
               
                const rPos = roundVector(pos);
                const rDir = roundVector(dir);

                if (forceSend || !rPos.equals(lastPosition) || !rDir.equals(lastDirection)) {

                    const player = {
                        id: this.playerId,
                        x: rPos.x,
                        y: rPos.y,
                        z: rPos.z,
                        xd: rDir.x,
                        yd: rDir.y,
                        zd: rDir.z
                    };
                    if (this.umps.hub.connection.q === "Connected") {
                        this.umps.hub.invoke("SendData", player).catch(err => {
                            console.error("Error sending data: ", err);
                        });
                    }

                    lastServerSync = currentTime;
                    lastPosition.copy(rPos);
                    lastDirection.copy(rDir);
                }
            }
        }

        lastMovementTime = performance.now();
        this.playerLastUpdate[this.playerId] = lastMovementTime;
    }

    addNewPlayer(player) {
        const newPlayer = {
            id: player.id,
            body: this.playerBody.clone()
        };
        this.addPlayerIdText(newPlayer.body, player.id);
        this.updatePlayer(newPlayer, player);
        this.players.push(newPlayer);
        this.collidableMeshList.push(newPlayer.body);
        this.scene.add(newPlayer.body);
        this.playerLastUpdate[player.id] = performance.now();
    }

    updatePlayer(player, playerData) {
        //dirty player height hack, might break in the future
        player.body.position.set(playerData.x, playerData.y - this.scene.children[0].playerHeight, playerData.z);

        const newDir = new THREE.Vector3(playerData.xd, playerData.yd, playerData.zd);
        const pos = new THREE.Vector3().addVectors(newDir, player.body.position);
        player.body.lookAt(pos);
        this.playerLastUpdate[player.id] = performance.now();
    }

    addPlayerIdText(body, playerId) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = 'Bold 60px Arial';
        context.fillStyle = 'white';
        context.fillText(playerId, 0, 60);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const planeGeometry = new THREE.PlaneGeometry(1, 0.5);
        const plane = new THREE.Mesh(planeGeometry, material);
        plane.position.set(1, 1.2, 0);
        body.add(plane);
    }

    checkIdle() {
        const currentTime = performance.now();
        if ((performance.now() - lastMovementTime) >= idleThreshold) {
            this.sendData(lastPosition, lastDirection, true);
        }

        this.players = this.players.filter(player => {
            if ((currentTime - this.playerLastUpdate[player.id]) > idleTimeout) {
                this.scene.remove(player.body);
                this.collidableMeshList = this.collidableMeshList.filter(mesh => mesh !== player.body);

                // Clean up audio resources
                if (this.peers[player.id]) {
                    this.peers[player.id].destroy();
                    delete this.peers[player.id];
                }
                if (this.audioStreams[player.id]) {
                    this.audioStreams[player.id].gainNode.disconnect();
                    delete this.audioStreams[player.id];
                }

                                
                return false;
            }
            return true;
        });
    }
}