import * as THREE from 'three';
import {meshloader} from './objects.mjs';
import {collisionDetection} from './collision.mjs'
import { events2main } from '../../main.js';

const BulletArray = [];
var currentPositon;
var buletLifetime = 10;
var collidableMeshList = [];

export class Bullet extends THREE.Mesh {
    constructor(renderer) {
        super();
		this.name = 'Bullet_' + this.id;
        var scope = this;
        this.birthday = Date.now();
		this.velocity = new THREE.Vector3();

        meshloader('./Prototypes/Bullet/Bullet.glb',function(model) {
			scope.add(model);
		}, renderer);
    }

    getName() {
        return this.name;
    }

}

export function updateCollidableMeshList(newMeshList) {
    collidableMeshList = newMeshList;
}

function shoot(destination){
    console.log("You shot: " + destination);
    events2main("hit", destination);
}

export function addBullet(renderer) {
    var newBullet = new Bullet(renderer);
    var initialBulletPositionVector = currentPositon.position;
    
    const bulletDirection = currentPositon.getWorldDirection(new THREE.Vector3(0, 0, -1));
    const lookAtPoint = new THREE.Vector3().addVectors(bulletDirection, initialBulletPositionVector);
    newBullet.position.set(initialBulletPositionVector.x, initialBulletPositionVector.y, initialBulletPositionVector.z);
    newBullet.lookAt(lookAtPoint);
	// Set initial velocity in the direction the bullet is facing
	var direction = new THREE.Vector3(0, 0, 1);
	direction.applyQuaternion(newBullet.quaternion);
	var bulletSpeed = 60;   // units per second
	newBullet.velocity.copy(direction.multiplyScalar(bulletSpeed));
    BulletArray.push(newBullet);
}

export function getBulletArray() {
    return BulletArray;
}

export function setPositionReference(camera) {
    currentPositon = camera;
}

