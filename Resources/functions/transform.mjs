import * as THREE from 'three';

var door;
var soap;

// rotate object around own axis
export function rotate(object, axis, degree) { 
	var angle = degree * Math.PI / 180;
	if(object.userData.rotatable == true){
	    var quaternion = new THREE.Quaternion();
	    quaternion.setFromAxisAngle(axis, angle);
	    object.quaternion.multiply(quaternion);
   }
}  

//rotatable beim bot global undefined
export function rotateBot(object, axis, degree) { 
	var angle = degree * Math.PI / 180;
	    var quaternion = new THREE.Quaternion();
	    quaternion.setFromAxisAngle(axis, angle);
	    object.quaternion.multiply(quaternion);
}



export function triggerObject(intersectArray) {
	/*intersectArray.forEach(element => {
		console.log(element.object.parent.parent);
	});*/
	//we need to traverse all parentObjects, as actual objects with usereData can be hidden deep in the object tree
	var currentObj = intersectArray[0].object;
	//console.log(currentObj);
	var correctObject;
	var foundParent = false;
	while (!foundParent) {
		if (Object.hasOwn(currentObj, 'userData')) {
			if (Object.hasOwn(currentObj.userData, 'isTriggerable')) {
				console.log(currentObj);
				correctObject = currentObj;
				foundParent = true;
			}
		}
		currentObj = currentObj.parent;
	}
	switch (correctObject.userData.name) {
		case "soap": {
			triggerDrop(correctObject);
			break;
		}
		case "Door2": {
			triggerDoor(correctObject);
			break;
		}
	}
}

export function triggerDrop(object) {
	if (object.userData.isDropable == true) {
		object.userData.isDropable = false;
		soap = object;
			if (object.userData.info.indexOf("Wirf")>-1) {
				object.userData.info = "Heb mich auf";
				
			} else if(object.userData.info.indexOf("Heb")>-1) {
	
				object.userData.info = "Wirf mich runter mit Y!";
			}
	} else {
		
	}
}

export function triggerDoor(object) {
	//if (null != parentObject.object.parent.parent) {
		//var object = parentObject.object.parent.parent;
		if (object.userData.isOpenable === true) {
			object.userData.isOpenable = false;
			if (object.userData.isOpen === false) {
				object.userData.isOpen = true;
				object.userData.info = "offen!<br/> schließen mit T";
				door = object;
			} else if(object.userData.isOpen === true) {
				object.userData.isOpen = false;
				object.userData.info = "geschlossen!<br/> öffne mit T";
				door = object;
			}
		}
    //}
}

export function switchTableLight(object) {
	if(object.userData.isTurnedOn === false)
	{
		object.userData.info = "Licht an mit T";
		showMessage(object.userData.info);
		object.children[0].intensity = 0;
		object.userData.isTurnedOn = true;
	}
	else if (object.userData.isTurnedOn === true)
	{
		object.userData.info = "Licht aus mit T";
		showMessage(object.userData.info);
		object.children[0].intensity = 4;
		object.userData.isTurnedOn = false;
	}
}

export function animateDrop() {
	// TO DO: fix angle
	if (soap != null) {
		if (soap.userData.isDropable == false) {
				//animationLock = true; // lock raycaster //not nice...shame on you
			if (soap.userData.info.indexOf("Heb")>-1) {
				if(soap.position.z > 11.6){
					soap.position.z -= 0.05;
				}
				else{
					if (soap.position.y > 0.1){
						soap.position.y -= 0.1;
						
						if(soap.position.z > 11 && soap.position.z < 11.6){
							soap.position.z -= 0.05;
						}
						
						rotate(soap, new THREE.Vector3(1,0,0),-8);
						
					}else{
						//animationLock = false; // unlock raycaster //not nice...shame on you
					}
				}
			}
			else
			soap.userData.isDropable = true;
		}
		else {
			
		}
	}	
}


export function animateDoors() {
	
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
					door.userData.startPosition = door.position.x;
				}
			} else {
				if (door.position.x < door.userData.startPosition+3) {
					//console.log(door.position.x+" "+door.userData.startPosition);
					door.position.x += 0.1*rotFact;
				} else {
					door.userData.isOpenable = true;
					door.userData.startPosition = door.position.x;
				}
			}
		}
	}
}

export function animateBullets(bulletList) {
	

}


//Ausdehnung

//x:24

//y:21,3

var patrolStatus = 0;
var botRotateCounter, botArmStatus, botHit, hitDirection, rotationActive;

export function patrolRobot(botBody, botArms)
{
	//console.log("180grad");
	//console.log(Math.PI / 180 *90);
	//console.log("sein wert");
	//console.log(bot.rotation.y);
	
	if(botBody.position.x <= 43 && botBody.position.z >= 22 && patrolStatus == 0)
	{
		hitDirection = 1;
		rotationActive = 0;
		botBody.position.x += 0.1;
		botArms.position.x += 0.1;
		botRotateCounter=0;
	}
	
	else if(botBody.position.x >= 43  && botBody.position.z == 22  && botRotateCounter<18)//&& bot.rotation.y >  Math.PI / -1024) //(Math.PI / 180 *180))
	{
		rotationActive = 1;
		if(botArmStatus != 0)
		{
			//t(botArms,new THREE.Vector3(1,0,0), botArmStatus); //object,axis,degree
			botArmStatus = 0;
		}
		
		rotateBot(botBody,new THREE.Vector3(0,1,0),5 ); //object,axis,degree
		rotateBot(botArms,new THREE.Vector3(0,1,0),5 ); //object,axis,degree
		
		
		botRotateCounter++;
		patrolStatus = 1;
	}
	
	else if(botBody.position.x >= 43 && botBody.position.z > 18)
	{
		hitDirection = 0;
		rotationActive = 0;
		botBody.position.z -= 0.1;
		botArms.position.z -= 0.1;
		botRotateCounter=0;
	}
	
	else if(botBody.position.x >= 43  && botBody.position.z <= 18  && botRotateCounter<18)//&& bot.rotation.y >  Math.PI / -1023) //(Math.PI / 180 *180))
	{
		rotationActive = 1;
		rotateBot(botBody,new THREE.Vector3(0,1,0),5 ); //object,axis,degree
		rotateBot(botArms,new THREE.Vector3(0,1,0),5 ); //object,axis,degree
		botRotateCounter++;
	}
	
	
	else if(botBody.position.x > 4  && botBody.position.z <= 18 && botBody.rotation.y) //(Math.PI / 180 *180))
	{
		hitDirection = -1;
		rotationActive = 0;
		botBody.position.x -= 0.1;
		botArms.position.x -= 0.1;
		botRotateCounter=0;
	}

	else if(botBody.position.x <= 4  && botBody.position.z <= 18  && botRotateCounter<18)//&& bot.rotation.y >  Math.PI / -1023) //(Math.PI / 180 *180))
	{
		rotationActive = 1;
		if(botArmStatus != 0)
		{
			//rotateBot(botArms,new THREE.Vector3(1,0,0), botArmStatus); //object,axis,degree
			botArmStatus = 0;
		}
		rotateBot(botBody,new THREE.Vector3(0,1,0),5 ); //object,axis,degree
		rotateBot(botArms,new THREE.Vector3(0,1,0),5 ); //object,axis,degree
		botRotateCounter++;
	}
	
	else if(botBody.position.x <= 43 && botBody.position.z < 22)
	{
		hitDirection = 0;
		rotationActive = 0;
		botBody.position.z += 0.1;
		botArms.position.z += 0.1;
		botRotateCounter=0;
	}
	
	else if(botBody.position.x <= 43  && botBody.position.z >= 22  && botRotateCounter<18 && patrolStatus == 1)//&& bot.rotation.y >  Math.PI / -1023) //(Math.PI / 180 *180))
	{
		rotationActive = 1;
		if(botArmStatus != 0)
		{
			rotateBot(botArms,new THREE.Vector3(1,0,0), botArmStatus); //object,axis,degree
			botArmStatus = 0;
		}
		
		rotateBot(botBody,new THREE.Vector3(0,1,0),5 ); //object,axis,degree
		rotateBot(botArms,new THREE.Vector3(0,1,0),5 ); //object,axis,degree
		botRotateCounter++;
		
		if(botRotateCounter == 18)
			patrolStatus = 0;
	}
}

export function robotAttack()
{
	
	if(rotationActive != 1 && hitDirection != 0)
	{
		if(botHit == 0)
		{
			rotateBot(botArms,new THREE.Vector3(1,0,0), -5);//(5 * hitDirection) ); //object,axis,degree
			botArmStatus += 5;
			if(botArmStatus >= 120)
			{
				botHit = 1;
			}			
		}
		
		else if(botHit == 1)
		{
			rotateBot(botArms,new THREE.Vector3(1,0,0), 5); //(-5 * hitDirection) ); //object,axis,degree
			botArmStatus -= 5;
			if(botArmStatus <= 20)
			{
				botHit = 0;
			}	
		}
	}	
}
