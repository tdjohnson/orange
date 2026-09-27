import * as THREE from 'three';
import {meshloader} from './objects.mjs';
import {collisionDetection} from './collision.mjs'
// Do not import main.js here: the page loads it as main.js?v=<stamp>, and importing the plain URL
// creates a second module instance whose multiplayer object is undefined, which silently drops events.
function events2main(type, destination) {
	if (typeof window.events2main === 'function') window.events2main(type, destination);
}

// Shooting cooldown state
let cooldownEndTime = 0;

// Reusable vectors
const tempVec3A = new THREE.Vector3();
const tempVec3B = new THREE.Vector3();

export class Bullet extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.name = 'Bullet_' + this.id;
        var scope = this;
        this.birthday = Date.now();
		this.velocity = new THREE.Vector3();

		meshloader('./Prototypes/Bullet/Bullet.glb', function(model) {
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

export function shoot(destination){
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
    newBullet.isRemote = false;
    BulletArray.push(newBullet);
    
    // Send bullet event unconditionally (events2main guards for singleplayer)
    if (typeof events2main === 'function') {
        events2main("bullet", JSON.stringify({
            x: initialBulletPositionVector.x,
            y: initialBulletPositionVector.y,
            z: initialBulletPositionVector.z,
            dx: direction.x,
            dy: direction.y,
            dz: direction.z
        }));
    }
}

export function getBulletArray() {
	return bulletArray;
}

export function setPositionReference(camera) {
    currentPositon = camera;
}

export function addRemoteBullet(renderer, bulletData) {
    var newBullet = new Bullet(renderer);
    newBullet.position.set(bulletData.x, bulletData.y, bulletData.z);
    
    // Set direction from bulletData
    var direction = new THREE.Vector3(bulletData.dx, bulletData.dy, bulletData.dz);
    var lookAtPoint = new THREE.Vector3().addVectors(direction, newBullet.position);
    newBullet.lookAt(lookAtPoint);
    
    // Set velocity
    var bulletSpeed = 60;   // units per second
    newBullet.velocity.copy(direction.multiplyScalar(bulletSpeed));
    newBullet.isRemote = true;
    
    BulletArray.push(newBullet);
}
