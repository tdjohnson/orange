import * as THREE from 'three';
import * as signalR from 'signalR';
import * as UMPS from 'umps';
import * as objectsModule from './objects.mjs';

const serverTickinMS = 20; //Only every x Milliseconds will the client report its position to server, so server is not flooded with messages
var lastServerSync = 0;


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
    }

    getPlayerId() {
        return this.playerId;
    }
 
    sendData(pos, dir) {

        var currentTime = performance.now();
        if (lastServerSync === 0) {
            lastServerSync = currentTime;
        } else {
            if ((currentTime - lastServerSync) > serverTickinMS) {
    
                const player = {
                    id: this.playerId,
                    x: pos.x,
                    y: pos.y,
                    z: pos.z,
                    xd: dir.x,
                    yd: dir.y,
                    zd: dir.z
                };
                if (this.umps.hub.connection.q === "Connected") {
                    this.umps.hub.invoke("SendData", player).catch(err => {
                        console.error("Error sending data: ", err);
                    })
                };

                lastServerSync = currentTime;
                //console.log(lastServerSync);
            }
        }
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
    }

    updatePlayer(player, playerData) {
        //dirty player height hack, might break in the future
        player.body.position.set(playerData.x, playerData.y - this.scene.children[0].playerHeight, playerData.z);

        const newDir = new THREE.Vector3(playerData.xd, playerData.yd, playerData.zd);
        const pos = new THREE.Vector3().addVectors(newDir, player.body.position);
        player.body.lookAt(pos);
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
}