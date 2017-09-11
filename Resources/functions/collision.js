function collisionDetection(xNew, zNew, toTest) {
	var collision;
	for (var i=0; i<collidableMeshList.length; i++) {
		var homeBB = new THREE.Box3().setFromObject(collidableMeshList[i]);
		toTest.x += xNew;
		toTest.z += zNew;
		toTest.y = homeBB.max.y-(homeBB.max.y-homeBB.min.y)/2;
		
		
		if ((homeBB.containsPoint(toTest))) { /*&&
			(controls.getObject().position.x+n <= bbox.box.max.x) &&
			(controls.getObject().position.z+n >= bbox.box.min.z) &&
			(controls.getObject().position.z+n <= bbox.box.max.z)) {*/
				
			 	collision = true;
			 	break;
			} else {
				//alert(controls.getObject().position.x+" "+bbox.box.min.x+" "+bbox.box.max.x);
				//console.log(toTest);
				collision = false;
				//testpush2
			}
	}
	return collision;
}
