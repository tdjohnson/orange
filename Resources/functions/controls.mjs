import * as THREE from 'three';
import {collisionDetection} from './collision.mjs'
import {showMessageContent} from './splashScreen.mjs';

var moveForward,
    moveBackward,
    moveLeft,
    moveRight,
    canJump,
	botAggressive;
	var hasMoved = false;
	
var velocity = new THREE.Vector3();
var pressedKeys = new Map();

export function initControls() {
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);
	canJump = true;
}

export function onKeyDown(e) {
	hasMoved = true;
    switch (e.keyCode) {
		case 32: // space
			pressedKeys.set(" ", true)
		    break;
		case 37: // left
    	case 38: // up
		case 39: // right
		case 40: // down
		
		case 65: // a
			pressedKeys.set("a", true)
			break;
		case 66: //b
			{
				if(botAggressive == 0) {
					botAggressive = 1;
				} else {
					botAggressive = 0;
				}
			}
			break;
		case 68: // d
			pressedKeys.set("d", true)
			break;
		case 69: // e
	 		rotate(lastObject,new THREE.Vector3(0,1,0),-5); //object,axis,degree
			 break;
		case 79: //o
			botAggressive = 0;
			break;
		case 81: // q
			rotate(lastObject,new THREE.Vector3(0,1,0),5 ); //object,axis,degree
			break;
  		case 83: // s
		  	pressedKeys.set("s", true)	
			break;
		case 84: //t
	    	triggerDoor(lastObject);
	    	switchTableLight(lastObject);
			break;    	
  		case 87: // w
		  pressedKeys.set("w", true);
		  break;	
  		case 89: //y
  			triggerDrop(lastObject);
			break;
	   	case 90: //z
	   		zoom();
			break;
    	}
  }
  


export function onKeyUp(e) {
	switch(e.keyCode) {
		case 32: // space
			pressedKeys.set(" ", false)
			break;
		case 37: // left
    	case 38: // up
		case 39: // right
	  	case 40: // down
	  	case 65: // a
		  pressedKeys.set("a", false)
		  break;
	  	case 68: // d
		  pressedKeys.set("d", false)
		  break;
	  	case 83: // s
		  pressedKeys.set("s", false)
		  break;   
	  	case 87: // w
		  pressedKeys.set("w", false)
		  break;
	}
}

function calcNewVelocityPerTick(oldVelocity, deltaTick) {
	var newVelocity = oldVelocity * deltaTick;
	if (Math.abs(newVelocity) >= 0.002) {
		return newVelocity;
	} else {
		return 0;
	}
}

export function updateControls(controlsEnabled, clock, controls, collidableMeshList, raycaster, raycasterFront) {
	if (controlsEnabled) {
		var delta = clock.getDelta();
      	var deltaMultiplicator = 100; //mass
		var walkingSpeedImpulse = 0.02;
		var jumpImpulse = 8;
		var TargetY = 4;
		//var toTest = new THREE.Vector3(controls.object.position.x, 1, controls.object.position.z);

		if(pressedKeys.get(" ")) {
			if (canJump === true) {
				velocity.y += jumpImpulse;
				canJump = false;
			}
		}
		if (pressedKeys.get("w")) {
			velocity.z -= walkingSpeedImpulse;
		}
		if (pressedKeys.get("a")) {
			velocity.x -= walkingSpeedImpulse;
		}
		if (pressedKeys.get("s")) {
			velocity.z += walkingSpeedImpulse;
		}
		if (pressedKeys.get("d")) {
			velocity.x += walkingSpeedImpulse;
		}
		var deltaMass = delta * deltaMultiplicator;
		velocity.x = calcNewVelocityPerTick(velocity.x, deltaMass);
		velocity.z = calcNewVelocityPerTick(velocity.z, deltaMass);

		velocity.y -= 9.8 * deltaMass * 0.05;

		//velocityWorld = new
		//raycasterFront.ray.direction = velocity.localToWorld();
		const collidingMeshesList = raycaster.intersectObjects(collidableMeshList);
		const collidingMeshesListInMovementDir = raycasterFront.intersectObjects(collidableMeshList);

		const inFrontOfObject = collidingMeshesListInMovementDir.length > 0;
		if ((inFrontOfObject === true) & (0 >= velocity.z) ) {
			velocity.z = 0;
		}
		controls.moveForward(-velocity.z);
		controls.moveRight(velocity.x);

		const onObject = collidingMeshesList.length > 0;
		if ( onObject === true ) {
			velocity.y = Math.max( 0, velocity.y );
			canJump = true;
			if (collidingMeshesList[0].distance <= 0.9) {
				controls.object.position.y += 0.1;
			}
		}
		if (hasMoved === true) {
			controls.object.position.y += ( velocity.y * delta );
		}
		
	    //controls.object.translateX(velocity.x);
	    //controls.object.translateY(velocity.y);
	    //controls.object.translateZ(velocity.z);

		var toDisplay =
			"velocityX:"+ velocity.x + " positionX : " + controls.object.position.x +
			"</br>velocityY: "+ velocity.y + " positionY : " + controls.object.position.y +
			"</br>velocityZ: "+ velocity.z + " positionZ : " + controls.object.position.z +
			"</br>FPS: "+ Math.round(1 / delta)
		if ( onObject === true ) {
			toDisplay += "</br>DistanceToIntersect: " + collidingMeshesList[0].distance;
			toDisplay += "</br>IntersectPoint: " + collidingMeshesList[0].point.x + " " + collidingMeshesList[0].point.y  + " " + collidingMeshesList[0].point.z;
		}
		if (inFrontOfObject === true) {
			toDisplay += "</br>DistanceToIntersectFront: " + collidingMeshesListInMovementDir[0].distance;
			toDisplay += "</br>IntersectPointFront: " + collidingMeshesListInMovementDir[0].point.x + " " + collidingMeshesListInMovementDir[0].point.y  + " " + collidingMeshesListInMovementDir[0].point.z;
			//toDisplay += "</br>IntersectPointFrontNormal: " + collidingMeshesListFront[0].normal.x + " " + collidingMeshesList[0].normal.y  + " " + collidingMeshesList[0].normal.z;
		}

		showMessageContent(toDisplay);

    }
}