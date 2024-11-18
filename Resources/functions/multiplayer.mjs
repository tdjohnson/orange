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

    }

    GetPlayerId() {
        return this.umps.GetPlayerId();
    }
 
    SendData(pos, dir) {
            var player = {
                id: this.umps.GetPlayerId(),
                x: pos.x,
                y: pos.y,
                z: pos.z,
                xd: dir.x,
                yd: dir.y,
                zd: dir.z
            };
            this.umps.hub.invoke("SendData", player);
        };

}