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
	var hasMoved = false;
	
var velocity = new THREE.Vector3();
var pressedKeys = new Map();
var maxVelocity = 0.2;

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
	//console.log(e.button);
	switch (e.button) {
		case 0: //left mouse click
			pressedKeys.set("LMB", true);
			bulletControl.addBullet(renderer, scene);
			break;
	}
}

export function onMouseUp(e) {
	//console.log(e.button);
	switch (e.button) {
		case 0: //left mouse click end
			pressedKeys.set("LMB", false);
			break;
	}
}

export function onKeyDown(e) {
	hasMoved = true;
    switch (e.keyCode) {
		case 32: // space
			pressedKeys.set(" ", true);
		    break;
		case 16: //Shift
			pressedKeys.set("SHIFT", true);
			console.log("Pressed SHift");
			break;
		case 37: // left
    	case 38: // up
		case 39: // right
		case 40: // down
		
		case 65: // a
			pressedKeys.set("a", true);
			break;
		case 66: //b
			{
				if(botAggressive == 0) {
					botAggressive = 1;
				} else {
					botAggressive = 0;
				}
			}
			break;
		case 68: // d
			pressedKeys.set("d", true);
			break;
		case 69: // e
	 		rotate(lastObject,new THREE.Vector3(0,1,0),-5); //object,axis,degree
			break;
		case 79: //o
			botAggressive = 0;
			break;
		case 81: // q
			rotate(lastObject,new THREE.Vector3(0,1,0),5 ); //object,axis,degree
			break;
  		case 83: // s
		  	pressedKeys.set("s", true);
			break;
		case 84: //t
			//transformModule.triggerDoor(lastObject);
	    	//transformModule.switchTableLight(lastObject);
			transformModule.triggerObject(lastObject);
			break;    	
  		case 87: // w
		  	pressedKeys.set("w", true);
		  	break;
  		case 89: //y
		 	transformModule.triggerDrop(lastObject);
			break;
	   	case 72: //h
			toggleDebugOverlay();
			break;
	   	case 90: //z
	   		zoom();
			break;
    	}
  }
  


export function onKeyUp(e) {
	switch(e.keyCode) {
		case 1: // left mouse button
			pressedKeys.set("LMB", false);
			break;
		case 16: //Shift
			pressedKeys.set("SHIFT", false);
			break;
		case 32: // space
			pressedKeys.set(" ", false);
			break;
		case 37: // left
    	case 38: // up
		case 39: // right
	  	case 40: // down
	  	case 65: // a
		  pressedKeys.set("a", false);
		  break;
	  	case 68: // d
		  pressedKeys.set("d", false);
		  break;
	  	case 83: // s
		  pressedKeys.set("s", false);
		  break;   
	  	case 87: // w
		  pressedKeys.set("w", false);
		  break;
	}
}

function calcNewVelocityPerTick(oldVelocity, deltaTick) {
	var isNegativeVelocity = 1;
	if (oldVelocity < 0) {
		isNegativeVelocity = -1;
	}
	var absoluteOldVelocity = Math.abs(oldVelocity);
	var newAbsoluteVelocity = absoluteOldVelocity - (absoluteOldVelocity * deltaTick * 10);
	var newVelocity = newAbsoluteVelocity * isNegativeVelocity;
	if (newAbsoluteVelocity >= 0.002) {
		if (newAbsoluteVelocity > maxVelocity) {
			return maxVelocity * isNegativeVelocity;
		} else {
			return newVelocity;
		}
	} else {
		return 0;
	}
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
	new THREE.Vector3(0.707, 0, 0.707),
	new THREE.Vector3(-0.707, 0, 0.707),
	new THREE.Vector3(0.707, 0, -0.707),
	new THREE.Vector3(-0.707, 0, -0.707),
];
var playerCollisionRadius = 0.8;

function hasWallCollision(position, playerHeight, meshList) {
	var origin = new THREE.Vector3(position.x, position.y - 1.0, position.z);
	wallRaycaster.far = playerCollisionRadius;
	wallRaycaster.near = 0;
	for (var i = 0; i < wallDirections.length; i++) {
		wallRaycaster.set(origin, wallDirections[i]);
		var hits = wallRaycaster.intersectObjects(meshList, true);
		if (hits.length > 0 && hits[0].face) {
			// Transform normal to world space and ignore floors/ramps (horizontal surfaces)
			var normal = hits[0].face.normal.clone();
			normal.transformDirection(hits[0].object.matrixWorld);
			if (Math.abs(normal.y) < 0.5) {
				return true; // vertical surface = wall
			}
		}
	}
	return false;
}

export function updateControls(controlsEnabled, clock, controls, collidableMeshList, raycaster, raycasterFront, raycasterCamera) {
	if (controlsEnabled) {
		var delta = clock.getDelta();
		var mass = 10;
		var walkingSpeedImpulse = 0.1;
		var jumpImpulse = 5;
		var playerHeight = controls.object.playerHeight;

		if(pressedKeys.get(" ")) {
			if (canJump === true) {
				velocity.y += jumpImpulse;
				canJump = false;
			}
		}
		if(pressedKeys.get("SHIFT")) {
			velocity.y -= jumpImpulse;
		}
		if (pressedKeys.get("w")) {
			velocity.z -= walkingSpeedImpulse;
		}
		if (pressedKeys.get("a")) {
			velocity.x -= walkingSpeedImpulse;
		}
		if (pressedKeys.get("s")) {
			velocity.z += walkingSpeedImpulse;
		}
		if (pressedKeys.get("d")) {
			velocity.x += walkingSpeedImpulse;
		}

		velocity.x = calcNewVelocityPerTick(velocity.x, delta);
		velocity.z = calcNewVelocityPerTick(velocity.z, delta);
		velocity.y -= 9.8 * delta * mass;

		// --- Horizontal movement with wall collision ---
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

		// --- Floor/ramp detection (raycaster casts down from camera height) ---
		raycaster.ray.origin.set(
			controls.object.position.x,
			controls.object.position.y,
			controls.object.position.z
		);

		var groundHits = raycaster.intersectObjects(collidableMeshList, true);
		var onGround = false;

		if (hasMoved === true) {
			controls.object.position.y += (velocity.y * delta);
		}

		if (groundHits.length > 0) {
			var groundY = groundHits[0].point.y;
			var standingY = groundY + playerHeight;

			if (controls.object.position.y <= standingY + 1.5) {
				controls.object.position.y = standingY;
				velocity.y = Math.max(0, velocity.y);
				canJump = true;
				onGround = true;
			}
		}

		// Camera ray for object interaction
		var collidingMeshesListCameraRay = raycasterCamera.intersectObjects(collidableMeshList, true);
		if (collidingMeshesListCameraRay.length > 0) {
			lastObject = collidingMeshesListCameraRay;
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
