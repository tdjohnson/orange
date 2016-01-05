
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
var klo, tuer1, tuer2, boden, bett, zelle, buch, lampe, luefter, seife;
var raycaster = new THREE.Raycaster();
var isOpenable = true; //for animating door
var arrow; //for raycasterhelper
var enablerc = true; //for pausing raycaster updates
var lastObject = new THREE.Object3D();//for pausing raycaster updates
var collidableMeshList = [];
//animate();

function init() { 
	initControls();
    initPointerLock();

    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xb2e1f2, 0, 750);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

	//camera.position.x = 5;
	//camera.position.y = -2;
	//camera.position.z = 40;
	controls = new THREE.PointerLockControls(camera);
	scene.add(controls.getObject());
	
	
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
	
	loadKlo();
	loadDoor1();
	loadDoor2();
	//loadFloor();
	loadBett();
	loadBuch();
	loadLampe();
	loadZelle();
	loadLuefter();
	loadSeife();
	
	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0xb2e1f2);
	renderer.shadowMapEnabled = true;
	
	document.body.appendChild(renderer.domElement);
	animate();
	$( "#dialog" ).dialog({
		  autoOpen: false
		});
}
	
function proximityDetector() {
	raycaster.set(camera.getWorldPosition(),camera.getWorldDirection());	
	showraycasthelper();//Raycaster helper - displays raycaster as vector
	
	var intersects = raycaster.intersectObjects( scene.children ); //get all object intersecting with raycast vector
	
	if ( intersects.length > 0 ) { //if objects are intersected
		if(intersects[0].object.name.length >= 1){ //if object has a name
		//if(intersects[0].object.name != lastObject.name){ //do if object is new
			if(intersects[0].distance <= 4){ //only show near objects
				$( "#dialog" ).dialog("open"); //buggy... needed here so it can be closed later...
				showinfo(intersects[0]); //show alert and log to console
				lastObject = intersects[0].object; //remember last object
			}
		//}
		} else {
			if ($( "#dialog" ).dialog("isOpen")) {
			$( "#dialog" ).dialog("close");
		   					}
			}
	}
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


function showinfo(intersect){
	var message = intersect.object.name + ": " + intersect.object.userData.info;
	$("#dialog").html(message);
	$("#dialog").dialog( 'option', 'position', ['left',20] );
	console.log(message);
	//log distance to object
	// console.log("distance to " +intersect.object.name + ": " + intersect.distance); 
}
  
function showraycasthelper(){
	scene.remove (arrow);
	arrow = new THREE.ArrowHelper( camera.getWorldDirection(), camera.getWorldPosition(), 100, 0x00ffff );
	scene.add( arrow );
}

function animate() {
    requestAnimationFrame(animate);
    updateControls();
    renderer.render(scene, camera);
    camera.updateProjectionMatrix();
 	proximityDetector();
 	animateDoor();
 	//collisionDetectionPositive();
}
  
function loadZelle() {
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Zelle/Zelle.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    zelle = new THREE.Mesh( geometry, material );
	    zelle.scale.x = zelle.scale.z = 3.5;
	    zelle.scale.y = 3.5;
	    zelle.rotation.y = Math.PI / -2;
	    scene.add(zelle);
	});
}

function loadKlo()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Klo/klo.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		klo = new THREE.Mesh( geometry, material );
		klo.rotation.y =  Math.PI*0.5;
		klo.position.z = 5;
		klo.position.x = 2.5;
		klo.castShadow = true;
		klo.name = "Klo";
		klo.userData.info = "Sehr schön";
		
		klo.castShadow = true;
		klo.receiveShadow = true;
		
		scene.add(klo);
		var bbox = new THREE.BoundingBoxHelper( klo, 0xffffff );
		bbox.update();
		collidableMeshList.push(klo);
		scene.add( bbox );
	});
}

function loadFloor()
{
    var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Boden/boden.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    boden = new THREE.Mesh( geometry, material );
	    boden.position.x = -6;
        boden.position.z = -8;
        boden.position.y = -0.3;
        
        boden.castShadow = true;
		boden.receiveShadow = true;
		
	    scene.add(boden);

	});
}

function loadBuch()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Buch/buch_neu_comb.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		buch = new THREE.Mesh( geometry, material );
		buch.position.y = 0;
		buch.position.x = 10;
		buch.position.z = 12;
		buch.rotation.y =  Math.PI*1.5;
		buch.scale.x = buch.scale.y = buch.scale.z = 0.3;
		buch.name = "Buch";
		buch.userData.info = "Lies Faust";
		
		buch.castShadow = true;
		buch.receiveShadow = true;
		
		scene.add(buch);
		var bbox = new THREE.BoundingBoxHelper( buch, 0xffffff );
		bbox.update();
		scene.add( bbox );
	});
}

function loadSeife()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Seife/seife.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		seife = new THREE.Mesh( geometry, material );
		seife.position.y = 2;
		seife.position.x = 2;
		seife.position.z = 10;
		seife.castShadow = true;
		seife.scale.x = seife.scale.y = seife.scale.z = 0.3;
		seife.name = "Seife";
		seife.userData.info = "Sehr sauber";
		
		seife.castShadow = true;
		seife.receiveShadow = true;
		
		scene.add(seife);
		var bbox = new THREE.BoundingBoxHelper( seife, 0xffffff );
		bbox.update();
		//scene.add( bbox );
	});
}

function loadLuefter()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Luefter/luefter.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		luefter = new THREE.Mesh( geometry, material );
		luefter.position.y = 6;
		luefter.position.x = 1;
		luefter.position.z = 9.9;
		luefter.rotation.y =  Math.PI*0.5;
		luefter.scale.y = luefter.scale.z = 0.7;
		luefter.scale.x = 1.2;
		luefter.name = "Luefter";
		luefter.userData.info = "BRRRRRRRR";
		
		luefter.castShadow = true;
		luefter.receiveShadow = true;
		
		scene.add(luefter);
		var bbox = new THREE.BoundingBoxHelper( luefter, 0xffffff );
		bbox.update();
		scene.add( bbox );
	});
}

function loadLampe()
{
 	addTischLampe(10.3,0,10.9,0.1,0.1,0.1);
}

function loadBett()
{

    var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Bett/bett.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		bett = new THREE.Mesh( geometry, material );
		bett.rotation.y =  Math.PI;
		bett.position.z = 5;
		bett.position.x = 9;
		bett.scale.x = bett.scale.y = bett.scale.z = 1;
		bett.updateMatrix();
		bett.name = "Bett";
		bett.userData.info = "Einsteigen!";
		
		bett.castShadow = true;
		bett.receiveShadow = true;
		
		scene.add(bett);
		var bbox = new THREE.BoundingBoxHelper( bett, 0xffffff );
		bbox.update();
		scene.add( bbox );
	});
}

function loadDoor1()
{
	loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
	var path = "../Prototypes/Tuer/tuer1.dae";
	loader.load(path, function(geometry) {
	    tuer1 = geometry.scene;
	    tuer1.position.z = 15.3;
	    tuer1.position.x = 4.8;
	    tuer1.position.y = 3.8;
	    tuer1.scale.y = 1.4;
	    tuer1.castShadow = true;
	    tuer1.updateMatrix();
	    tuer1.name = "Tuer1";
		tuer1.userData.info = "geschlossen!, öffne mit T";
		
		tuer1.castShadow = true;
		tuer1.receiveShadow = true;
		
		scene.add(tuer1);
		var bbox = new THREE.BoundingBoxHelper( tuer1, 0xffffff );
		bbox.update();
		scene.add( bbox );
	});
}
function loadDoor2() {

    var loader = new THREE.JSONLoader();
	loader.load( "../Prototypes/Tuer/tuer2.json", function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		tuer2 = new THREE.Mesh( geometry, material );
		tuer2.position.x = 8;
		tuer2.position.z = 14.9;
		tuer2.position.y = 3.8;
		tuer2.castShadow = true;
		tuer2.scale.y = 1.4;
		tuer2.updateMatrix();
		tuer2.name = "Tuer2";
		tuer2.userData.info = "geschlossen!<br/> öffne mit T";
		
		tuer2.castShadow = true;
		tuer2.receiveShadow = true;
		
		scene.add(tuer2);
		var bbox = new THREE.BoundingBoxHelper( tuer2, 0xffffff );
		bbox.update();
		//scene.add( bbox );
	});
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
  		case 65: // a
			moveLeft = true; 
			break;
 		case 81: // q
			rotate(lampeT,Math.PI/90 ); 
    		break;
  		case 69: // e
	 		rotate(lampeT,Math.PI/90 * -1  ); 
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
	    	//triggerDoor();
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