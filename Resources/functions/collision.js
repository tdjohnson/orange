function collisionDetection() {
	var collision;
	for (var i=0; i<collidableMeshList.length; i++) {
		var bbox = new THREE.BoundingBoxHelper(collidableMeshList[i]);
		bbox.update();
		
		if ((controls.getObject().position.x >= bbox.box.min.x) &&
			(controls.getObject().position.x <= bbox.box.max.x) &&
			(controls.getObject().position.z >= bbox.box.min.z) &&
			(controls.getObject().position.z <= bbox.box.max.z)) {
	
			 	collision = false;
			 	break;
			} else {
				//alert(controls.getObject().position.x+" "+bbox.box.min.x+" "+bbox.box.max.x);
				collision = true;
			}
		
	}
	return collision;
}
