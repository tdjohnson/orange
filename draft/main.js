var clock;
var scene, camera, renderer;
var geometry, material, mesh;
var havePointerLock = checkForPointerLock();
var controls, controlsEnabled;
var moveForward,
    moveBackward,
    moveLeft,
    moveRight,
    canJump;
var velocity = new THREE.Vector3();
var loader = new THREE.JSONLoader();
var raycaster = new THREE.Raycaster();
var isOpenable = true; //for animating door
var arrow; //for raycasterhelper
var mirrorMaterial;
var mirror_cameras = new Array();
var mirror_materials= new Array();
var lastObject = new THREE.Object3D();//for pausing raycaster updates
var frustum = new THREE.Frustum(); //needed for proximityDetection - reset of lastObject
var cam_matrix = new THREE.Matrix4(); //needed for proximityDetection - reset of lastObject
var collidableMeshList = [];
var loadDone = false;
var animationLock = false; // needed to complete animations before selection next object
var botBody, botArms, botRotateCounter, patrolStatus, botAggressive, botArmStatus, botHit;


var collided = false;


function init() { 
	
	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.domElement.id = "scene";
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0xb2e1f2);
	renderer.shadowMap.enabled = true;

	document.body.appendChild(renderer.domElement);
	
	
	THREE.DefaultLoadingManager.onLoad = function () {
		console.log("finished loading");
    	loadDone = true;
    	try {
    		document.getElementById("txt").innerHTML = "Loading done, klick to start!";
    		document.getElementById("scene").style.display = "inline";
    	} catch (e) {
    		alert(e);
    	}
    	
	};
	
	THREE.DefaultLoadingManager.onProgress = function ( item, loaded, total ) {
    	document.getElementById("txt").innerHTML = "Loading: "+ item+", "+ loaded+", "+ total;
    	
	};
	
    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xb2e1f2, 0, 750);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

	patrolStatus = 0;

	//objects
	var light = new THREE.PointLight(0xffffff);
	light.position.y = 3;
	light.position.z = 4;
	//scene.add(light);
	
	var light2 = new THREE.AmbientLight(0x404040);




	//scene.add(light2);
	//var pointLightHelper = new THREE.PointLightHelper(light2, 1);
	//scene.add(pointLightHelper);


	initControls();
    initPointerLock();
    camera.position.z = 1;
	controls = new THREE.PointerLockControls(camera);
	controls.getObject().position.x = 6;
	controls.getObject().position.z = 8;
	scene.add(controls.getObject());
	
	
	





	/*botBody = new JailBotBody();
	botBody.position.set(1.25,2.5,22);
	botBody.rotation.y =  Math.PI*0.5;
	scene.add(botBody);

	botArms = new JailBotArms();
	botArms.position.set(1.25,2.5,22);
	botArms.rotation.y =  Math.PI*0.5;
	scene.add(botArms);
	
	botArmStatus = 0;
	botHit = 0;
	botAggressive = 0;*/


	//add prison hallway
	var hallway = new Hallway();
	hallway.position.set(0,0,0);
		
	scene.add(hallway);
		
	//add 4 cells to the left side
	for (i = 0; i < 4; i++) { 
		var pcell = new PrisonCell();
		pcell.position.set(i*11.5,0,0);
		scene.add(pcell);
	}
	
	//add 4 cells to the right side
	for (j = 1; j < 5; j++) { 
		var pcell = new PrisonCell();
		pcell.rotation.y =  Math.PI;
		pcell.position.set(j*11.5,0,41);
		scene.add(pcell);
	}


	animate();
	$( "#dialog" ).dialog({
		  autoOpen: false
		});
}


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

function showraycasthelper(){
	scene.remove (arrow);
	arrow = new THREE.ArrowHelper( camera.getWorldDirection(), camera.getWorldPosition(), 100, 0x00ffff );
	scene.add( arrow );
}

function showinfo(intersect){
	var message = animationLock + " " + intersect.object.parent.name + ": " + intersect.object.parent.userData.info;
	if(intersect.object.parent.userData.rotatable == true){
		console.log(message + "  Tip! " + intersect.object.parent.name + " can be rotated by pressing q or e");
	}else{
		console.log(message);
	}
	//log distance to object
	// console.log("distance to " +intersect.object.name + ": " + intersect.distance); 
	//$("#dialog").html(message); //disabled dialogs for now... buggy
	//$("#dialog").dialog( 'option', 'position', ['left',20] );
}


  

function collisionDetection() {
	var collision;
	for (var i=0; i<collidableMeshList.length; i++) {
		var bbox = new THREE.BoundingBoxHelper(collidableMeshList[i]);
		bbox.update();
		
		if ((controls.getObject().position.x >= bbox.box.min.x) &&
			(controls.getObject().position.x <= bbox.box.max.x) &&
			(controls.getObject().position.z >= bbox.box.min.z) &&
			(controls.getObject().position.z <= bbox.box.max.z)) {
				console.log(i);
			 	collision = false;
			 	break;
			} else {
				//alert(controls.getObject().position.x+" "+bbox.box.min.x+" "+bbox.box.max.x);
				collision = true;
			}
		
	}
	return collision;
}


function animate() {
	
	    requestAnimationFrame(animate); 
	if (loadDone) {


    	for (j = 0; j < mirror_cameras.length ; j++) { 
    		//performance problems
    		//mirror_cameras[j].updateProjectionMatrix();
	    	//renderer.render( scene, mirror_cameras[j], mirror_materials[j], true );
		}

	    renderer.render(scene, camera);
	    camera.updateProjectionMatrix();
	 	proximityDetector();
	 	animateDoors();

	 	animateDrop(lastObject);
		//patrolRobot();
 	
		//if(botAggressive == 1)
		//{
		//	robotAttack();
		//}
	 	updateControls();





 	}


}


function checkForPointerLock() {
    return 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
}
  
function initPointerLock() {
	var element = document.body;
    if (havePointerLock) {
    	var pointerlockchange = function (event) {
        if (document.pointerLockElement === element || 
            document.mozPointerLockElement === element || 
            document.webkitPointerLockElement === element) {
            	  document.getElementById("txt").style.display = "none";
		          controlsEnabled = true;
		          controls.enabled = true;
        } else {
          controls.enabled = false;
        }
      };
	var pointerlockerror = function (event) {
   		element.innerHTML = 'PointerLock Error';
  	};

	document.addEventListener('pointerlockchange', pointerlockchange, false);
	document.addEventListener('mozpointerlockchange', pointerlockchange, false);
	document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
	
	document.addEventListener('pointerlockerror', pointerlockerror, false);
	document.addEventListener('mozpointerlockerror', pointerlockerror, false);
	document.addEventListener('webkitpointerlockerror', pointerlockerror, false);
	var requestPointerLock = function(event) {
	    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
	    element.requestPointerLock();
  	};

  	element.addEventListener('click', requestPointerLock, false);
  	} else {
		element.innerHTML = 'Bad browser; No pointer lock';
	}
}
  
function onKeyDown(e) {
    switch (e.keyCode) {
    	case 38: // up
  		case 87: // w
    		moveForward = true;
    		
    		break;
  		case 37: // left
  		case 89: //y
  			triggerDrop(lastObject);
  			break;
  		case 65: // a
			moveLeft = true; 
			break;
		case 66: //b
			botAggressive = 1;
			break;
		case 79: //o
			botAggressive = 0;
			break;
 		case 81: // q
			rotate(lastObject,new THREE.Vector3(0,1,0),5 ); //object,axis,degree
    		break;
  		case 69: // e
	 		rotate(lastObject,new THREE.Vector3(0,1,0),-5); //object,axis,degree
    		break;
  		case 40: // down
  		case 83: // s
    		moveBackward = true;
    		break;
  		case 39: // right
  		case 68: // d
    		moveRight = true;
    		break;
		case 32: // space
		    if (canJump === true) velocity.y += 50;
		    canJump = false;
		    break;
		case 84:
	    	triggerDoor(lastObject);	    	
	    	break;
	   	case 90:
	   		zoom();
	   		break;
    	}
  }
  


function onKeyUp(e) {
	switch(e.keyCode) {
    	case 38: // up
	  	case 87: // w
	    	moveForward = false;
	    	
	    	break;
	  	case 37: // left
	  	case 65: // a
	    	moveLeft = false;
	    	break;
	  	case 40: // down
	  	case 83: // s
	    	moveBackward = false;
	    	break;
	  	case 39: // right
	  	case 68: // d
	        moveRight = false;
	        break;
	    }
}

function initControls() {
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);
    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
}

function updateControls() {
	if (controlsEnabled) {
		var delta = clock.getDelta();
      	var walkingSpeed = 100.0;
		


	    if (collisionDetection()) {
	    	velocity.x -= velocity.x * 10.0 * delta;
		    velocity.z -= velocity.z * 10.0 * delta;
		    velocity.y -= 9.8 * 30.0 * delta;
		} else {
			if (collided == false){
				collided = true;
				velocity.x = -velocity.x*1.3;
		    	velocity.z = -velocity.z*1.3;
			} else {
				if (velocity.x == velocity.z == 0) {
					collided = false;
				}
			}
		}

	   
	
	    if (moveForward)	velocity.z -= walkingSpeed * delta;
	    if (moveBackward)  velocity.z += walkingSpeed * delta;
	    if (moveLeft) velocity.x -= walkingSpeed * delta;
	    if (moveRight) velocity.x += walkingSpeed * delta;

	
	    controls.getObject().translateX(velocity.x * delta);
	    controls.getObject().translateY(velocity.y * delta);
	    controls.getObject().translateZ(velocity.z * delta);
	
	    if (controls.getObject().position.y < 4) {
	    	velocity.y = 0;
	        controls.getObject().position.y = 4;
	        canJump = true;
	    }
    }
  }
  

function zoom(){
	if(camera.zoom == 4)
		camera.zoom = 1;
	else
		camera.zoom = 4;
}