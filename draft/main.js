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
var loader;
var klo, tuer1, tuer2, boden, bett, cell, buch, luefter, soap,spiegel, verticalMirror ;
var raycaster = new THREE.Raycaster();
var isOpenable = true; //for animating door
var arrow; //for raycasterhelper
var lastObject = new THREE.Object3D();//for pausing raycaster updates
var frustum = new THREE.Frustum(); //needed for proximityDetection - reset of lastObject
var cam_matrix = new THREE.Matrix4(); //needed for proximityDetection - reset of lastObject
var collidableMeshList = [];

function init() { 

    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xb2e1f2, 0, 750);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

	

	
	
	//objects
	var light = new THREE.PointLight(0xffffff);
	light.position.y = 3;
	light.position.z = 4;
	scene.add(light);
	
	var light2 = new THREE.HemisphereLight(0xffffff, 0.1);
	light.position.x = 5;
	light.position.y = 3;
	light.position.z = 4;
	//scene.add(light2);
	
	
	//mirror
	
	var WIDTH = window.innerWidth;
	var HEIGHT = window.innerHeight;

	// camera
	var VIEW_ANGLE = 45;
	var ASPECT = WIDTH / HEIGHT;
	var NEAR = 1;
	var FAR = 500;
			

	
	loadKlo();
	loadDoor1();
	loadDoor2();
	//loadFloor();
	loadBett();
	loadBuch();
	loadLampe();
	loadZelle();
	loadLuefter();
	loadSoap();
	loadBecken();




	initControls();
    initPointerLock();
	controls = new THREE.PointerLockControls(camera);
	controls.getObject().position.x = 6;
	controls.getObject().position.z = 8;
	scene.add(controls.getObject());
	
	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0xb2e1f2);
	
	verticalMirror = new THREE.Mirror( renderer, camera, { clipBias: 0.003, textureWidth: WIDTH , textureHeight: HEIGHT, color:0x229999 } );
	loadMirror();
	rotate(spiegel,new THREE.Vector3(0,1,0),90);

	document.body.appendChild(renderer.domElement);
	animate();
	$( "#dialog" ).dialog({
		  autoOpen: false
		});
}
	
function proximityDetector() {
	try{
		//detect objects hit by raycaster vector
		raycaster.set(camera.getWorldPosition(),camera.getWorldDirection()); //bind raycaster to camera	
		showraycasthelper();//Raycaster helper - displays raycaster as vector
		var intersects = raycaster.intersectObjects( scene.children ); //get all object intersecting with raycast vector
		if ( intersects.length > 0 ) { //if objects are intersected
			if(intersects[0].object.name.length >= 1){ //if object has a name
				if(intersects[0].object.name != lastObject.name){ //do if object is new
					if(intersects[0].distance <= 6){ //only show near objects
						showinfo(intersects[0]); //show alert and log to console
						lastObject = intersects[0].object; //remember last object
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
	}catch(err){
	}
}

function showraycasthelper(){
	scene.remove (arrow);
	arrow = new THREE.ArrowHelper( camera.getWorldDirection(), camera.getWorldPosition(), 100, 0x00ffff );
	scene.add( arrow );
}

function showinfo(intersect){
	var message = intersect.object.name + ": " + intersect.object.userData.info;
	if(intersect.object.userData.rotatable == true){
		console.log(message + "  Tip! " + intersect.object.name + " can be rotated by pressing q or e");
	}else{
		console.log(message);
	}
	//log distance to object
	// console.log("distance to " +intersect.object.name + ": " + intersect.distance); 
	//$("#dialog").html(message); //disabled dialogs for now... buggy
	//$("#dialog").dialog( 'option', 'position', ['left',20] );
}


  

function collisionDetectionPositive() {
	var bbox = new THREE.BoundingBoxHelper( klo, 0xffffff );
	bbox.update();
	if ((controls.getObject().position.x+0.3 >= bbox.box.min.x) &&
		(controls.getObject().position.x+0.3 <= bbox.box.max.x) &&
		(controls.getObject().position.z+0.3 >= bbox.box.min.z) &&
		(controls.getObject().position.z+0.3 <= bbox.box.max.z))
		 {
			//alert(controls.getObject().position.x+" "+bbox.box.min.x);
			return false;
		} else {
			//alert(controls.getObject().position.x+" "+bbox.box.min.x+" "+bbox.box.max.x);
			return true;
		}
}

function collisionDetectionNegative() {
	var bbox = new THREE.BoundingBoxHelper( klo, 0xffffff );
	bbox.update();
	if ((controls.getObject().position.x-0.3 >= bbox.box.min.x) &&
		(controls.getObject().position.x-0.3 <= bbox.box.max.x) &&
		(controls.getObject().position.z-0.3 >= bbox.box.min.z) &&
		(controls.getObject().position.z-0.3 <= bbox.box.max.z))
		 {
			//alert(controls.getObject().position.x+" "+bbox.box.min.x);
			return false;
		} else {
			//alert(controls.getObject().position.x+" "+bbox.box.min.x+" "+bbox.box.max.x);
			return true;
		}
}


function animate() {
    requestAnimationFrame(animate);
    updateControls();
    verticalMirror.render();
    renderer.render(scene, camera);
    camera.updateProjectionMatrix();
 	proximityDetector();
 	animateDoor();
 	animateDrop(lastObject);
 	
 	//collisionDetectionPositive();
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
  		case 89:
  			triggerDrop(lastObject);
  			break;
  		case 65: // a
			moveLeft = true; 
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
		case 84: // space
	    	triggerDoor();
	    	break;
    	}
  }
  
function triggerDoor() {
	if (isOpenable == true) {
		isOpenable = false;
			if (tuer2.userData.info.indexOf("geschlossen")>-1) {
				tuer2.userData.info = "offen!<br/> schließen mit T";
			} else if(tuer2.userData.info.indexOf("offen")>-1) {
				tuer2.userData.info = "geschlossen!<br/> öffne mit T";
			}
	} else {
		
	}
}

function animateDoor() {
	if (isOpenable == false) {
		if (tuer2.userData.info.indexOf("offen")>-1) {
			if (tuer2.position.x > 4)
				tuer2.position.x -= 0.1;
			else
				isOpenable = true;
		} else {
			if (tuer2.position.x < 8)
				tuer2.position.x += 0.1;
			else
				isOpenable = true;
		}
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

	    velocity.x -= velocity.x * 10.0 * delta;
	    velocity.z -= velocity.z * 10.0 * delta;
	    velocity.y -= 9.8 * 30.0 * delta;
	
	    if (moveForward) {
		    if (collisionDetectionPositive())
		    	velocity.z -= walkingSpeed * delta;
		    else {
		    	velocity.z = 0;
		    	velocity.x = 0;
		    }
		}
	    if (moveBackward) {
			if (collisionDetectionNegative())
			    velocity.z += walkingSpeed * delta;
		    else {
		    	velocity.z = 0;
		    	velocity.x = 0;
		    }
		}
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