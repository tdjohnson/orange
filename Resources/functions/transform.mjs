import * as THREE from 'three';
import * as bulletControl from './bulletControl.mjs';

var door;
var soap;
var droppingSoaps = []; // soaps that are falling right now, several players can drop one at the same time

// Door animation state
let door = null;
let droppingSoaps = [];

// Bot patrol state
let patrolStatus = 0;
let botRotateCounter = 0;
let botArmStatus = 0;
let botHit = 0;
let hitDirection = 1;
let rotationActive = 0;

// Reusable vectors
const tempVec3A = new THREE.Vector3();
const tempVec3B = new THREE.Vector3();
const tempVec3C = new THREE.Vector3();

/**
 * Rotate object around its own axis
 */
export function rotate(object, axis, degree) {
	if (object.userData.rotatable === true) {
		const angle = degree * Math.PI / 180;
		const quaternion = new THREE.Quaternion();
		quaternion.setFromAxisAngle(axis, angle);
		object.quaternion.multiply(quaternion);
	}
}

/**
 * Rotate bot without checking rotatable flag
 */
export function rotateBot(object, axis, degree) {
	const angle = degree * Math.PI / 180;
	const quaternion = new THREE.Quaternion();
	quaternion.setFromAxisAngle(axis, angle);
	object.quaternion.multiply(quaternion);
}

/**
 * Trigger object based on userData
 */
export function triggerObject(intersectArray) {
	/*intersectArray.forEach(element => {
		console.log(element.object.parent.parent);
	});*/
	//we need to traverse all parentObjects, as actual objects with usereData can be hidden deep in the object tree
	var currentObj = intersectArray[0].object;
	//console.log(currentObj);
	var correctObject;
	var foundParent = false;
	
	// Check current object and all parents
	while (currentObj) {
		if (currentObj.userData && currentObj.userData.isTriggerable) {
			console.log(currentObj);
			correctObject = currentObj;
			foundParent = true;
			break;
		}
		currentObj = currentObj.parent;
	}
	
	if (!correctObject) {
		return; // No triggerable object found
	}
	
	switch (correctObject.userData.name) {
		case "soap": {
			if (correctObject.userData.isDropable == true) {
				triggerDrop(correctObject);
				// tell the other players, they play the same animation
				if (typeof window.events2main === 'function' && correctObject.userData.syncId) {
					window.events2main("soap", correctObject.userData.syncId);
				}
			}
			break;
		case "Door2":
			triggerDoor(correctObject);
			break;
		}
		default:
			// Unknown triggerable object, do nothing
			break;
	}
}

/**
 * Trigger drop animation for soap
 */
export function triggerDrop(object) {
	if (object.userData.isDropable === true) {
		object.userData.isDropable = false;
		soap = object;
		if (droppingSoaps.indexOf(object) === -1) droppingSoaps.push(object);
			if (object.userData.info.indexOf("Wirf")>-1) {
				object.userData.info = "Heb mich auf";
				
			} else if(object.userData.info.indexOf("Heb")>-1) {
	
				object.userData.info = "Wirf mich runter mit Y!";
			}
	} else {
		
	}
}

/**
 * Trigger door open/close
 */
export function triggerDoor(object) {
	if (object.userData.isOpenable === true) {
		object.userData.isOpenable = false;
		if (object.userData.isOpen === false) {
			object.userData.isOpen = true;
			object.userData.info = "offen!<br/> schlie\u00dfen mit T";
			door = object;
		} else if (object.userData.isOpen === true) {
			object.userData.isOpen = false;
			object.userData.info = "geschlossen!<br/> \u00f6ffne mit T";
			door = object;
		}
	}
}

/**
 * Drop soap by sync ID (called from multiplayer)
 */
export function dropSoapById(scene, syncId) {
	let found = null;
	scene.traverse(function(object) {
		if (!found && object.userData && object.userData.syncId === syncId) {
			found = object;
		}
	});
	if (found) triggerDrop(found);
	return found !== null;
}

// Another player dropped a soap: find it by its id and drop it here as well
export function dropSoapById(scene, syncId) {
	var found = null;
	scene.traverse(function (object) {
		if (!found && object.userData && object.userData.syncId === syncId) found = object;
	});
	if (found) triggerDrop(found);
	return found !== null;
}

export function animateDrop() {
	// TO DO: fix angle
	for (var i = droppingSoaps.length - 1; i >= 0; i--) {
		var falling = droppingSoaps[i];
		if (falling.userData.isDropable == false) {
			if (falling.userData.info.indexOf("Heb")>-1) {
				if(falling.position.z > 11.6){
					falling.position.z -= 0.05;
				}
				else{
					if (falling.position.y > 0.1){
						falling.position.y -= 0.1;
						
						if(falling.position.z > 11 && falling.position.z < 11.6){
							falling.position.z -= 0.05;
						}
						
						rotate(falling, new THREE.Vector3(1,0,0),-8);
						
					}else{
						droppingSoaps.splice(i, 1); // it lies on the floor
					}
				}
			} else {
				falling.userData.isDropable = true;
				droppingSoaps.splice(i, 1);
			}
			else {
				falling.userData.isDropable = true;
				droppingSoaps.splice(i, 1);
			}
		}
		else {
			droppingSoaps.splice(i, 1);
		}
	}
}

/**
 * Animate doors
 */
export function animateDoors() {
	if (door !== null) {
		let rotFact = 1;
		
		if (door.userData.isOpenable === false) {
			if (door.userData.info.includes("offen")) {
				if (door.parent.parent.rotation.y === Math.PI / -2) {
					rotFact = -1;
				}

				if (door.position.x > door.userData.startPosition - 3) {
					door.position.x -= 0.1 * rotFact;
				} else {
					door.userData.isOpenable = true;
					door.userData.startPosition = door.position.x;
				}
			} else {
				if (door.position.x < door.userData.startPosition + 3) {
					door.position.x += 0.1 * rotFact;
				} else {
					door.userData.isOpenable = true;
					door.userData.startPosition = door.position.x;
				}
			}
		}
	}
}

export function animateBullets(bulletList, delta, collidableMeshList) {
	var gravity = 9.8;
	var lifetime = 3000; // 3 seconds in milliseconds
	var currentTime = Date.now();
	var bulletRaycaster = new THREE.Raycaster();
	for (let i = bulletList.length - 1; i >= 0; i--) {
		var singleBullet = bulletList[i];
		
		// Apply gravity to velocity
		singleBullet.velocity.y -= gravity * delta;
		
		// Store old position for collision detection
		var oldPosition = singleBullet.position.clone();
		
		// Update position based on velocity
		singleBullet.position.addScaledVector(singleBullet.velocity, delta);
		
		// Perform raycast from old position to new position to detect collisions
		var movementVector = new THREE.Vector3().subVectors(singleBullet.position, oldPosition);
		bulletRaycaster.set(oldPosition, movementVector.clone().normalize());
		bulletRaycaster.far = movementVector.length();
		bulletRaycaster.near = 0;
		
		var hits = bulletRaycaster.intersectObjects(collidableMeshList, true);
		
		if (hits.length > 0) {
			// Find the player object and send hit event (only for local bullets)
			var player = hits[0].object;
			while (player && player.playerid === undefined) player = player.parent;
			if (!singleBullet.isRemote && player) {
				bulletControl.shoot(player.playerid);
			}
			// Remove bullet on any collision (player or wall)
			if (singleBullet.parent) {
				singleBullet.parent.remove(singleBullet);
			}
			bulletList.splice(i, 1);
			continue; // Skip lifetime check for collided bullets
		}
		
		// Check if bullet has exceeded its lifetime
		if (singleBullet.birthday && (currentTime - singleBullet.birthday) > lifetime) {
			// Remove bullet from scene
			if (singleBullet.parent) {
				singleBullet.parent.remove(singleBullet);
			}
			// Remove from array
			bulletList.splice(i, 1);
		}
	}
}

	for (let i = bulletList.length - 1; i >= 0; i--) {
		const singleBullet = bulletList[i];

		// Apply gravity
		singleBullet.velocity.y -= GRAVITY * delta;

		// Store old position
		const oldPosition = tempVec3A.copy(singleBullet.position);

		// Update position
		singleBullet.position.addScaledVector(singleBullet.velocity, delta);

		// Raycast for collision
		const movementVector = tempVec3B.subVectors(singleBullet.position, oldPosition);
		bulletRaycaster.set(oldPosition, movementVector.clone().normalize());
		bulletRaycaster.far = movementVector.length();
		bulletRaycaster.near = 0;

		const hits = bulletRaycaster.intersectObjects(collidableMeshList, true);

		if (hits.length > 0) {
			// Find player object
			let player = hits[0].object;
			while (player && player.playerid === undefined) {
				player = player.parent;
			}

			// Send hit event for local bullets
			if (!singleBullet.isRemote && player) {
				bulletControl.shoot(player.playerid);
			}

			// Remove bullet on collision
			if (singleBullet.parent) {
				singleBullet.parent.remove(singleBullet);
			}
			bulletList.splice(i, 1);
			continue;
		}

		// Check lifetime
		if (singleBullet.birthday && (now - singleBullet.birthday) > BULLET_LIFETIME) {
			if (singleBullet.parent) {
				singleBullet.parent.remove(singleBullet);
			}
			bulletList.splice(i, 1);
		}
	}
}

/**
 * Patrol robot AI
 */
export function patrolRobot(botBody, botArms) {
	if (botBody.position.x <= 43 && botBody.position.z >= 22 && patrolStatus === 0) {
		hitDirection = 1;
		rotationActive = 0;
		botBody.position.x += 0.1;
		botArms.position.x += 0.1;
		botRotateCounter = 0;
	} else if (botBody.position.x >= 43 && botBody.position.z === 22 && botRotateCounter < 18) {
		rotationActive = 1;
		if (botArmStatus !== 0) {
			botArmStatus = 0;
		}
		rotateBot(botBody, tempVec3A.set(0, 1, 0), 5);
		rotateBot(botArms, tempVec3A.set(0, 1, 0), 5);
		botRotateCounter++;
		patrolStatus = 1;
	} else if (botBody.position.x >= 43 && botBody.position.z > 18) {
		hitDirection = 0;
		rotationActive = 0;
		botBody.position.z -= 0.1;
		botArms.position.z -= 0.1;
		botRotateCounter = 0;
	} else if (botBody.position.x >= 43 && botBody.position.z <= 18 && botRotateCounter < 18) {
		rotationActive = 1;
		rotateBot(botBody, tempVec3A.set(0, 1, 0), 5);
		rotateBot(botArms, tempVec3A.set(0, 1, 0), 5);
		botRotateCounter++;
	} else if (botBody.position.x > 4 && botBody.position.z <= 18 && botBody.rotation.y) {
		hitDirection = -1;
		rotationActive = 0;
		botBody.position.x -= 0.1;
		botArms.position.x -= 0.1;
		botRotateCounter = 0;
	} else if (botBody.position.x <= 4 && botBody.position.z <= 18 && botRotateCounter < 18) {
		rotationActive = 1;
		if (botArmStatus !== 0) {
			botArmStatus = 0;
		}
		rotateBot(botBody, tempVec3A.set(0, 1, 0), 5);
		rotateBot(botArms, tempVec3A.set(0, 1, 0), 5);
		botRotateCounter++;
	} else if (botBody.position.x <= 43 && botBody.position.z < 22) {
		hitDirection = 0;
		rotationActive = 0;
		botBody.position.z += 0.1;
		botArms.position.z += 0.1;
		botRotateCounter = 0;
	} else if (botBody.position.x <= 43 && botBody.position.z >= 22 && botRotateCounter < 18 && patrolStatus === 1) {
		rotationActive = 1;
		if (botArmStatus !== 0) {
			rotateBot(botArms, tempVec3A.set(1, 0, 0), botArmStatus);
			botArmStatus = 0;
		}
		rotateBot(botBody, tempVec3A.set(0, 1, 0), 5);
		rotateBot(botArms, tempVec3A.set(0, 1, 0), 5);
		botRotateCounter++;
		if (botRotateCounter === 18) {
			patrolStatus = 0;
		}
	}
}

/**
 * Bot attack animation
 */
export function robotAttack() {
	if (rotationActive !== 1 && hitDirection !== 0) {
		if (botHit === 0) {
			rotateBot(botArms, tempVec3A.set(1, 0, 0), -5);
			botArmStatus += 5;
			if (botArmStatus >= 120) {
				botHit = 1;
			}
		} else if (botHit === 1) {
			rotateBot(botArms, tempVec3A.set(1, 0, 0), 5);
			botArmStatus -= 5;
			if (botArmStatus <= 20) {
				botHit = 0;
			}
		}
	}
}

/**
 * Reset patrol state
 */
export function resetPatrolState() {
	patrolStatus = 0;
	botRotateCounter = 0;
	botArmStatus = 0;
	botHit = 0;
	hitDirection = 1;
	rotationActive = 0;
}

