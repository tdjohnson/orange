import * as THREE from 'three';
import {collisionDetection} from './collision.mjs'
import {showMessageContent} from './splashScreen.mjs';
import * as transformModule from './transform.mjs';
import * as bulletControl from './bulletControl.mjs';

var moveForward,
    moveBackward,
    moveLeft,
    moveRight,
    canJump,
	botAggressive;
	var lastObject;
	var hasMoved = true;
	
var velocity = new THREE.Vector3();
var pressedKeys = {};
var maxVelocity = 0.2;

// Reusable vectors to avoid allocations
var tempVec = new THREE.Vector3();
var originVec = new THREE.Vector3();
var normalVec = new THREE.Vector3();
var rotationAxis = new THREE.Vector3(0, 1, 0);

var renderer;
var scene;
var currentBody;

var debugOverlayVisible = false;

function toggleDebugOverlay() {
	debugOverlayVisible = !debugOverlayVisible;
	var el = document.getElementById("message");
	if (el) el.classList.toggle("hidden", !debugOverlayVisible);
}

export function initControls(currentRender, currentScene) {
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);
	document.addEventListener("mousedown", onMouseDown, false);
	document.addEventListener("mouseup", onMouseUp, false);
	canJump = true;
	renderer = currentRender;
	scene = currentScene;
	// start with debug overlay hidden
	var el = document.getElementById("message");
	if (el) el.classList.add("hidden");
}

export function onMouseDown(e) {
	switch (e.button) {
		case 0: //left mouse click
			pressedKeys["LMB"] = true;
			bulletControl.addBullet(renderer, scene);
			break;
	}
}

export function onMouseUp(e) {
	switch (e.button) {
		case 0: //left mouse click end
			pressedKeys["LMB"] = false;
			break;
	}
}

export function onKeyDown(e) {
	hasMoved = true;
    switch (e.code) {
		case "Space":
			pressedKeys[" "] = true;
		    break;
		case "ShiftLeft":
		case "ShiftRight":
			pressedKeys["SHIFT"] = true;
			break;
		case "ArrowLeft":
			pressedKeys["ArrowLeft"] = true;
			break;
		case "ArrowUp":
			pressedKeys["ArrowUp"] = true;
			break;
		case "ArrowRight":
			pressedKeys["ArrowRight"] = true;
			break;
		case "ArrowDown":
			pressedKeys["ArrowDown"] = true;
			break;
		case "KeyA":
			pressedKeys["a"] = true;
			break;
		case "KeyB":
			if(botAggressive == 0) {
				botAggressive = 1;
			} else {
				botAggressive = 0;
			}
			break;
		case "KeyD":
			pressedKeys["d"] = true;
			break;
		case "KeyE":
			if(lastObject) transformModule.rotate(lastObject, rotationAxis, -5);
			break;
		case "KeyO":
			botAggressive = 0;
			break;
		case "KeyQ":
			if(lastObject) transformModule.rotate(lastObject, rotationAxis, 5);
			break;
		case "KeyS":
			pressedKeys["s"] = true;
			break;
		case "KeyT":
			if(lastObject) transformModule.triggerObject([{object: lastObject}]);
			break;
		case "KeyW":
			pressedKeys["w"] = true;
			break;
		case "KeyY":
			if(lastObject) transformModule.triggerDrop(lastObject);
			break;
		case "KeyH":
			toggleDebugOverlay();
			break;
		case "KeyZ":
			zoom();
			break;
    	}
  }


export function onKeyUp(e) {
	switch(e.code) {
		case "Space":
			pressedKeys[" "] = false;
			break;
		case "ShiftLeft":
		case "ShiftRight":
			pressedKeys["SHIFT"] = false;
			break;
		case "ArrowLeft":
			pressedKeys["ArrowLeft"] = false;
			break;
		case "ArrowUp":
			pressedKeys["ArrowUp"] = false;
			break;
		case "ArrowRight":
			pressedKeys["ArrowRight"] = false;
			break;
		case "ArrowDown":
			pressedKeys["ArrowDown"] = false;
			break;
		case "KeyA":
			pressedKeys["a"] = false;
			break;
		case "KeyD":
			pressedKeys["d"] = false;
			break;
		case "KeyS":
			pressedKeys["s"] = false;
			break;
		case "KeyW":
			pressedKeys["w"] = false;
			break;
	}
	// Reset hasMoved if no movement keys are pressed
	if(!pressedKeys["w"] && !pressedKeys["a"] && !pressedKeys["s"] && !pressedKeys["d"] &&
	   !pressedKeys["ArrowUp"] && !pressedKeys["ArrowLeft"] && !pressedKeys["ArrowDown"] && !pressedKeys["ArrowRight"]) {
		hasMoved = false;
	}
}

function calcNewVelocityPerTick(oldVelocity, deltaTick) {
	var newVelocity = oldVelocity * (1 - deltaTick * 10);
	if (Math.abs(newVelocity) < 0.002) return 0;
	if (Math.abs(newVelocity) > maxVelocity) return Math.sign(oldVelocity) * maxVelocity;
	return newVelocity;
}

function reduceFloatPrecision(toReduce) {
	return toReduce.toFixed(4);
}

// --- Wall collision ---
var wallRaycaster = new THREE.Raycaster();
var wallDirections = [
	new THREE.Vector3(1, 0, 0),
	new THREE.Vector3(-1, 0, 0),
	new THREE.Vector3(0, 0, 1),
	new THREE.Vector3(0, 0, -1),
];
var playerCollisionRadius = 0.8;

function hasWallCollision(position, playerHeight, meshList) {
	originVec.set(position.x, position.y - 1.0, position.z);
	wallRaycaster.far = playerCollisionRadius;
	wallRaycaster.near = 0;
	for (var i = 0; i < wallDirections.length; i++) {
		wallRaycaster.set(originVec, wallDirections[i]);
		var hits = wallRaycaster.intersectObjects(meshList, true);
		if (hits.length > 0 && hits[0].face) {
			normalVec.copy(hits[0].face.normal);
			normalVec.transformDirection(hits[0].object.matrixWorld);
			if (Math.abs(normalVec.y) < 0.5) {
				return true;
			}
		}
	}
	return false;
}

export function updateControls(controlsEnabled, clock, controls, collidableMeshList, raycaster, raycasterFront, raycasterCamera) {
	if (controlsEnabled) {
		var delta = clock.getDelta();
		// Prevent physics spiral when tab loses focus
		if (delta > 0.1) delta = 0.1;
		var mass = 1;
		var walkingSpeedImpulse = 0.1;
		var jumpImpulse = 10;
		var playerHeight = controls.object.playerHeight;

		if(pressedKeys[" "]) {
			if (canJump === true) {
				velocity.y += jumpImpulse;
				canJump = false;
			}
		}
		if(pressedKeys["SHIFT"]) {
			velocity.y -= jumpImpulse;
		}
		if (pressedKeys["w"] || pressedKeys["ArrowUp"]) {
			velocity.z -= walkingSpeedImpulse;
		}
		if (pressedKeys["a"] || pressedKeys["ArrowLeft"]) {
			velocity.x -= walkingSpeedImpulse;
		}
		if (pressedKeys["s"] || pressedKeys["ArrowDown"]) {
			velocity.z += walkingSpeedImpulse;
		}
		if (pressedKeys["d"] || pressedKeys["ArrowRight"]) {
			velocity.x += walkingSpeedImpulse;
		}

		velocity.x = calcNewVelocityPerTick(velocity.x, delta);
		velocity.z = calcNewVelocityPerTick(velocity.z, delta);
		velocity.y -= 9.8 * delta * mass;

		var prevPos = controls.object.position.clone();

		controls.moveForward(-velocity.z);
		if (hasWallCollision(controls.object.position, playerHeight, collidableMeshList)) {
			controls.object.position.copy(prevPos);
			velocity.z = 0;
		}

		var midPos = controls.object.position.clone();

		controls.moveRight(velocity.x);
		if (hasWallCollision(controls.object.position, playerHeight, collidableMeshList)) {
			controls.object.position.copy(midPos);
			velocity.x = 0;
		}

		// Calculate proposed new Y position before applying movement
		var newY = controls.object.position.y + (velocity.y * delta);
		
		// Raycast from the proposed new position to detect ground BEFORE moving there
		tempVec.set(controls.object.position.x, newY, controls.object.position.z);
		raycaster.ray.origin.copy(tempVec);

		var groundHits = raycaster.intersectObjects(collidableMeshList, true);
		var onGround = false;

		if (groundHits.length > 0) {
			var groundY = groundHits[0].point.y;
			var standingY = groundY + playerHeight;

			if (newY < standingY) {
				// Would fall below ground, so snap to standing position
				controls.object.position.y = standingY;
				velocity.y = 0;
				canJump = true;
				onGround = true;
			} else {
				// Safe to move down
				controls.object.position.y = newY;
			}
		} else {
			// No ground detected, allow the movement
			controls.object.position.y = newY;
		}

		var collidingMeshesListCameraRay = raycasterCamera.intersectObjects(collidableMeshList, true);
		if (collidingMeshesListCameraRay.length > 0) {
			lastObject = collidingMeshesListCameraRay[0].object;
		}

		var toDisplay =
			"<table id='InfoOutput'>"+
			"<tr><td>velX:</td><td>"+ reduceFloatPrecision(velocity.x) + "</td><td>posX:</td><td>" + reduceFloatPrecision(controls.object.position.x) + "</td></tr>" +
			"<tr><td>velY:</td><td>"+ reduceFloatPrecision(velocity.y) + "</td><td>posY:</td><td>" + reduceFloatPrecision(controls.object.position.y) + "</td></tr>" +
			"<tr><td>velZ:</td><td>"+ reduceFloatPrecision(velocity.z) + "</td><td>posZ:</td><td>" + reduceFloatPrecision(controls.object.position.z) + "</td></tr>" +
			"<tr><td>FPS:</td><td>"+ Math.round(1 / delta) + "</td><td>ground:</td><td>" + onGround + "</td></tr>";
		if (groundHits.length > 0) {
			toDisplay += "<tr><td>groundY:</td><td>" + reduceFloatPrecision(groundHits[0].point.y) + "</td></tr>";
		}
		toDisplay += "</table>";

		showMessageContent(toDisplay);

    }
}
