import * as THREE from 'three';
import * as objectsModule from './objects.mjs';
import * as signalR from 'signalR';
import * as UMPS from 'umps';

export var umps = new UMPS.UMPS();
var players = [];
var botBody;
var renderer;

var collidableMeshList = [];
var scene;
export class Multiplayer extends THREE.Mesh {
	constructor(renderer, collidableMeshList, scene) {
        super();
		this.name = 'Multiplayer_' + this.id;
        this.renderer = renderer;
        this.collidableMeshList = collidableMeshList;
        this.scene = scene; // Ensure scene is assigned to the instance

    }
 
    SendData(pos, dir) {
            var player = {
                id: umps.GetPlayerId(),
                x: pos.x,
                y: pos.y,
                z: pos.z,
                xd: dir.x,
                yd: dir.y,
                zd: dir.z
            };
            umps.hub.invoke("SendData", player);
        };

}