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
var maxVelocity = 12;

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
	// start with debug overlay visible
	var el = document.getElementById("message");
	if (el) el.classList.remove("hidden");
}

var inputBlocked = false;

// While the player is busted: no walking, no jumping, no shooting
export function setInputBlocked(blocked) {
	inputBlocked = !!blocked;
	if (inputBlocked) resetMovement();
}

// Forget held keys and any leftover speed, e.g. after a respawn
export function resetMovement() {
	velocity.set(0, 0, 0);
	for (var key in pressedKeys) pressedKeys[key] = false;
	canJump = true;
}

export function onMouseDown(e) {
	if (inputBlocked) return;
	switch (e.button) {
		case 0: //left mouse click
			pressedKeys["LMB"] = true;
			bulletControl.addBullet(renderer);
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
	if (inputBlocked) return;
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
	var newVelocity = oldVelocity * Math.exp(-deltaTick * 10); // exponential damping: (1 - dt*10) hits zero at 10 fps and goes negative below, which froze slow clients
	if (Math.abs(newVelocity) < 0.1) return 0;
	if (Math.abs(newVelocity) > maxVelocity) return Math.sign(oldVelocity) * maxVelocity;
	return newVelocity;
}

function reduceFloatPrecision(toReduce) {
	return toReduce.toFixed(4);
}

// --- Collision with walls, furniture and other players ---
// Movement is checked before it happens, separately for the two world axes, so a wall
// stops the movement into it and lets the movement along it through.
//  - Small things (furniture, door panels, other players) collide as bounding boxes.
//    Rays are no good for them: a bunk bed and a barred door are mostly gaps.
//  - Large structures (cells, hallways, foundation, ramps) are swept with rays at three
//    body heights and both shoulders. Surfaces you can stand on never block.
//  - Anything lower than the step height, such as a door sill, is walked over.
var wallRaycaster = new THREE.Raycaster();
var playerCollisionRadius = 0.8;   // distance kept from walls
var bodyHalfWidth = 0.6;           // half width of the body against boxes
var shoulderOffset = 0.55;         // sideways offset of the two outer rays
var stepHeight = 1.2;              // obstacles lower than this are stepped over
var boxMaxFootprint = 8;           // objects up to this size collide as a box
var sweepDir = new THREE.Vector3();
var sweepSide = new THREE.Vector3();
var forwardVec = new THREE.Vector3();
var rightVec = new THREE.Vector3();
var colliderCache = new WeakMap();
var boxColliders = [];
var rayColliders = [];
var neverBoxes = { Ramp: true, Sand: true, Hallway: true, FullHallway: true };

// Sort the collidable objects into boxes and ray targets. Boxes of static objects are
// refreshed every two seconds (models load late), those of doors and players every frame.
function updateColliders(meshList) {
	var now = performance.now();
	boxColliders.length = 0;
	rayColliders.length = 0;
	for (var i = 0; i < meshList.length; i++) {
		var object = meshList[i];
		var entry = colliderCache.get(object);
		var moves = object.playerid !== undefined || (object.userData && object.userData.isOpenable !== undefined);
		if (!entry) {
			entry = { box: new THREE.Box3(), time: -1e9, isBox: false };
			colliderCache.set(object, entry);
		}
		if (moves || now - entry.time > 2000) {
			entry.box.setFromObject(object);
			var footprint = Math.max(entry.box.max.x - entry.box.min.x, entry.box.max.z - entry.box.min.z);
			entry.isBox = !entry.box.isEmpty() && footprint <= boxMaxFootprint && !neverBoxes[object.constructor.name];
			entry.time = now;
		}
		if (entry.isBox) boxColliders.push(entry.box); else rayColliders.push(object);
	}
}

function allowedByBoxes(x, z, feetY, playerHeight, dirX, dirZ, distance) {
	var low = feetY + stepHeight;
	var high = feetY + playerHeight - 0.2;
	var allowed = distance;
	for (var i = 0; i < boxColliders.length; i++) {
		var box = boxColliders[i];
		if (box.max.y < low || box.min.y > high) continue;
		var overlapX = x + bodyHalfWidth > box.min.x && x - bodyHalfWidth < box.max.x;
		var overlapZ = z + bodyHalfWidth > box.min.z && z - bodyHalfWidth < box.max.z;
		if (overlapX && overlapZ) continue; // already inside (spawned there, door closed on us): never trap the player
		var gap;
		if (dirX !== 0) {
			if (!overlapZ) continue;
			gap = dirX > 0 ? box.min.x - (x + bodyHalfWidth) : (x - bodyHalfWidth) - box.max.x;
		} else {
			if (!overlapX) continue;
			gap = dirZ > 0 ? box.min.z - (z + bodyHalfWidth) : (z - bodyHalfWidth) - box.max.z;
		}
		if (gap >= -1e-6 && gap < allowed) allowed = Math.max(0, gap);
	}
	return allowed;
}

function allowedByRays(x, z, feetY, playerHeight, dirX, dirZ, distance) {
	var allowed = distance;
	// the top ray sits one unit below the eye, door openings are lower than the eye
	var heights = [feetY + stepHeight, feetY + playerHeight * 0.5, feetY + playerHeight - 1.0];
	sweepDir.set(dirX, 0, dirZ);
	sweepSide.set(-dirZ, 0, dirX);
	wallRaycaster.near = 0;
	wallRaycaster.far = distance + playerCollisionRadius;
	for (var h = 0; h < heights.length; h++) {
		for (var side = -1; side <= 1; side++) {
			originVec.set(x + sweepSide.x * shoulderOffset * side, heights[h], z + sweepSide.z * shoulderOffset * side);
			wallRaycaster.set(originVec, sweepDir);
			var hits = wallRaycaster.intersectObjects(rayColliders, true);
			for (var i = 0; i < hits.length; i++) {
				if (!hits[i].face) continue;
				normalVec.copy(hits[i].face.normal);
				normalVec.transformDirection(hits[i].object.matrixWorld);
				if (Math.abs(normalVec.y) >= 0.5) continue; // floor, ramp or ceiling: not a wall
				allowed = Math.min(allowed, hits[i].distance - playerCollisionRadius);
				break; // hits are sorted by distance, the first wall decides
			}
		}
	}
	return Math.max(0, allowed);
}

function allowedDistance(x, z, feetY, playerHeight, dirX, dirZ, distance) {
	var byBoxes = allowedByBoxes(x, z, feetY, playerHeight, dirX, dirZ, distance);
	if (byBoxes <= 0) return 0;
	return Math.min(byBoxes, allowedByRays(x, z, feetY, playerHeight, dirX, dirZ, byBoxes));
}

function moveWithCollision(object, dx, dz, playerHeight, meshList) {
	if (Math.abs(dx) <= 1e-6 && Math.abs(dz) <= 1e-6) return;
	updateColliders(meshList);
	var feetY = object.position.y - playerHeight;
	if (Math.abs(dx) > 1e-6) {
		object.position.x += Math.sign(dx) * allowedDistance(object.position.x, object.position.z, feetY, playerHeight, Math.sign(dx), 0, Math.abs(dx));
	}
	if (Math.abs(dz) > 1e-6) {
		object.position.z += Math.sign(dz) * allowedDistance(object.position.x, object.position.z, feetY, playerHeight, 0, Math.sign(dz), Math.abs(dz));
	}
}

export function updateControls(controlsEnabled, delta, controls, collidableMeshList, raycaster, raycasterFront, raycasterCamera) {
	if (controlsEnabled && !inputBlocked) {
		// delta is now passed in from main.js, do not call clock.getDelta() here
		// Prevent physics spiral when tab loses focus
		if (delta > 0.1) delta = 0.1;
		var mass = 1;
		var walkAccel = 180;
		var jumpImpulse = 12;
		var playerHeight = controls.object.playerHeight;

		if(pressedKeys[" "]) {
			if (canJump === true) {
				velocity.y += jumpImpulse;
				canJump = false;
			}
		}
		if(pressedKeys["SHIFT"] && velocity.y > -30) {
			velocity.y = -30;
		}
		if (pressedKeys["w"] || pressedKeys["ArrowUp"]) {
			velocity.z -= walkAccel * delta;
		}
		if (pressedKeys["a"] || pressedKeys["ArrowLeft"]) {
			velocity.x -= walkAccel * delta;
		}
		if (pressedKeys["s"] || pressedKeys["ArrowDown"]) {
			velocity.z += walkAccel * delta;
		}
		if (pressedKeys["d"] || pressedKeys["ArrowRight"]) {
			velocity.x += walkAccel * delta;
		}

		velocity.x = calcNewVelocityPerTick(velocity.x, delta);
		velocity.z = calcNewVelocityPerTick(velocity.z, delta);
		velocity.y -= 19.6 * delta * mass;

		// Wanted movement in world space: forward and right are the camera's axes flattened to the ground
		rightVec.setFromMatrixColumn(controls.object.matrix, 0);
		rightVec.y = 0;
		if (rightVec.lengthSq() < 1e-6) rightVec.set(1, 0, 0);
		rightVec.normalize();
		forwardVec.set(rightVec.z, 0, -rightVec.x); // up x right
		var forwardStep = -velocity.z * delta;
		var rightStep = velocity.x * delta;
		moveWithCollision(
			controls.object,
			forwardVec.x * forwardStep + rightVec.x * rightStep,
			forwardVec.z * forwardStep + rightVec.z * rightStep,
			playerHeight,
			collidableMeshList
		);

		// Head check: prevent jumping through ceiling
		if (velocity.y > 0) {
			// Create upward raycaster from eye position
			const headRaycaster = new THREE.Raycaster(
				controls.object.position,
				new THREE.Vector3(0, 1, 0),
				0,
				velocity.y * delta + 0.5
			);
			const headHits = headRaycaster.intersectObjects(collidableMeshList, true);
			if (headHits.length > 0) {
				// Hit ceiling, stop upward movement
				velocity.y = 0;
			}
		}

		// Calculate proposed new Y position before applying movement
		var newY = controls.object.position.y + (velocity.y * delta);
		
		// Raycast from the proposed new position to detect ground BEFORE moving there
		tempVec.set(controls.object.position.x, newY, controls.object.position.z);
		raycaster.ray.origin.copy(tempVec);

		var groundHits = raycaster.intersectObjects(collidableMeshList, true);
		var onGround = false;

		// The ground is the first surface at or below knee height. Anything higher between eye and
		// knee is a table top, a bunk or a ceiling: skip it and keep looking further down, otherwise
		// the player has no ground at all and falls through the floor.
		var feetNow = controls.object.position.y - playerHeight;
		var groundHit = null;
		for (var g = 0; g < groundHits.length; g++) {
			if (groundHits[g].point.y <= feetNow + 1.5) { groundHit = groundHits[g]; break; }
		}

		if (groundHit) {
			var groundY = groundHit.point.y;
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
		if (groundHit) {
			toDisplay += "<tr><td>groundY:</td><td>" + reduceFloatPrecision(groundHit.point.y) + "</td></tr>";
		}
		toDisplay += "</table>";

		showMessageContent(toDisplay);

    }
}
