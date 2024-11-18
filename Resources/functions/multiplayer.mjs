import * as THREE from 'three';
import * as objectsModule from './objects.mjs';
import * as signalR from 'signalR';
import * as UMPS from 'umps';


var collidableMeshList = [];
var scene;
export class Multiplayer extends THREE.Mesh {
	constructor(renderer, collidableMeshList, scene) {
        super();
        this.umps = new UMPS.UMPS();
		this.name = 'Multiplayer_' + this.id;
        this.renderer = renderer;
        this.collidableMeshList = collidableMeshList;
        this.scene = scene; // Ensure scene is assigned to the instance
        this.playerId = this.umps.GetPlayerId(); // Store player ID internally
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

}