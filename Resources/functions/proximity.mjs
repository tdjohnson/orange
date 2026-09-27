// Proximity detection module - currently unused in the codebase
// Kept for potential future use

import * as THREE from 'three';

// Reusable objects
const camMatrix = new THREE.Matrix4();
const frustum = new THREE.Frustum();
let arrow = null;

function showMessage(text) {
	// This function would display a message to the user
	// Implementation depends on the UI framework
	if (typeof window.showMessageContent === 'function') {
		window.showMessageContent(text);
	} else if (document.getElementById('message')) {
		document.getElementById('message').innerHTML = text;
	}
}

export function proximityDetector(animationLock, raycaster, scene, camera) {
	// Detect objects hit by raycaster vector
	if (animationLock) return; // Wait for running animations

	let lastObject = null;
	let lastObjectc = null;

	try {
		raycaster.set(camera.getWorldPosition(), camera.getWorldDirection());
		// showraycasthelper(); // Raycaster helper - displays raycaster as vector
		const intersects = raycaster.intersectObjects(scene.children, true);
		
		if (intersects.length > 0) {
			if (intersects[0].object.parent && intersects[0].object.parent.name && intersects[0].object.parent.name.length >= 1) {
				if (!lastObject || intersects[0].object.parent.id !== lastObject.id) {
					if (intersects[0].distance <= 6) {
						showinfo(intersects[0]);
						lastObject = intersects[0].object.parent;
						lastObjectc = intersects[0].object;
					}
				}
			}
		}

		camMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
		frustum.setFromMatrix(camMatrix);

		if (lastObjectc && !frustum.intersectsObject(lastObjectc)) {
			showMessage(" ");
			animationLock = false;
			lastObject = null;
			lastObjectc = null;
		}
	} catch (err) {
		// Silently handle errors in proximity detection
	}
}

export function showraycasthelper(scene) {
	if (arrow && arrow.parent) {
		arrow.parent.remove(arrow);
	}
	arrow = new THREE.ArrowHelper(camera.getWorldDirection(), camera.getWorldPosition(), 100, 0x00ffff);
	scene.add(arrow);
}

export function showinfo(intersect) {
	const message = intersect.object.parent?.userData?.info;
	if (message !== undefined) {
		showMessage(message);
	}
}
