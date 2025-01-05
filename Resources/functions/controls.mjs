import * as THREE from 'three';
import {collisionDetection} from './collision.mjs'
import {showMessageContent} from './splashScreen.mjs';
import * as transformModule from './transform.mjs';
import * as bulletControl from './bulletControl.mjs';

var moveForward,
    moveBackward,
    moveLeft,
    moveRight,
    canJump,
	botAggressive;
	var lastObject;
	var hasMoved = false;
	
var velocity = new THREE.Vector3();
var pressedKeys = new Map();
var maxVelocity = 0.2;

var renderer;
var scene;
var currentBody;

export function initControls(currentRender, currentScene) {
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);
	document.addEventListener("mousedown", onMouseDown, false);
	document.addEventListener("mouseup", onMouseUp, false);
	canJump = true;
	renderer = currentRender;
	scene = currentScene;
}

export function onMouseDown(e) {
	//console.log(e.button);
	switch (e.button) {
		case 0: //left mouse click
			pressedKeys.set("LMB", true);
			bulletControl.addBullet(renderer, scene);
			break;
	}
}

export function onMouseUp(e) {
	//console.log(e.button);
	switch (e.button) {
		case 0: //left mouse click end
				pressedKeys.set("LMB", false);
				break;
	}
}

export function onKeyDown(e) {
	hasMoved = true;
    switch (e.keyCode) {
		case 32: // space
			pressedKeys.set(" ", true);
			
		    break;
		case 16: //Shift
			pressedKeys.set("SHIFT", true);
			console.log("Pressed SHift");
			break;
		case 37: // left
    	case 38: // up
		case 39: // right
		case 40: // down
		
		case 65: // a
			pressedKeys.set("a", true);
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
			pressedKeys.set("d", true);
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
		  	pressedKeys.set("s", true);
			break;
		case 84: //t
			//transformModule.triggerDoor(lastObject);
	    	//transformModule.switchTableLight(lastObject);
			transformModule.triggerObject(lastObject);
			break;    	
  		case 87: // w
		  pressedKeys.set("w", true);
		  break;	
  		case 89: //y
		 	transformModule.triggerDrop(lastObject);
			break;
	   	case 90: //z
	   		zoom();
			break;
    	}
  }
  


export function onKeyUp(e) {
	switch(e.keyCode) {
		case 1: // left mouse button
			pressedKeys.set("LMB", false);
			break;
		case 16: //Shift
			pressedKeys.set("SHIFT", false);
			break;
		case 32: // space
			pressedKeys.set(" ", false);
			break;
		case 37: // left
    	case 38: // up
		case 39: // right
	  	case 40: // down
	  	case 65: // a
		  pressedKeys.set("a", false);
		  break;
	  	case 68: // d
		  pressedKeys.set("d", false);
		  break;
	  	case 83: // s
		  pressedKeys.set("s", false);
		  break;   
	  	case 87: // w
		  pressedKeys.set("w", false);
		  break;
	}
}

function calcNewVelocityPerTick(oldVelocity, deltaTick) {
	var isNegativeVelocity = 1;
	if (oldVelocity < 0) {
		isNegativeVelocity = -1;
	}
	var absoluteOldVelocity = Math.abs(oldVelocity);
	var newAbsoluteVelocity = absoluteOldVelocity - (absoluteOldVelocity * deltaTick * 10);
	var newVelocity = newAbsoluteVelocity * isNegativeVelocity;
	if (newAbsoluteVelocity >= 0.002) {
		if (newAbsoluteVelocity > maxVelocity) {
			return maxVelocity * isNegativeVelocity;
		} else {
			return newVelocity;
		}
	} else {
		return 0;
	}
}

function reduceFloatPrecision(toReduce) {
	return toReduce.toFixed(4);
}

export function updateControls(controlsEnabled, clock, controls, collidableMeshList, raycaster, raycasterFront, raycasterCamera) {
	if (controlsEnabled) {
		var delta = clock.getDelta();
      	var mass = 10;
		var walkingSpeedImpulse = 0.1;
		var jumpImpulse = 5;
		var TargetY = 4;
		//var toTest = new THREE.Vector3(controls.object.position.x, 1, controls.object.position.z);

		if(pressedKeys.get(" ")) {
			if (canJump === true) {
				velocity.y += jumpImpulse;
				canJump = false;
			}
		}
		if(pressedKeys.get("SHIFT")) {
			velocity.y -= jumpImpulse;
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


		//var deltaMass = delta * mass;
		velocity.x = calcNewVelocityPerTick(velocity.x, delta);
		velocity.z = calcNewVelocityPerTick(velocity.z, delta);

		console.log(velocity.y)
		velocity.y -= 9.8 * delta * mass;

		//velocityWorld = new
		//raycasterFront.ray.direction = velocity.localToWorld();
		const collidingMeshesList = raycaster.intersectObjects(collidableMeshList);
		//const collidingMeshesList = collisionDetection(controls, collidableMeshList)
		//const collidingMeshesList = ["arrayTest"];
		const collidingMeshesListInMovementDir = raycasterFront.intersectObjects(collidableMeshList);
		const collidingMeshesListCameraRay = raycasterCamera.intersectObjects(collidableMeshList);

		if (collidingMeshesListCameraRay.length > 0) {
			//console.log(collidingMeshesListCameraRay[0]);
			lastObject = collidingMeshesListCameraRay;
		}

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
				//controls.object.position.y += 0.1;
			}
		} else {
			
		}
		if (hasMoved === true) {
			controls.object.position.y += ( velocity.y * delta );
		}
		
	    //controls.object.translateX(velocity.x);
	    //controls.object.translateY(velocity.y);
	    //controls.object.translateZ(velocity.z);

		var toDisplay =
			"<table id='InfoOutput'>"+
			"<tr><td>velocityX:</td><td>"+ reduceFloatPrecision(velocity.x) + "</td><td>positionX:</td><td>" + reduceFloatPrecision(controls.object.position.x) + "</td><td></td><td></td><td></td></tr>" +
			"<tr><td>velocityY:</td><td> "+ reduceFloatPrecision(velocity.y) + "</td><td>positionY:</td><td>" + reduceFloatPrecision(controls.object.position.y) + "</td></tr>" +
			"<tr><td>velocityZ:</td><td> "+ reduceFloatPrecision(velocity.z) + "</td><td>positionZ:</td><td>" + reduceFloatPrecision(controls.object.position.z) + "</td></tr>" +
			"<tr><td>FPS:</td><td>"+ Math.round(1 / delta)+ "</td></tr>";
		if ( onObject === true ) {
			toDisplay += "<tr><td>IntersDisFloor:</td><td>" + reduceFloatPrecision(collidingMeshesList[0].distance) +"</td></tr>";
			toDisplay += "<tr><td>IntersPntFloor:</td><td>X:</td><td>" + reduceFloatPrecision(collidingMeshesList[0].point.x) + "</td><td>Y:</td><td>" + reduceFloatPrecision(collidingMeshesList[0].point.y) + "</td><td>Z:</td><td>" + reduceFloatPrecision(collidingMeshesList[0].point.z)+"</td></tr>";
		}
		if (inFrontOfObject === true) {
			toDisplay += "<tr><td>IntersDisFront:</td><td>" + reduceFloatPrecision(collidingMeshesListInMovementDir[0].distance) +"</td></tr>";
			toDisplay += "<tr><td>IntersPntFront:</td><td>X:</td><td>" + reduceFloatPrecision(collidingMeshesListInMovementDir[0].point.x) + "</td><td>Y:</td><td>" + reduceFloatPrecision(collidingMeshesListInMovementDir[0].point.y) + "</td><td>Z:</td><td>" + reduceFloatPrecision(collidingMeshesListInMovementDir[0].point.z)+"</td></tr>";
		}
		toDisplay += "</table>" +
		raycasterCamera.ray.origin.x + " " + raycasterCamera.ray.origin.y + " " + raycasterCamera.ray.origin.z + "</br>" +
		raycasterCamera.ray.direction.x + " " + raycasterCamera.ray.direction.y + " " + raycasterCamera.ray.direction.z + "</br>";

		showMessageContent(toDisplay);

    }
}