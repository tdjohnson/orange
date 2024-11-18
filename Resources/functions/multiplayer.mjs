import * as THREE from 'three';
import * as objectsModule from './objects.mjs';
import * as signalR from 'signalR';
import * as UMPS from 'umps';

export class Multiplayer extends THREE.Mesh {
	constructor(renderer, collidableMeshList, scene, botBody) {
        super();
        this.umps = new UMPS.UMPS();
		this.name = 'Multiplayer_' + this.id;
        this.renderer = renderer;
        this.collidableMeshList = collidableMeshList;
        this.scene = scene;
        this.botBody = botBody;
        this.playerId = this.umps.GetPlayerId();
        this.players = [];
    }

    init() {
        this.umps.hub.on("ReceiveData", (player) => {
            if (player.id == this.GetPlayerId()) return;

            var existingPlayer = this.players.find(p => p.id === player.id);
            if (existingPlayer) {
                this.UpdatePlayer(player);
            } else {
                this.AddNewPlayer(player);
            }
        });
    }

    GetPlayerId() {
        return this.playerId;
    }
 
    SendData(pos, dir) {
        var player = {
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

    AddNewPlayer(player) {
        var newPlayer = {};
        newPlayer.body = this.botBody.clone();
        newPlayer.id = player.id;
        newPlayer.body.position.set(player.x, player.y, player.z);
        var newDir = new THREE.Vector3(player.xd, player.yd, player.zd);
        var pos = new THREE.Vector3();
        pos.addVectors(newDir, newPlayer.body.position);
        newPlayer.body.lookAt(pos);
        this.players.push(newPlayer);
        this.collidableMeshList.push(newPlayer.body);
        this.scene.add(newPlayer.body);
    }

    UpdatePlayer(player) {
        var existingPlayer = this.players.find(p => p.id === player.id);
        if (existingPlayer) {
            existingPlayer.body.position.set(player.x, player.y, player.z);
            var newDir = new THREE.Vector3(player.xd, player.yd, player.zd);
            var pos = new THREE.Vector3();
            pos.addVectors(newDir, existingPlayer.body.position);
            existingPlayer.body.lookAt(pos);
        }
    }
}