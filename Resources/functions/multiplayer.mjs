import * as THREE from 'three';
import * as signalR from 'signalR';
import * as UMPS from 'umps';
import * as objectsModule from './objects.mjs';

const serverTickinMS = 20; //Only every x Milliseconds will the client report its position to server, so server is not flooded with messages
var lastServerSync = 0;
const idleCheckInterval = 1000;
const idleThreshold = 1;
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
     constructor(renderer, collidableMeshList, scene, player_name) {
        super();
        this.umps = new UMPS.UMPS();
		this.name = player_name;
        this.renderer = renderer;
        this.collidableMeshList = collidableMeshList;
        this.scene = scene;
        this.playerBody = new objectsModule.JailBotBody(renderer);
        this.playerId = this.umps.GetPlayerId();
        //this.playerName = this.umps.SetPlayerName(this.playerId, player_name);
        this.playerName = "Multi_" + this.playerId;
        this.players = [];
    }
    
    init() {
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
    }

    getPlayerId() {
        return this.playerId;
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
            // name: this.umps.GetPlayerName(player.id),
            name: "Multi_" + player.id,
            body: this.playerBody.clone(),
        };
        this.addPlayerIdText(newPlayer.body, newPlayer.id, newPlayer.id);
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

    addPlayerIdText(body, playerId, playerName) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = 'Bold 60px Arial';
        context.fillStyle = 'white';
        var nameString = playerName + "(" + playerId + ")";
        context.fillText(nameString, 0, 60);

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
                return false;
            }
            return true;
        });
    }
}