import * as THREE from 'three';
import { meshloader } from './objects.mjs';
import { collisionDetection } from './collision.mjs';

// Do not import main.js here: the page loads it as main.js?v=<stamp>, and importing the plain URL
// creates a second module instance whose multiplayer object is undefined, which silently drops events.
function events2main(type, destination) {
	if (typeof window.events2main === 'function') window.events2main(type, destination);
}

// Constants
const BULLET_LIFETIME = 10000; // 10 seconds in milliseconds
const BULLET_SPEED = 60; // units per second
const BULLET_ARRAY_MAX = 100; // Maximum bullets to prevent memory leaks

// State
const bulletArray = [];
let currentPosition;
let collidableMeshList = [];

// Shooting cooldown state
let cooldownEndTime = 0;
const SHOOT_COOLDOWN_MS = 1000;

// Reusable vectors
const tempVec3A = new THREE.Vector3();
const tempVec3B = new THREE.Vector3();

export class Bullet extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.name = 'Bullet_' + this.id;
		const scope = this;
		this.birthday = Date.now();
		this.velocity = new THREE.Vector3();
		this.isRemote = false;

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

export function shoot(destination) {
	console.log("You shot: " + destination);
	events2main("hit", destination);
}

export function canShoot() {
	return Date.now() >= cooldownEndTime;
}

export function getCooldownProgress() {
	const now = Date.now();
	const endTime = cooldownEndTime;
	if (now >= endTime) return 1.0;
	return Math.min(1.0, (now - (endTime - SHOOT_COOLDOWN_MS)) / SHOOT_COOLDOWN_MS);
}

export function triggerCooldown() {
	cooldownEndTime = Date.now() + SHOOT_COOLDOWN_MS;
}

export function addBullet(renderer) {
	if (!currentPosition) return;

	if (!canShoot()) {
		return;
	}
	
	triggerCooldown();

	const newBullet = new Bullet(renderer);
	const initialBulletPosition = currentPosition.position;

	// Calculate direction
	currentPosition.getWorldDirection(tempVec3A.set(0, 0, -1));
	const lookAtPoint = tempVec3B.addVectors(tempVec3A, initialBulletPosition);
	
	newBullet.position.copy(initialBulletPosition);
	newBullet.lookAt(lookAtPoint);

	// Set velocity
	const direction = tempVec3A.set(0, 0, 1);
	direction.applyQuaternion(newBullet.quaternion);
	newBullet.velocity.copy(direction.multiplyScalar(BULLET_SPEED));
	
	newBullet.isRemote = false;
	bulletArray.push(newBullet);

	// Cleanup old bullets
	if (bulletArray.length > BULLET_ARRAY_MAX) {
		const oldBullet = bulletArray.shift();
		if (oldBullet.parent) {
			oldBullet.parent.remove(oldBullet);
		}
	}

	// Send bullet event unconditionally (events2main guards for singleplayer)
	if (typeof events2main === 'function') {
		events2main("bullet", JSON.stringify({
			x: initialBulletPosition.x,
			y: initialBulletPosition.y,
			z: initialBulletPosition.z,
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
	currentPosition = camera;
}

export function addRemoteBullet(renderer, bulletData) {
	const newBullet = new Bullet(renderer);
	newBullet.position.set(bulletData.x, bulletData.y, bulletData.z);

	// Set direction from bulletData
	const direction = tempVec3A.set(bulletData.dx, bulletData.dy, bulletData.dz);
	const lookAtPoint = tempVec3B.addVectors(direction, newBullet.position);
	newBullet.lookAt(lookAtPoint);

	// Set velocity
	newBullet.velocity.copy(direction.multiplyScalar(BULLET_SPEED));
	newBullet.isRemote = true;

	bulletArray.push(newBullet);

	// Cleanup old bullets
	if (bulletArray.length > BULLET_ARRAY_MAX) {
		const oldBullet = bulletArray.shift();
		if (oldBullet.parent) {
			oldBullet.parent.remove(oldBullet);
		}
	}
}

export function cleanupBullets() {
	const now = Date.now();
	for (let i = bulletArray.length - 1; i >= 0; i--) {
		const bullet = bulletArray[i];
		if (bullet.birthday && (now - bullet.birthday) > BULLET_LIFETIME) {
			if (bullet.parent) {
				bullet.parent.remove(bullet);
			}
			bulletArray.splice(i, 1);
		}
	}
}
