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
	if (object.userData.isDropable == true) {
		object.userData.isDropable = false;
			if (object.userData.info.indexOf("Wirf")>-1) {
				object.userData.info = "Heb mich auf";
			} else if(object.userData.info.indexOf("Heb")>-1) {
				object.userData.info = "Wirf mich runter mit Y!";
			}
	} else {
		
	}
}

function animateDrop(object) {
	// TO DO: fix angle
	if (object.userData.isDropable == false) {
		if (object.userData.info.indexOf("Heb")>-1) {
			if(object.position.z > 11.7){
					object.position.z -= 0.05;
			}
			else{
				if (object.position.y > 0.1){
					object.position.y -= 0.1;
					
					if(object.position.z > 11 && object.position.z < 11.7){
						object.position.z -= 0.05;
					}
					
					rotate(object, new THREE.Vector3(1,0,0),-8);
					
				}
			}
		}
		else
			object.userData.isDropable = true;
	}
	else {
			
	}
}
