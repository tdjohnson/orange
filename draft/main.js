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
var botBody, botArms, botRotateCounter, patrolStatus, botAggressive, botArmStatus, botHit, hitDirection, rotationActive;

var collided = false;
var meshes = new Map();
var rootCell;

function init() { 
	
	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.domElement.id = "scene";
	renderer.setSize(window.innerWidth, window.innerHeight-30);
	renderer.setClearColor(0xb2e1f2);
	renderer.shadowMap.enabled = true;
	renderer._microCache = new MicroCache();

	document.body.appendChild(renderer.domElement);
	
	
	THREE.DefaultLoadingManager.onLoad = function () {
		console.log("finished loading");
    	loadDone = true;
    	
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
	hitDirection = 1;
	rotationActive = 0;

	initControls();
    initPointerLock();

	controls = new THREE.PointerLockControls(camera);
	
	controls.getObject().position.set(5, 5, 8);

	scene.add(controls.getObject());

	botBody = new JailBotBody();
	botBody.position.set(1.25,2.5,22);
	botBody.rotation.y =  Math.PI*0.5;
	scene.add(botBody);

	botArms = new JailBotArms();
	botArms.position.set(1.25,2.5,22);
	botArms.rotation.y =  Math.PI*0.5;
	scene.add(botArms);
	
	botArmStatus = 0;
	botHit = 0;
	botAggressive = 0;

	//add prison hallway
	var hallway = new Hallway();
	hallway.position.set(0,0,0);
		
	scene.add(hallway);
	
	rootCell = new PrisonCell();
	rootCell.position.set(0,0,0);
	scene.add(rootCell);
	

	//showCameraHelpers();
	
	var grid = new THREE.GridHelper(500, 5);

	scene.add(grid ); 
	
	controls.getObject().lookAt(rootCell);
	
	//createSandFloor();
	sun();
	animate();
	$( "#dialog" ).dialog({
		  autoOpen: false
	});
	
}

function sun(){
				//let the sun shine
				var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
				dirLight.color.setHSL( 0.1, 1, 0.95 );
				dirLight.position.set( 20, 20, 20 );
				scene.add(dirLight);

				dirLight.castShadow = true;

				dirLight.shadowMapWidth = 2048;
				dirLight.shadowMapHeight = 2048;

				var d = 50;

				dirLight.shadowCameraLeft = -d;
				dirLight.shadowCameraRight = d;
				dirLight.shadowCameraTop = d;
				dirLight.shadowCameraBottom = -d;

				dirLight.shadowCameraFar = 3500;
				dirLight.shadowBias = -0.0001;
				//dirLight.shadowCameraVisible = true;
	
}
function createSandFloor() {
	var sand = new Sand();
	sand.position.set(100, -5, 100);
	scene.add(sand);
}

function cloning(n) {
	for (i = 1; i < n; i++) { 
		
		var newCell = rootCell.clone();
		newCell.position.set(i*11.5,0,0);
		scene.add(newCell);
	}
	
	for (j = 1; j < n+1; j++) { 
		var newCell = rootCell.clone();
		newCell.rotation.y =  Math.PI;
		newCell.position.set(j*11.5,0,41);
		scene.add(newCell);
	}
}


function showCameraHelpers(){
	scene.add( new THREE.CameraHelper(camera)); //main camera
	for (j = 0; j < mirror_cameras.length ; j++) { 
    	scene.add( new THREE.CameraHelper( mirror_cameras[j]) ); //mirror cameras
	}
}


function updateMirrors() {
for (j = 0; j < mirror_cameras.length ; j++) { 
    		camera.updateProjectionMatrix();
    		mirror_cameras[j].updateProjectionMatrix();
	    	renderer.render( scene, mirror_cameras[j], mirror_materials[j], true );
		}
		
	}

function animate() {
	
	requestAnimationFrame(animate); 
	if (loadDone) {

 		//updateMirrors();
	    renderer.render(scene, camera);
	    camera.updateProjectionMatrix();
	 	proximityDetector();
	 	animateDoors();
	 	

	 	animateDrop(lastObject);
		patrolRobot();
 	
		if(botAggressive == 1)
		{
			robotAttack();
		}
	 	updateControls();
 } else {
 	controls.getObject().rotation.y += Math.PI/-16;
 }

}


function zoom(){
	if(camera.zoom == 4)
		camera.zoom = 1;
	else
		camera.zoom = 4;
}

function showMessage(text){
	document.getElementById("message").innerHTML=text;
}
