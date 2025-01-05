import * as THREE from 'three';

var collidableObjects;

export function collisionDetection(objectToCheck, collidableMeshList) {
    const collidingObjects = []; // List to store colliding objects
	collidableObjects = [];
	collidableObjects = collidableMeshList.filter(obj => !obj.name.startsWith("PrisonCell_"));
    // Compute the bounding box for the object to check
    const objectBoundingBox = new THREE.Box3().setFromObject(objectToCheck);

    for (const collidableObject of collidableObjects) {
        // Compute the bounding box for the current collidable object
        const collidableBoundingBox = new THREE.Box3().setFromObject(collidableObject);

        // Check if the bounding boxes intersect
        if (objectBoundingBox.intersectsBox(collidableBoundingBox)) {
            collidingObjects.push(collidableObject); // Add to the list if collision detected
        }
    }

    return collidingObjects; // Return the list of colliding objects
}


/*export function collisionDetection(xNew, zNew, toTest, collidableMeshList) {
	var collision;
	for (var i=0; i<collidableMeshList.length; i++) {
		var homeBB = new THREE.Box3().setFromObject(collidableMeshList[i]);
		toTest.x += xNew;
		toTest.z += zNew;
		toTest.y = homeBB.max.y-(homeBB.max.y-homeBB.min.y)/2;
		
		
		if ((homeBB.containsPoint(toTest))) { /*&&
			(controls.object.position.x+n <= bbox.box.max.x) &&
			(controls.object.position.z+n >= bbox.box.min.z) &&
			(controls.object.position.z+n <= bbox.box.max.z)) 
				
			 	collision = true;
			 	break;
			} else {
				//alert(controls.object.position.x+" "+bbox.box.min.x+" "+bbox.box.max.x);
				//console.log(toTest);
				collision = false;
				//testcomment again
			}
	}
	return collision;
}
*/