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
	
	//needed for controls
    clock = new THREE.Clock();

    scene = new THREE.Scene();
    //scene.fog = new THREE.Fog(0xb2e1f2, 0, 750);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    var material = new THREE.LineBasicMaterial({ color: 0xAAFFAA });

	// crosshair size
	var x = 0.01, y = 0.02;
	
	var geometry = new THREE.Geometry();
	var geometry2 = new THREE.Geometry();
	
	// crosshair
	geometry.vertices.push(new THREE.Vector3(0.01, y, 0));
	geometry.vertices.push(new THREE.Vector3(0, 0.01, 0));
	geometry.vertices.push(new THREE.Vector3(-0.01, y, 0));    
	geometry.vertices.push(new THREE.Vector3(0, 0.01, 0));
	

	
	var crosshair = new THREE.LineSegments( geometry, material );
	
	// place it in the center
	var crosshairPercentX = 50;
	var crosshairPercentY = 50;
	var crosshairPositionX = (crosshairPercentX / 100) * 2 - 1;
	var crosshairPositionY = (crosshairPercentY / 100) * 2 - 1;
	
	crosshair.position.x = crosshairPositionX * camera.aspect;
	crosshair.position.y = crosshairPositionY;

	
	crosshair.position.z = -0.3;
	camera.add( crosshair );
    


	patrolStatus = 0;

	var light = new THREE.PointLight(0xffffff);
	light.position.y = 3;
	light.position.z = 4;
	//scene.add(light);
	
	var light2 = new THREE.AmbientLight(0x404040);

	scene.add(light2);
	var pointLightHelper = new THREE.PointLightHelper(light2, 1);
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

	//showCameraHelpers();
	animate();
	$( "#dialog" ).dialog({
		  autoOpen: false
	});
}




function showraycasthelper(){
	scene.remove (arrow);
	arrow = new THREE.ArrowHelper( camera.getWorldDirection(), camera.getWorldPosition(), 100, 0x00ffff );
	scene.add( arrow );
}

function showCameraHelpers(){
//	scene.add( new THREE.CameraHelper(camera)); //main camera
	for (j = 0; j < mirror_cameras.length ; j++) { 
    	scene.add( new THREE.CameraHelper( mirror_cameras[j]) ); //mirror cameras
	}
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

function updateMirrors() {
for (j = 0; j < mirror_cameras.length ; j++) { 
    		camera.updateProjectionMatrix();
    		//mirror_cameras[j].lookAt(camera);
    		    		//	mirror_cameras[j].lookAt(crosshair.position );
    		    				//	mirror_cameras[j].applyMatrix(controls.getObject().projectionMatrix  );
    		mirror_cameras[j].updateProjectionMatrix();

	    	renderer.render( scene, mirror_cameras[j], mirror_materials[j], true );
		}
		
	}

function animate() {
	
	    requestAnimationFrame(animate); 
	if (loadDone) {

 		updateMirrors();
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


function zoom(){
	if(camera.zoom == 4)
		camera.zoom = 1;
	else
		camera.zoom = 4;
}