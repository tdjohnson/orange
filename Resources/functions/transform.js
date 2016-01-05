// rotate object around own axis
function rotate(object, axis, degree) { 
	var angle = degree * Math.PI / 180;
	if(object.userData.rotatable == true){
	    var quaternion = new THREE.Quaternion();
	    quaternion.setFromAxisAngle(axis, angle);
	    object.quaternion.multiply(quaternion);
   }
}  

function triggerDrop(object) {
	if (object.userData.isOpenable == true) {
		object.userData.isOpenable = false;
			if (object.userData.info.indexOf("geschlossen")>-1) {
				object.userData.info = "offen!<br/> schließen mit T";
			} else if(object.userData.info.indexOf("offen")>-1) {
				object.userData.info = "geschlossen!<br/> öffne mit T";
			}
	} else {
		
	}
}

function animateDrop(object) {
	// TO DO: fix angle
	if (object.userData.isOpenable == false) {
		if (object.userData.info.indexOf("offen")>-1) {
			if (object.position.y > 0.1){
				object.position.y -= 0.1;
				if(object.position.z > 9){
					object.position.z -= 0.1;
				}
				if(object.position.y < 0.2){
					rotate(object, new THREE.Vector3(1,0,0),2);
				}else{
					rotate(object, new THREE.Vector3(1,0,0),2);
				}
			}
			else
				object.userData.isOpenable = true;
		} else {
			if (object.position.y < 1.9){
				object.position.y += 0.1;
				if(object.position.y > 1){
					object.position.z += 0.1;
				}
				
				if(object.position.y > 0.8){
					rotate(object, new THREE.Vector3(1,0,0),2);
				}
				else{
					rotate(object, new THREE.Vector3(1,0,0),2);
				}
			}
			else
				object.userData.isOpenable = true;
		}
	}
}
