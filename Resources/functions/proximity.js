function proximityDetector() {
			//detect objects hit by raycaster vector
	try{
	if(!animationLock){ // wait for running animations

		raycaster.set(camera.getWorldPosition(),camera.getWorldDirection()); //bind raycaster to camera	
		showraycasthelper();//Raycaster helper - displays raycaster as vector
		var intersects = raycaster.intersectObjects( scene.children, true); //get all object intersecting with raycast vector
		if ( intersects.length > 0 ) { //if objects are intersected
			if(intersects[0].object.parent.name.length >= 1){ //if object has a name
				if(intersects[0].object.parent.id != lastObject.id){ //do if object is new
					if(intersects[0].distance <= 6){ //only show near objects
						showinfo(intersects[0]); //show alert and log to console
						lastObject = intersects[0].object.parent; //remember last object
					}	
				}
			}
		}
	
		//detect if object previously hit by raycaster has left the field of view
		cam_matrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ); //calculate matrix for camera
		frustum.setFromMatrix(cam_matrix); //set frustum (camera view)
	
		if(!frustum.intersectsObject(lastObject)){ //if object left field of view
		
			lastObject = new THREE.Object3D(); //reset lastObject to empty object
		}
		}else{
			
		}
	}catch(err){
	}
}