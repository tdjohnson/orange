import * as THREE from 'three';
import * as signalR from 'signalR';
import * as UMPS from 'umps';
import * as objectsModule from './objects.mjs';

export class Multiplayer extends THREE.Mesh {
	constructor(renderer, collidableMeshList, scene) {
        super();
        this.umps = new UMPS.UMPS();
		this.name = 'Multiplayer_' + this.id;
        this.renderer = renderer;
        this.collidableMeshList = collidableMeshList;
        this.scene = scene;
        this.botBody = new objectsModule.JailBotBody(renderer);
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
        const player = {
            id: this.playerId,
            x: pos.x,
            y: pos.y,
            z: pos.z,
            xd: dir.x,
            yd: dir.y,
            zd: dir.z
        };
        this.umps.hub.invoke("SendData", player);
    }

    addNewPlayer(player) {
        const newPlayer = {
            id: player.id,
            body: this.botBody.clone()
        };
        this.addPlayerIdText(newPlayer.body, player.id);
        this.updatePlayer(newPlayer, player);
        this.players.push(newPlayer);
        this.collidableMeshList.push(newPlayer.body);
        this.scene.add(newPlayer.body);
    }

    updatePlayer(existingPlayer, playerData) {
        existingPlayer.body.position.set(playerData.x, playerData.y, playerData.z);
        const newDir = new THREE.Vector3(playerData.xd, playerData.yd, playerData.zd);
        const pos = new THREE.Vector3().addVectors(newDir, existingPlayer.body.position);
        existingPlayer.body.lookAt(pos);
    }

    addPlayerIdText(botBody, playerId) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = 'Bold 60px Arial';
        context.fillStyle = 'white';
        context.fillText(playerId, 0, 60);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const planeGeometry = new THREE.PlaneGeometry(1, 0.5); // Adjust size as needed
        const plane = new THREE.Mesh(planeGeometry, material);
        plane.position.set(1, 1.2, 0); // Adjust position as needed
        botBody.add(plane);
    }
}