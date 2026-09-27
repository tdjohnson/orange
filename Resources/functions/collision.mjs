import * as THREE from 'three';

// Reusable Box3 instance for static objects to reduce GC pressure
const staticBox3Pool = [];
const MAX_POOL_SIZE = 50;

function getStaticBox3() {
	if (staticBox3Pool.length > 0) {
		return staticBox3Pool.pop();
	}
	return new THREE.Box3();
}

function returnStaticBox3(box) {
	if (staticBox3Pool.length < MAX_POOL_SIZE) {
		box.makeEmpty();
		staticBox3Pool.push(box);
	}
}

export function collisionDetection(objectToCheck, collidableMeshList) {
	const collidingObjects = [];
	
	// Filter out objects that should not be checked for collision
	const objectsToCheck = collidableMeshList.filter(obj => 
		!obj.name || !obj.name.startsWith("PrisonCell_")
	);
	
	// Reusable box for the object to check
	const objectBoundingBox = new THREE.Box3().setFromObject(objectToCheck);

	// Use pooled boxes for static objects
	const tempBox = getStaticBox3();

	for (const collidableObject of objectsToCheck) {
		// Get or create a box for this object
		let collidableBoundingBox = collidableObject.geometry?.boundingBox;
		
		if (!collidableBoundingBox) {
			// Create and cache the bounding box
			collidableBoundingBox = new THREE.Box3().setFromObject(collidableObject);
			if (collidableObject.geometry) {
				collidableObject.geometry.boundingBox = collidableBoundingBox;
			}
		}

		// Check if the bounding boxes intersect
		if (objectBoundingBox.intersectsBox(collidableBoundingBox)) {
			collidingObjects.push(collidableObject);
		}
	}

	// Return the pooled box
	returnStaticBox3(tempBox);

	return collidingObjects;
}
