import * as THREE from 'three';
import { collisionDetection } from './collision.mjs';
import { showMessageContent } from './splashScreen.mjs';
import * as transformModule from './transform.mjs';
import * as bulletControl from './bulletControl.mjs';

// Constants
const MAX_VELOCITY = 12;
const WALK_ACCEL = 180;
const JUMP_IMPULSE = 12;
const GRAVITY = 19.6;
const PLAYER_COLLISION_RADIUS = 0.8;
const BODY_HALF_WIDTH = 0.6;
const SHOULDER_OFFSET = 0.55;
const STEP_HEIGHT = 1.2;
const BOX_MAX_FOOTPRINT = 8;
const FPS_CAP = 10;

// Movement state
let moveForward, moveBackward, moveLeft, moveRight, canJump;
let botAggressive = 0;
let hasMoved = true;

// Control state
let inputBlocked = false;
let debugOverlayVisible = false;

// Reusable objects to avoid allocations
const velocity = new THREE.Vector3();
const tempVec = new THREE.Vector3();
const originVec = new THREE.Vector3();
const normalVec = new THREE.Vector3();
const rotationAxis = new THREE.Vector3(0, 1, 0);
const sweepDir = new THREE.Vector3();
const sweepSide = new THREE.Vector3();
const forwardVec = new THREE.Vector3();
const rightVec = new THREE.Vector3();
const reachPoint = new THREE.Vector3();

// Collision system state
const colliderCache = new WeakMap();
let boxColliders = [];
let rayColliders = [];
let rayCandidates = [];

// References
let renderer;
let scene;
let currentBody;
let lastObject;
let controls;

// Performance settings
const neverBoxes = { Ramp: true, Sand: true, Hallway: true, FullHallway: true };

// Object pools for collision detection
const rayCasterPool = [];
function getRaycaster() {
	if (rayCasterPool.length > 0) {
		return rayCasterPool.pop();
	}
	return new THREE.Raycaster();
}
function returnRaycaster(raycaster) {
	raycaster.near = 0;
	raycaster.far = 0;
	rayCasterPool.push(raycaster);
}

// Wall raycaster (reused)
const wallRaycaster = new THREE.Raycaster();

function toggleDebugOverlay() {
	debugOverlayVisible = !debugOverlayVisible;
	const el = document.getElementById("message");
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
	const el = document.getElementById("message");
	if (el) el.classList.remove("hidden");
}

// While the player is busted: no walking, no jumping, no shooting
export function setInputBlocked(blocked) {
	inputBlocked = !!blocked;
	if (inputBlocked) resetMovement();
}

// Forget held keys and any leftover speed, e.g. after a respawn
export function resetMovement() {
	velocity.set(0, 0, 0);
	const keys = Object.keys(pressedKeys);
	for (let i = 0; i < keys.length; i++) {
		pressedKeys[keys[i]] = false;
	}
	canJump = true;
}

// Key state tracking
const pressedKeys = {};

export function onMouseDown(e) {
	if (inputBlocked) return;
	switch (e.button) {
		case 0: // left mouse click
			pressedKeys["LMB"] = true;
			bulletControl.addBullet(renderer);
			break;
	}
}

export function onMouseUp(e) {
	switch (e.button) {
		case 0: // left mouse click end
			pressedKeys["LMB"] = false;
			break;
	}
}

export function onKeyDown(e) {
	if (inputBlocked) return;
	hasMoved = true;
	const code = e.code;
	
	if (code === "Space") {
		pressedKeys[" "] = true;
	} else if (code === "ShiftLeft" || code === "ShiftRight") {
		pressedKeys["SHIFT"] = true;
	} else if (code === "ArrowLeft") {
		pressedKeys["ArrowLeft"] = true;
	} else if (code === "ArrowUp") {
		pressedKeys["ArrowUp"] = true;
	} else if (code === "ArrowRight") {
		pressedKeys["ArrowRight"] = true;
	} else if (code === "ArrowDown") {
		pressedKeys["ArrowDown"] = true;
	} else if (code === "KeyA") {
		pressedKeys["a"] = true;
	} else if (code === "KeyB") {
		botAggressive = botAggressive === 0 ? 1 : 0;
	} else if (code === "KeyD") {
		pressedKeys["d"] = true;
	} else if (code === "KeyE") {
		if (lastObject) transformModule.rotate(lastObject, rotationAxis, -5);
	} else if (code === "KeyO") {
		botAggressive = 0;
	} else if (code === "KeyQ") {
		if (lastObject) transformModule.rotate(lastObject, rotationAxis, 5);
	} else if (code === "KeyS") {
		pressedKeys["s"] = true;
	} else if (code === "KeyT") {
		if (lastObject) transformModule.triggerObject([{ object: lastObject }]);
	} else if (code === "KeyW") {
		pressedKeys["w"] = true;
	} else if (code === "KeyY") {
		if (lastObject) transformModule.triggerDrop(lastObject);
	} else if (code === "KeyH") {
		toggleDebugOverlay();
	} else if (code === "KeyZ") {
		zoom();
	}
}

export function onKeyUp(e) {
	const code = e.code;
	
	if (code === "Space") {
		pressedKeys[" "] = false;
	} else if (code === "ShiftLeft" || code === "ShiftRight") {
		pressedKeys["SHIFT"] = false;
	} else if (code === "ArrowLeft") {
		pressedKeys["ArrowLeft"] = false;
	} else if (code === "ArrowUp") {
		pressedKeys["ArrowUp"] = false;
	} else if (code === "ArrowRight") {
		pressedKeys["ArrowRight"] = false;
	} else if (code === "ArrowDown") {
		pressedKeys["ArrowDown"] = false;
	} else if (code === "KeyA") {
		pressedKeys["a"] = false;
	} else if (code === "KeyD") {
		pressedKeys["d"] = false;
	} else if (code === "KeyS") {
		pressedKeys["s"] = false;
	} else if (code === "KeyW") {
		pressedKeys["w"] = false;
	}
	
	// Reset hasMoved if no movement keys are pressed
	if (!pressedKeys["w"] && !pressedKeys["a"] && !pressedKeys["s"] && !pressedKeys["d"] &&
		!pressedKeys["ArrowUp"] && !pressedKeys["ArrowLeft"] && !pressedKeys["ArrowDown"] && !pressedKeys["ArrowRight"]) {
		hasMoved = false;
	}
}

function calcNewVelocityPerTick(oldVelocity, deltaTick) {
	const newVelocity = oldVelocity * Math.exp(-deltaTick * FPS_CAP);
	if (Math.abs(newVelocity) < 0.1) return 0;
	if (Math.abs(newVelocity) > MAX_VELOCITY) return Math.sign(oldVelocity) * MAX_VELOCITY;
	return newVelocity;
}

function reduceFloatPrecision(toReduce) {
	return toReduce.toFixed(4);
}

// Sort the collidable objects into boxes and ray targets
function updateColliders(meshList) {
	const now = performance.now();
	boxColliders.length = 0;
	rayCandidates.length = 0;

	for (let i = 0; i < meshList.length; i++) {
		const object = meshList[i];
		let entry = colliderCache.get(object);
		const moves = object.playerid !== undefined || (object.userData && object.userData.isOpenable !== undefined);

		if (!entry) {
			entry = { box: new THREE.Box3(), time: -1e9, isBox: false };
			colliderCache.set(object, entry);
		}

		if (moves || now - entry.time > 2000) {
			entry.box.setFromObject(object);
			const footprint = Math.max(entry.box.max.x - entry.box.min.x, entry.box.max.z - entry.box.min.z);
			entry.isBox = !entry.box.isEmpty() && footprint <= BOX_MAX_FOOTPRINT && !neverBoxes[object.constructor.name];
			entry.time = now;
		}

		if (entry.isBox) {
			boxColliders.push(entry.box);
		} else {
			rayCandidates.push({ object: object, box: entry.box });
		}
	}
}

function allowedByBoxes(x, z, feetY, playerHeight, dirX, dirZ, distance) {
	const low = feetY + STEP_HEIGHT;
	const high = feetY + playerHeight - 0.2;
	let allowed = distance;

	for (let i = 0; i < boxColliders.length; i++) {
		const box = boxColliders[i];
		if (box.max.y < low || box.min.y > high) continue;

		const overlapX = x + BODY_HALF_WIDTH > box.min.x && x - BODY_HALF_WIDTH < box.max.x;
		const overlapZ = z + BODY_HALF_WIDTH > box.min.z && z - BODY_HALF_WIDTH < box.max.z;

		if (overlapX && overlapZ) continue; // already inside

		let gap;
		if (dirX !== 0) {
			if (!overlapZ) continue;
			gap = dirX > 0 ? box.min.x - (x + BODY_HALF_WIDTH) : (x - BODY_HALF_WIDTH) - box.max.x;
		} else {
			if (!overlapX) continue;
			gap = dirZ > 0 ? box.min.z - (z + BODY_HALF_WIDTH) : (z - BODY_HALF_WIDTH) - box.max.z;
		}

		if (gap >= -1e-6 && gap < allowed) allowed = Math.max(0, gap);
	}

	return allowed;
}

function allowedByRays(x, z, feetY, playerHeight, dirX, dirZ, distance) {
	let allowed = distance;
	const heights = [feetY + STEP_HEIGHT, feetY + playerHeight * 0.5, feetY + playerHeight - 1.0];

	sweepDir.set(dirX, 0, dirZ);
	sweepSide.set(-dirZ, 0, dirX);
	
	wallRaycaster.near = 0;
	wallRaycaster.far = distance + PLAYER_COLLISION_RADIUS;

	for (let h = 0; h < heights.length; h++) {
		for (let side = -1; side <= 1; side++) {
			originVec.set(
				x + sweepSide.x * SHOULDER_OFFSET * side,
				heights[h],
				z + sweepSide.z * SHOULDER_OFFSET * side
			);
			wallRaycaster.set(originVec, sweepDir);
			const hits = wallRaycaster.intersectObjects(rayColliders, true);

			for (let i = 0; i < hits.length; i++) {
				if (!hits[i].face) continue;
				normalVec.copy(hits[i].face.normal);
				normalVec.transformDirection(hits[i].object.matrixWorld);
				if (Math.abs(normalVec.y) >= 0.5) continue; // floor, ramp or ceiling
				allowed = Math.min(allowed, hits[i].distance - PLAYER_COLLISION_RADIUS);
				break;
			}
		}
	}

	return Math.max(0, allowed);
}

function allowedDistance(x, z, feetY, playerHeight, dirX, dirZ, distance) {
	const byBoxes = allowedByBoxes(x, z, feetY, playerHeight, dirX, dirZ, distance);
	if (byBoxes <= 0) return 0;
	return Math.min(byBoxes, allowedByRays(x, z, feetY, playerHeight, dirX, dirZ, byBoxes));
}

function selectRayColliders(x, y, z, reach) {
	rayColliders.length = 0;
	reachPoint.set(x, y, z);

	for (let i = 0; i < rayCandidates.length; i++) {
		const candidate = rayCandidates[i];
		if (candidate.box.isEmpty() || candidate.box.distanceToPoint(reachPoint) <= reach) {
			rayColliders.push(candidate.object);
		}
	}
}

function moveWithCollision(object, dx, dz, playerHeight, meshList) {
	if (Math.abs(dx) <= 1e-6 && Math.abs(dz) <= 1e-6) return;
	
	updateColliders(meshList);
	const feetY = object.position.y - playerHeight;
	selectRayColliders(
		object.position.x,
		feetY + playerHeight * 0.5,
		object.position.z,
		Math.abs(dx) + Math.abs(dz) + PLAYER_COLLISION_RADIUS + 1
	);

	if (Math.abs(dx) > 1e-6) {
		object.position.x += Math.sign(dx) * allowedDistance(
			object.position.x,
			object.position.z,
			feetY,
			playerHeight,
			Math.sign(dx),
			0,
			Math.abs(dx)
		);
	}

	if (Math.abs(dz) > 1e-6) {
		object.position.z += Math.sign(dz) * allowedDistance(
			object.position.x,
			object.position.z,
			feetY,
			playerHeight,
			0,
			Math.sign(dz),
			Math.abs(dz)
		);
	}
}

// Diagnostics: what would stop a move of `distance` from (x, z) in direction (dirX, dirZ)?
export function explainCollision(x, z, feetY, playerHeight, dirX, dirZ, distance) {
	const found = [];
	const low = feetY + STEP_HEIGHT;
	const high = feetY + playerHeight - 0.2;

	for (let i = 0; i < boxColliders.length; i++) {
		const one = [boxColliders[i]];
		const saved = boxColliders;
		boxColliders = one;
		const a = allowedByBoxes(x, z, feetY, playerHeight, dirX, dirZ, distance);
		boxColliders = saved;
		if (a < distance) {
			found.push({
				kind: "box",
				allowed: a,
				min: one[0].min.toArray(),
				max: one[0].max.toArray(),
				low: low,
				high: high
			});
		}
	}

	const heights = [feetY + STEP_HEIGHT, feetY + playerHeight * 0.5, feetY + playerHeight - 1.0];
	sweepDir.set(dirX, 0, dirZ);
	sweepSide.set(-dirZ, 0, dirX);
	wallRaycaster.near = 0;
	wallRaycaster.far = distance + PLAYER_COLLISION_RADIUS;

	for (let h = 0; h < heights.length; h++) {
		for (let side = -1; side <= 1; side++) {
			originVec.set(
				x + sweepSide.x * SHOULDER_OFFSET * side,
				heights[h],
				z + sweepSide.z * SHOULDER_OFFSET * side
			);
			wallRaycaster.set(originVec, sweepDir);
			const hits = wallRaycaster.intersectObjects(rayColliders, true);

			for (let k = 0; k < hits.length; k++) {
				if (!hits[k].face) continue;
				normalVec.copy(hits[k].face.normal);
				normalVec.transformDirection(hits[k].object.matrixWorld);
				if (Math.abs(normalVec.y) >= 0.5) continue;

				let owner = hits[k].object;
				while (owner.parent && owner.parent.type !== "Scene") {
					owner = owner.parent;
				}

				found.push({
					kind: "ray",
					height: heights[h],
					side: side,
					allowed: hits[k].distance - PLAYER_COLLISION_RADIUS,
					point: hits[k].point.toArray(),
					mesh: hits[k].object.name,
					owner: owner.name || owner.constructor.name
				});
				break;
			}
		}
	}

	return found;
}

let cameraDirection = new THREE.Vector3();

export function updateControls(controlsEnabled, delta, controlsParam, collidableMeshList, raycaster, raycasterFront, raycasterCamera) {
	controls = controlsParam;
	
	if (controlsEnabled && !inputBlocked) {
		// Prevent physics spiral when tab loses focus
		if (delta > 0.1) delta = 0.1;

		const mass = 1;
		const playerHeight = controls.object.playerHeight;

		// Handle jump
		if (pressedKeys[" "]) {
			if (canJump === true) {
				velocity.y += JUMP_IMPULSE;
				canJump = false;
			}
		}

		// Handle crouch
		if (pressedKeys["SHIFT"] && velocity.y > -30) {
			velocity.y = -30;
		}

		// Handle movement input
		if (pressedKeys["w"] || pressedKeys["ArrowUp"]) {
			velocity.z -= WALK_ACCEL * delta;
		}
		if (pressedKeys["a"] || pressedKeys["ArrowLeft"]) {
			velocity.x -= WALK_ACCEL * delta;
		}
		if (pressedKeys["s"] || pressedKeys["ArrowDown"]) {
			velocity.z += WALK_ACCEL * delta;
		}
		if (pressedKeys["d"] || pressedKeys["ArrowRight"]) {
			velocity.x += WALK_ACCEL * delta;
		}

		// Apply damping
		velocity.x = calcNewVelocityPerTick(velocity.x, delta);
		velocity.z = calcNewVelocityPerTick(velocity.z, delta);
		velocity.y -= GRAVITY * delta * mass;

		// Calculate movement vectors
		rightVec.setFromMatrixColumn(controls.object.matrix, 0);
		rightVec.y = 0;
		if (rightVec.lengthSq() < 1e-6) rightVec.set(1, 0, 0);
		rightVec.normalize();
		forwardVec.set(rightVec.z, 0, -rightVec.x);

		const forwardStep = -velocity.z * delta;
		const rightStep = velocity.x * delta;

		moveWithCollision(
			controls.object,
			forwardVec.x * forwardStep + rightVec.x * rightStep,
			forwardVec.z * forwardStep + rightVec.z * rightStep,
			playerHeight,
			collidableMeshList
		);

		// Head check: prevent jumping through ceiling
		if (velocity.y > 0) {
			const headRaycaster = getRaycaster();
			headRaycaster.set(
				controls.object.position,
				new THREE.Vector3(0, 1, 0),
				0,
				velocity.y * delta + 0.5
			);
			const headHits = headRaycaster.intersectObjects(collidableMeshList, true);
			if (headHits.length > 0) {
				velocity.y = 0;
			}
			returnRaycaster(headRaycaster);
		}

		// Calculate proposed new Y position
		const newY = controls.object.position.y + (velocity.y * delta);

		// Raycast to detect ground
		tempVec.set(controls.object.position.x, newY, controls.object.position.z);
		raycaster.ray.origin.copy(tempVec);

		const groundHits = raycaster.intersectObjects(collidableMeshList, true);
		let onGround = false;
		const feetNow = controls.object.position.y - playerHeight;
		let groundHit = null;

		for (let g = 0; g < groundHits.length; g++) {
			if (groundHits[g].point.y <= feetNow + 1.5) {
				groundHit = groundHits[g];
				break;
			}
		}

		if (groundHit) {
			const groundY = groundHit.point.y;
			const standingY = groundY + playerHeight;

			if (newY < standingY) {
				controls.object.position.y = standingY;
				velocity.y = 0;
				canJump = true;
				onGround = true;
			} else {
				controls.object.position.y = newY;
			}
		} else {
			controls.object.position.y = newY;
		}

		// Camera collision detection
		const collidingMeshesListCameraRay = raycasterCamera.intersectObjects(collidableMeshList, true);
		if (collidingMeshesListCameraRay.length > 0) {
			lastObject = collidingMeshesListCameraRay[0].object;
		}

		// Debug overlay
		let toDisplay =
			"<table id='InfoOutput'>" +
			"<tr><td>velX:</td><td>" + reduceFloatPrecision(velocity.x) + "</td><td>posX:</td><td>" + reduceFloatPrecision(controls.object.position.x) + "</td></tr>" +
			"<tr><td>velY:</td><td>" + reduceFloatPrecision(velocity.y) + "</td><td>posY:</td><td>" + reduceFloatPrecision(controls.object.position.y) + "</td></tr>" +
			"<tr><td>velZ:</td><td>" + reduceFloatPrecision(velocity.z) + "</td><td>posZ:</td><td>" + reduceFloatPrecision(controls.object.position.z) + "</td></tr>" +
			"<tr><td>FPS:</td><td>" + Math.round(1 / delta) + "</td><td>ground:</td><td>" + onGround + "</td></tr>";
		
		if (groundHit) {
			toDisplay += "<tr><td>groundY:</td><td>" + reduceFloatPrecision(groundHit.point.y) + "</td></tr>";
		}
		toDisplay += "</table>";

		showMessageContent(toDisplay);
	}
}

// Helper function for zoom
function zoom() {
	if (camera) {
		if (camera.zoom === 4) {
			camera.zoom = 1;
		} else {
			camera.zoom = 4;
		}
		camera.updateProjectionMatrix();
	}
}
