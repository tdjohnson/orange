import * as THREE from 'three';
import * as signalR from 'signalR';
import * as UMPS from 'umps';

export class Multiplayer extends THREE.Mesh {
	constructor(collidableMeshList, scene, botBody) {
        super();
        this.umps = new UMPS.UMPS();
		this.name = 'Multiplayer_' + this.id;
        this.collidableMeshList = collidableMeshList;
        this.scene = scene;
        this.botBody = botBody;
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
}