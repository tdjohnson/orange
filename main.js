import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import {collisionDetection} from './Resources/functions/collision.mjs'
import {MicroCache} from './Resources/functions/microCache.mjs';
import * as controlsModule from './Resources/functions/controls.mjs';
import * as pointerLockModule from './Resources/functions/pointerLock.mjs';
import * as objectsModule from './Resources/functions/objects.mjs';
import * as splashScreenModule from './Resources/functions/splashScreen.mjs';
import * as proximityModule from './Resources/functions/proximity.mjs';
import * as prisonCellModule from './Resources/functions/prisonCell.mjs';
import * as hallwayModule from './Resources/functions/fullHallway.mjs';
import * as transformModule from './Resources/functions/transform.mjs';

var clock;
var scene, camera, renderer;
var geometry, material, mesh;
var havePointerLock = pointerLockModule.checkForPointerLock();
var controls;
var controlsEnabled = true;
var multiplayer;
var playerBody;
var collidingObjects;
var collidableObjects;

var gameMode;

var loader = new THREE.ObjectLoader();
var isOpenable = true; //for animating door
var arrow; //for raycasterhelper
var mirrorMaterial;
var mirror_cameras = new Array();
var mirror_materials= new Array();
var u = 0; //number of rendered mirrors
var collidableMeshList = [];
var loadDone, toWakeUp = false;
var animationLock = false; // needed to complete animations before selection next object

var collided = false;
var meshes = new Map();
var rootCell;
var prisonWallRoot;

const raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 1 );
const raycasterFront = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 1, 0, 0 ), 0, 1 );
var raycasterCamera;

var playerBoundingBox;
var performanceBoostGlobal = true;

objectsModule.setPerformanceOptimization(performanceBoostGlobal);
prisonCellModule.setPerformanceOptimization(performanceBoostGlobal);
hallwayModule.setPerformanceOptimization(performanceBoostGlobal);


function closeStart() {
	toWakeUp = splashScreenModule.closeStart();
}

function GetCollidableMeshList() {
	return collidableMeshList
}

function init() { 
	
	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer._microCache = MicroCache();
	renderer.domElement.id = "scene";
	renderer.setSize(window.innerWidth, window.innerHeight-30);
	renderer.setClearColor(0xb2e1f2);
	if (!performanceBoostGlobal) {
		renderer.shadowMap.enabled = true;
		//renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	}

	document.body.appendChild(renderer.domElement);
	
	//needed for controls
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    //scene.fog = new THREE.Fog(0xb2e1f2, 0, 750);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    var material = new THREE.LineBasicMaterial({ color: 0xAAFFAA });

	// crosshair size
	var x = 0.01, y = 0.02;
	
	/*
	var geometry = new THREE.Geometry();
	var geometry2 = new THREE.BufferGeometry();

	// crosshair
	geometry.vertices.push(new THREE.Vector3(0.01, y, 0));
	geometry.vertices.push(new THREE.Vector3(0, 0.01, 0));
	geometry.vertices.push(new THREE.Vector3(-0.01, y, 0));    
	geometry.vertices.push(new THREE.Vector3(0, 0.01, 0));
	*/

	var crosshairPoints = []
	crosshairPoints.push(new THREE.Vector3(0.01, y, 0));
	crosshairPoints.push(new THREE.Vector3(0, 0.01, 0));
	crosshairPoints.push(new THREE.Vector3(-0.01, y, 0));    
	crosshairPoints.push(new THREE.Vector3(0, 0.01, 0));
	let geometry = new THREE.BufferGeometry().setFromPoints(crosshairPoints)

	
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
	camera.position.z = 1;
	
	//hitDirection = 1;
	//rotationActive = 0;

	controlsModule.initControls();

	controls = new PointerLockControls(camera, document.body);
	
	var playerHeight = 5;
	controls.object.playerHeight = playerHeight;
	controls.object.position.set(5, playerHeight, 8);
	playerBody = new objectsModule.JailBotBody(renderer);
	controls.getObject().add(playerBody);
	playerBody.position.set(0, 0.5, 1); 

	playerBoundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
	playerBoundingBox.setFromObject(controls.object);


	scene.add(controls.object);

	/* 	collidableMeshList.push(botBody);
	botBody.position.set(1.25,2.5,22);
	botBody.rotation.y =  Math.PI*0.5;
	scene.add(botBody); */

	//add prison hallway


	/*var secondCell = objectsModule.meshloader('./Prototypes/Zelle/Zelle_neu_comb4.glb',function(model) {
		scene.add(hallway);
	});
	console.log(secondCell);

/*	botArms = new JailBotArms();
	botArms.position.set(1.25,2.5,22);
	botArms.rotation.y =  Math.PI*0.5;
	scene.add(botArms);
	
	botArmStatus = 0;
	botHit = 0;
	botAggressive = 0;
	
	rootCell = new PrisonCell();
	rootCell.position.set(0,0,0);
	scene.add(rootCell);
	//showCameraHelpers();
	*/

	var hallwayStart = -38;
	for (var i = 0; i < 3; i++) {
		var hallwayOffset = hallwayStart + (48 * i);

		var fullHallway = new hallwayModule.FullHallway(renderer, collidableMeshList, scene);
		fullHallway.position.set(hallwayOffset,0,21);
		scene.add(fullHallway);
	}
	

	var cellStartX = -30;
	var cellStartZ = 0;
	var cameraPositionInCellOfset = 3;
	camera.position.x = cellStartX + cameraPositionInCellOfset;
	camera.position.z = cellStartZ + cameraPositionInCellOfset;
	var rotationPerColumn = Math.PI;


	var vector = new THREE.Vector3(0, 0, -1);
	vector = camera.localToWorld(vector);
	vector.sub(camera.position); // Now vector is a unit vector with the same direction as the camera

	raycasterCamera = new THREE.Raycaster( camera.position, vector, 0, 3);

	var cellRowCount = 2;
	var cellsPerRow = 6;

	var totalCellcount = cellRowCount * cellsPerRow;

	var startCell = Math.floor(Math.random() * totalCellcount);
	console.log("StartCell: "+startCell);

	var currentCell = 0;
	for (var j = 0; j < cellRowCount; j++) {
		var rotate = rotationPerColumn * j;
		for (var i = 0; i < cellsPerRow; i++) {
			var cellOffsetX = cellStartX + (12 * i);
			var cellOffsetZ = cellStartZ + (42 * j);
			var rootCell = new prisonCellModule.PrisonCell(renderer, collidableMeshList, scene);
			rootCell.position.set(cellOffsetX,0,cellOffsetZ);
			rootCell.rotateY(rotate);
			scene.add(rootCell);

			currentCell++;
			console.log("CurrentCell: "+ currentCell);
			if (currentCell == startCell) {
				camera.position.x = cellOffsetX + cameraPositionInCellOfset;
				camera.position.z = cellStartZ + cameraPositionInCellOfset;
				//camera.position.y = 99990;
			}
		}
	}


	var grid = new THREE.GridHelper(500, 5);
	addWall(renderer);

	//cloning(4);
	addTowers(renderer);

	pointerLockModule.initPointerLock(havePointerLock);


	scene.add(grid);
	addRamps(renderer);
	addSandFloor(renderer);
	sun();


	THREE.DefaultLoadingManager.onLoad = function () {
		console.log("finished loading");
    	loadDone = true;
    	
	};

	animate();	
}

function cloning(n) {
	for (let i = 1; i < n; i++) { 
		
		var newCell = rootCell.clone();
		newCell.position.set(i*11.55,0,0);
		scene.add(newCell);
	}
	
	for (let j = 1; j < n+1; j++) { 
		var newCell = rootCell.clone();
		newCell.rotation.y =  Math.PI;
		newCell.position.set(j*11.55,0,41.5);
		scene.add(newCell);
	}
}

function addRamps(renderer) {
	var ramp1 = new objectsModule.Ramp(renderer);
	ramp1.position.set(-35,-2.5,12);
	scene.add(ramp1);
	collidableMeshList.push(ramp1);

	var ramp2 = new objectsModule.Ramp(renderer);
	ramp2.rotateY(Math.PI);
	ramp2.position.set(35,-2.5,30);
	scene.add(ramp2);
	collidableMeshList.push(ramp2);



}


function addWall(renderer) {
	prisonWallRoot = new objectsModule.PrisonWall(renderer);
	prisonWallRoot.rotation.y += Math.PI/2;
	var y = 3.7;
	prisonWallRoot.rotation.y += Math.PI/2;
	for (let i = -3; i < 5; i++) { 
		var prisonWall = prisonWallRoot.clone();
		prisonWall.position.set(i*16+7,y,-50);
		scene.add(prisonWall);
	}
	prisonWallRoot.rotation.y += Math.PI/2;
	for (let i = -3; i < 4; i++) { 
		var prisonWall = prisonWallRoot.clone();
		prisonWall.position.set(-50,y,i*16+7);
		scene.add(prisonWall);
	}
	prisonWallRoot.rotation.y -= Math.PI/2;
	for (let i = -3; i < 5; i++) { 
		var prisonWall = prisonWallRoot.clone();
		prisonWall.position.set(i*16+7,y,60);
		scene.add(prisonWall);
	}
	prisonWallRoot.rotation.y -= Math.PI/2;
	for (let i = -3; i < 4; i++) { 
		var prisonWall = prisonWallRoot.clone();
		prisonWall.position.set(80,y,i*16+7);
		scene.add(prisonWall);
	}
}


function addTowers(renderer) {
	var tower = new objectsModule.Tower(renderer);
	tower.position.set(-50,0,-50);	
	scene.add(tower);
	
	var tower = new objectsModule.Tower(renderer);
	tower.position.set(80,0,-50);	
	scene.add(tower);
	
	var tower = new objectsModule.Tower(renderer);
	tower.position.set(80,0,60);	
	scene.add(tower);
	
	var tower = new objectsModule.Tower(renderer);
	tower.position.set(-50,0,60);	
	scene.add(tower);
}


function sun(){
	//let the sun shine in, leeeeeet the sunshine
	//var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
	var dirLight = new THREE.PointLight( 0xffffff, 1000);
	/*var dirLight2 = new THREE.DirectionalLight( 0xffffff, 0.5 );
	var dirLight3 = new THREE.DirectionalLight( 0xffffff, 0.5 );*/

	const sun = new THREE.AmbientLight( 0x404040, 1);

	//Shadow stuff
	//dirLight.castShadow = true;
	//dirLight.shadow.radius = 200;
	//dirLight.shadow.mapSize.width = 2048;
	//dirLight.shadow.mapSize.height = 2048

	//dirLight.color.setHSL( 0.1, 1, 0.95 );
	dirLight.position.set( 20, 20, 20 );
	
	/*dirLight2.color.setHSL( 0.1, 1, 0.95 );
	dirLight2.position.set( -40, 40, 0 );
	
	dirLight3.color.setHSL( 0.1, 1, 0.95 );
	dirLight3.position.set( 0, 40, -40 );*/
	
	/*scene.add(dirLight3);
	scene.add(dirLight2);*/

	scene.add(sun);
	//scene.add(dirLight);
	
	const helper = new THREE.PointLightHelper(dirLight);
	scene.add(helper);
	
}
function addSandFloor(renderer) {
	var sand = new objectsModule.Sand(renderer);
	sand.position.set(100, -5, 100);
	scene.add(sand);
	collidableMeshList.push(sand);
}


function showCameraHelpers(){
	//scene.add( new THREE.CameraHelper(camera)); //main camera
	for (j = 0; j < mirror_cameras.length ; j++) { 
    	scene.add( new THREE.CameraHelper( mirror_cameras[j]) ); //mirror cameras
	}
}


function updateMirrors() { //update mirrors/materials
	//u = 0; 
	var d = 10; //+- position of camera 
	var cx= controls.object.position.x; //get current x-coordinate from world camera
	for (j = 0; j < mirror_cameras.length ; j++) { 
			enableMirrors(cx-d,cx+d); //enable and render only mirrors near world camera
	    }
	//console.log("mirrors: " + u);
	}
	
function enableMirrors(x1,x2){ //enable mirros that are between given x-axis coordinates
	    var p = mirror_cameras[j].localToWorld(new THREE.Vector3(location.x, location.y, location.z));
    	if(p.x >= x1 & p.x <= x2){
    		//controls.object.updateMatrixWorld();
			//var rx= controls.object.rotation.y;
			var rx= controls.object.position.z;
			var rr =  ((rx/10) * Math.PI);
			mirror_cameras[j].rotation.set(0, rr,0 );
   			mirror_cameras[j].updateMatrix();
    		mirror_cameras[j].updateProjectionMatrix(); //update
    		renderer.render( scene, mirror_cameras[j], mirror_materials[j], true );	
    		//u++;
    	}
}


function animate() {

	if(gameMode != null && playerBody != null)
	{
		collidingObjects = collisionDetection(playerBody, collidableMeshList);
		console.log("Colision detected with:");
		console.log(collidingObjects);

	}


	requestAnimationFrame(animate); 
	if (toWakeUp === true) {
 		//updateMirrors();
		raycaster.ray.origin.copy( controls.object.position );
		raycaster.ray.origin.y -= controls.object.playerHeight;
		
		raycasterFront.ray.origin.copy( controls.object.position );
		controls.getDirection(raycasterFront.ray.direction);
		//raycasterFront.ray.origin.y -= 1;

		var vector = new THREE.Vector3(0, 0, -1);
		vector = camera.localToWorld(vector);
		vector.sub(camera.position); // Now vector is a unit vector with the same direction as the camera

		raycasterCamera.ray.direction = vector;

		if (multiplayer) {
			multiplayer.sendData(controls.object.position, controls.getDirection(raycasterFront.ray.direction));
			//multiplayer.adjustAudioVolume();
		}

		controlsModule.updateControls(controlsEnabled, clock, controls, collidableMeshList, raycaster, raycasterFront, raycasterCamera);
	    renderer.render(scene, camera);
	    
		proximityModule.proximityDetector();
		transformModule.animateDoors();
 		

		transformModule.animateDrop();
		//transformModule.patrolRobot(botBody);
 	
		/*if(botAggressive == 1)
			{
				robotAttack();
			}	 	
	 	} */
		
 		camera.updateProjectionMatrix();
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

export function startSingleplayer() {
	gameMode = "SinglePlayer";
    console.log("Starting Singleplayer mode...");

}

export function startMultiplayer() {
	gameMode = "MultiPlayer";
    console.log("Starting Multiplayer mode...");
    import('./Resources/functions/multiplayer.mjs').then(module => {
        multiplayer = new module.Multiplayer(renderer, collidableMeshList, scene);
        multiplayer.init();
    });
}

// Make the functions globally accessible
window.startSingleplayer = startSingleplayer;
window.startMultiplayer = startMultiplayer;

window.onload = init;
window.onclick = closeStart;