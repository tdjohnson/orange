// rotate object around own axis

var door;

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
			animationLock = true; // lock raycaster //not nice...shame on you
		if (object.userData.info.indexOf("Heb")>-1) {
			if(object.parent.position.z > 11.7){
					object.parent.position.z -= 0.05;
			}
			else{
				if (object.parent.position.y > 0.1){
					object.parent.position.y -= 0.1;
					
					if(object.parent.position.z > 11 && object.parent.position.z < 11.7){
						object.parent.position.z -= 0.05;
					}
					
					rotate(object, new THREE.Vector3(1,0,0),-8);
					
				}else{
					animationLock = false; // unlock raycaster //not nice...shame on you
				}
			}
		}
		else
			object.userData.isDropable = true;
	}
	else {
		
	}	
}

function triggerDoor(object) {
	if (object.userData.isOpenable == true) {
		object.userData.isOpenable = false;
			if (object.userData.info.indexOf("geschlossen")>-1) {
				object.userData.info = "offen!<br/> schließen mit T";
				door = object;
			} else if(object.userData.info.indexOf("offen")>-1) {
				object.userData.info = "geschlossen!<br/> öffne mit T";
				door = object;
			}
		doorsToAnimate = object;
	} else {
		
	}
}

function animateDoors() {
	
	if (door != null) {
		var rotFact = 1;
		if (door.userData.isOpenable == false) {
		
			if (door.userData.info.indexOf("offen")>-1) {
				if (door.parent.parent.rotation.y == Math.PI / -2) {
					rotFact = -1;
				}
					
				if (door.position.x > door.userData.startPosition-3) {
					//console.log(door.position.x+" "+door.userData.startPosition+3);
					door.position.x -= 0.1*rotFact;
				} else {
					door.userData.isOpenable = true;
					door.userData.startPosition = 0;
					doorsToAnimate[i] = null;
				}
			} else {
				if (door.position.x < door.userData.startPosition) {
					//console.log(door.position.x+" "+door.userData.startPosition);
					door.position.x += 0.1*rotFact;
				} else {
					door.userData.isOpenable = true;
					door.userData.startPosition = 0;
					doorsToAnimate[i] = null;
				}
			}
		}
	}
}