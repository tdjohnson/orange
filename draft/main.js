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
var klo, tuer1, tuer2, boden, bett, zelle, buch, luefter, seife;
var raycaster = new THREE.Raycaster();
var isOpenable = true; //for animating door
var arrow; //for raycasterhelper
var lastObject = new THREE.Object3D();//for pausing raycaster updates 
var collidableMeshList = [];
var frustum = new THREE.Frustum();
//animate();

function init() { 
	

    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xb2e1f2, 0, 750);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

	//camera.position.x = 5;
	//camera.position.y = -2;
	//camera.position.z = 40;

	
	
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


	initControls();
    initPointerLock();
	controls = new THREE.PointerLockControls(camera);
	scene.add(controls.getObject());
	
	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0xb2e1f2);
	
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
			if(intersects[0].object.name != lastObject.name){ //do if object is new
				if(intersects[0].distance <= 6){ //only show near objects
					showinfo(intersects[0]); //show alert and log to console
					lastObject = intersects[0].object; //remember last object
				}	
			}
		}
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

function inview(object){
	//checks if given object is still in view by checking intersection with fristum.
	//could be usefull with combination of raycaster, 
	var cam_matrix = new THREE.Matrix4();
	cam_matrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
	frustum.setFromMatrix(cam_matrix);
	return frustum.intersectsObject( object );
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
    renderer.render(scene, camera);
    camera.updateProjectionMatrix();
 	proximityDetector();
 	animateDoor();
 	animateDrop(lastObject);
 	
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
		buch.userData.rotatable = true;
		scene.add(buch);
		var bbox = new THREE.BoundingBoxHelper( buch, 0xffffff );
		bbox.update();
		//scene.add( bbox );
	});
}

function loadSeife()
{
	loader = new THREE.JSONLoader();
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
		seife.userData.info = "geschlossen!<br/> öffne mit T";
		seife.userData.rotatable = true;
		seife.userData.isOpenable = true;
		
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
		scene.add(luefter);
		var bbox = new THREE.BoundingBoxHelper( luefter, 0xffffff );
		bbox.update();
		scene.add( bbox );
	});
}

function loadLampe()
{	
	//position
	var px = 10.3;
	var py = 0;
	var pz = 10.9;
	//scale
	var sx = sy = sz =  0.1;
	//light position (locally)
	var lx = 6.7;
	var ly = 9.4;
	var lz = -1.7;
	
	var light = new THREE.PointLight(0xffff99, 5, 10 );
	light.shadowCameraVisible = true;
	light.shadowDarkness = 0.95;
	light.castShadow = true;
	light.position.set(lx,ly,lz);
	//var pointLightHelper = new THREE.PointLightHelper(light, 10);
	//scene.add(pointLightHelper);
	
	loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/TischLampe/TischLampeBottom.json', function ( geometry, materials ) {
		var lampeB = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
	    lampeB.position.set(px,py,pz);
		lampeB.scale.set(sx,sy,sz);
		scene.add(lampeB);
	});
	
	loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/TischLampe/TischLampeTop.json', function ( geometry, materials ) {
		lampe = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
		lampe.position.set(px,py,pz);
    	lampe.scale.set(sx,sy,sz);
    	lampe.name = "Lampe";
    	lampe.userData.info = "";
    	lampe.userData.rotatable = true;
		lampe.add(light);
		scene.add(lampe);
	});
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
			rotate(lastObject,new THREE.Vector3(0,1,0),Math.PI/90 ); //object,axis,angle
    		break;
  		case 69: // e
	 		rotate(lastObject,new THREE.Vector3(0,1,0),Math.PI/90 * -1); //object,axis,angle
    		break;
    	case 89:
    		triggerDrop(lastObject);	//droppable Object
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