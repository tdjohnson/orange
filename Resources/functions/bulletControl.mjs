import * as THREE from 'three';
import {meshloader} from './objects.mjs';

const BulletArray = [];
var currentPositon;
var scene;

export class Bullet extends THREE.Mesh {
    constructor(renderer) {
        super();
		this.name = 'Bullet_' + this.id;
        var scope = this;

        meshloader('./Prototypes/Bullet/Bullet.glb',function(model) {
			scope.add(model);
		}, renderer);
    }

    getName() {
        return this.name;
    }
}

export function addBullet(renderer) {
    var newBullet = new Bullet(renderer);
    console.log(this.playerBody);
    BulletArray.push(newBullet);
    console.log("Bullet added: " + newBullet.name);
    newBullet.position = currentPositon;
    scene.add(newBullet);
}

export function getBulletArray() {
    return BulletArray;
}

export function setPositionReference(camera) {
    currentPositon = camera;
}

export function setSceneReference(sceneRef) {
    scene = sceneRef;
}