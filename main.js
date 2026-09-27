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
import * as bulletControl from './Resources/functions/bulletControl.mjs';

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
var health = 100;
var defeatedPlayers = new Map();

// Load defeated scores from localStorage on startup
try {
	const savedScores = localStorage.getItem('orange.defeated');
	if (savedScores) {
		const scores = JSON.parse(savedScores);
		for (const [playerName, count] of Object.entries(scores)) {
			defeatedPlayers.set(playerName, count);
		}
		updateDefeatedCounter();
	}
} catch (e) {
	console.log("Could not load scores from localStorage:", e);
}

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

const raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 100 );
const raycasterFront = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 1, 0, 0 ), 0, 1 );
var raycasterCamera;

var playerBoundingBox;
var performanceBoostGlobal = true;

objectsModule.setPerformanceOptimization(performanceBoostGlobal);
prisonCellModule.setPerformanceOptimization(performanceBoostGlobal);
hallwayModule.setPerformanceOptimization(performanceBoostGlobal);

export function events2main(type, destination){
	if (multiplayer) multiplayer.sendEvent(type, destination);
}

function updateHealthBar() {
	const container = document.getElementById("healthBarContainer");
	const healthBarFill = document.getElementById("healthBarFill");
	const healthBarText = document.getElementById("healthBarText");
	if (!container || !healthBarFill || !healthBarText) return;

	const percentage = Math.max(0, Math.min(100, health));
	healthBarFill.style.width = percentage + "%";
	healthBarText.textContent = percentage;

	var color = "#3ddc5a"; // green
	if (percentage < 34) {
		color = "#ff3b3b"; // red
	} else if (percentage < 67) {
		color = "#ffb020"; // orange
	}
	healthBarFill.style.backgroundColor = color;
	healthBarText.style.color = (percentage < 34) ? color : "#ffffff";
	container.classList.toggle("low", percentage < 34);
}

function resetHealth() {
	health = 100;
	updateHealthBar();
	// Show health bar
	const healthBar = document.getElementById("healthBarContainer");
	if (healthBar) {
		healthBar.classList.remove("healthBarHidden");
	}
}

export function takeDamage(amount) {
	if (health <= 0) return;
	
	health -= amount;
	updateHealthBar();
	
	if (health <= 0) {
		health = 0;
		updateHealthBar();
		showBustedMessage();
			// Flip player to show defeat
			if (controls && controls.object) {
				controls.object.rotation.x = Math.PI;
			}
		// Track local player defeat
		if (multiplayer && multiplayer.name) {
			const localPlayerName = multiplayer.name;
			const currentCount = defeatedPlayers.get(localPlayerName) || 0;
			defeatedPlayers.set(localPlayerName, currentCount + 1);
			updateDefeatedCounter();
			// Send defeat event to other players
			if (multiplayer) {
				multiplayer.sendEvent("defeated", localPlayerName);
			}
		}
		// Reset health after busted message and respawn
		setTimeout(() => {
			resetHealth();
			respawnPlayer();
			// Notify other players of respawn
			if (multiplayer) {
				multiplayer.sendEvent("healthReset", multiplayer.name);
			}
		}, 3000);
	}
}

function updateDefeatedCounter() {
	const container = document.getElementById("defeatedCounter");
	if (!container) return;
	
	const entries = Array.from(defeatedPlayers.entries()).sort((a, b) => b[1] - a[1]);
	
	container.innerHTML = "";
	
	if (entries.length === 0) {
		const span = document.createElement("span");
		span.textContent = "0";
		container.appendChild(span);
		return;
	}
	
	// Format as highscore list using safe DOM methods
	entries.forEach(([name, count]) => {
		const entry = document.createElement("div");
		entry.className = "defeatedEntry";
		const nameSpan = document.createElement("span");
		nameSpan.textContent = name + ": ";
		const countSpan = document.createElement("span");
		countSpan.textContent = String(count);
		entry.appendChild(nameSpan);
		entry.appendChild(countSpan);
		container.appendChild(entry);
	});
}

export function handleDefeated(playerName) {
	const currentCount = defeatedPlayers.get(playerName) || 0;
	defeatedPlayers.set(playerName, currentCount + 1);
	updateDefeatedCounter();
	
	// Save to localStorage for persistence across reloads
	try {
		const scores = Object.fromEntries(defeatedPlayers.entries());
		localStorage.setItem('orange.defeated', JSON.stringify(scores));
	} catch (e) {
		console.log("Could not save scores to localStorage:", e);
	}
	
	// Broadcast scores to other players
	if (multiplayer) {
		const scoresJson = JSON.stringify(Object.fromEntries(defeatedPlayers.entries()));
		multiplayer.sendEvent("scores", scoresJson);
	}
}


// Handle scores update from other players
export function handleScores(scoresJson, sourcePlayerId) {
	try {
		const receivedScores = JSON.parse(scoresJson);
		// Merge with Math.max
		for (const [playerName, count] of Object.entries(receivedScores)) {
			const currentCount = defeatedPlayers.get(playerName) || 0;
			if (count > currentCount) {
				defeatedPlayers.set(playerName, count);
			}
		}
		updateDefeatedCounter();
		
		// Save merged scores to localStorage
		try {
			localStorage.setItem('orange.defeated', JSON.stringify(Object.fromEntries(defeatedPlayers.entries())));
		} catch (e) {
			console.log("Could not save merged scores to localStorage:", e);
		}
	} catch (e) {
		console.log("Could not parse scores:", e);
	}
}


// Handle scores request from other players
export function handleScoresRequest(sourcePlayerId) {
	// Send our current scores to the requester
	if (multiplayer) {
		const scoresJson = JSON.stringify(Object.fromEntries(defeatedPlayers.entries()));
		multiplayer.sendEvent("scores", scoresJson);
	}
}

// Get spawn position for a given cell index
function getCellSpawnPosition(cellIndex) {
	const cellRowCount = 2;
	const cellsPerRow = 6;
	const cellStartX = -30;
	const cellStartZ = 0;
	const cameraPositionInCellOfset = 3;
	
	const row = Math.floor(cellIndex / cellsPerRow);
	const col = cellIndex % cellsPerRow;
	
	const cellOffsetX = cellStartX + (12 * col);
	const cellOffsetZ = cellStartZ + (42 * row);
	
	// For row 1, cells are rotated by Math.PI, so interior faces opposite direction
	// Need to flip the offset sign for row 1 to spawn inside the cell
	const sign = row === 0 ? 1 : -1;
	
	// Position within cell (similar to initial spawn)
	return {
		x: cellOffsetX + sign * cameraPositionInCellOfset,
		y: 10, // Eye height + playerHeight
		z: cellOffsetZ + sign * cameraPositionInCellOfset
	};
}

// Respawn player in a random cell (similar to initial spawn)
function respawnPlayer() {
	if (!controls || !controls.object) return;
	
	// Reset rotation
	controls.object.rotation.x = 0;
	
	const totalCellcount = 2 * 6; // cellRowCount * cellsPerRow
	const startCell = Math.floor(Math.random() * totalCellcount);
	console.log("Respawning at cell: " + startCell);
	
	const pos = getCellSpawnPosition(startCell);
	controls.object.position.set(pos.x, pos.y, pos.z);
}


function showDefeatedCounter(show) {
	const container = document.getElementById("defeatedCounterContainer");
	if (container) {
		if (show) {
			container.classList.remove("healthBarHidden");
		} else {
			container.classList.add("healthBarHidden");
		}
	}
}



async function retrieveServerList() {
    const response = await fetch("https://umps.tdj23.com/api/Server/GetServers");

    if (response.ok) {
		var server_list = await response.json();
        return server_list;
    } else {
		console.log(response);
        throw new Error('Retrieving server list failed.');
    }
}

function createServerListDropdown(server_list) {
	const select = document.getElementById("serverSelector")
	server_list.forEach(element => {
		let option = new Option(element.name, element.id)
		select.add(option, undefined);
	});

	select.selectedIndex = 0;
}


function closeStart() {
	toWakeUp = splashScreenModule.closeStart();
}

function GetCollidableMeshList() {
	return collidableMeshList
}

function init() { 
	
	renderer = new THREE.WebGLRenderer({
		antialias: false,
		powerPreference: "high-performance"
	});
	renderer._microCache = MicroCache();
	renderer.domElement.id = "scene";
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setSize(window.innerWidth, window.innerHeight);
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

	controlsModule.initControls(renderer, scene);

	controls = new PointerLockControls(camera, document.body);
	
	var playerHeight = 5.0;
	controls.object.playerHeight = playerHeight;
	controls.object.position.set(5, 5 + playerHeight, 8); // cell floor is at y=5, eye must stay below the cell ceiling (~14.4) or the ground ray lands on the roof
	playerBody = new objectsModule.JailBotBody(renderer);
	controls.object.add(playerBody);
	playerBody.position.set(0, 0.5, 1); 

	playerBoundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
	playerBoundingBox.setFromObject(controls.object);


	scene.add(controls.object);

	// Initialize health bar
	resetHealth();

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
		fullHallway.position.set(hallwayOffset,5,21);
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

	raycasterCamera = new THREE.Raycaster( camera.position, vector, 0, 50);

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
			rootCell.position.set(cellOffsetX,5,cellOffsetZ);
			rootCell.rotateY(rotate);
			scene.add(rootCell);

			//console.log("CurrentCell: "+ currentCell);
			if (currentCell == startCell) {
				const pos = getCellSpawnPosition(startCell);
				camera.position.x = pos.x;
				camera.position.y = pos.y;
				camera.position.z = pos.z;
			}
			currentCell++;
		}
	}


	addWall(renderer);

	//cloning(4);
	addTowers(renderer);

	pointerLockModule.initPointerLock(havePointerLock);
	addRamps(renderer);
	addFoundation();
	addSandFloor(renderer);
	addBullets(renderer);

	sun();

	bulletControl.setPositionReference(camera);

	THREE.DefaultLoadingManager.onLoad = function () {
		//console.log("finished loading");
    	loadDone = true;
    	
	};

	animate();	

	// Add window resize handler for canvas
	window.addEventListener('resize', () => {
		renderer.setSize(window.innerWidth, window.innerHeight);
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		// Recompute crosshair position based on new aspect ratio
		const crosshair = camera.getObjectByName('crosshair');
		if (crosshair) {
			const crosshairPercentX = 50;
			const crosshairPositionX = (crosshairPercentX / 100) * 2 - 1;
			crosshair.position.x = crosshairPositionX * camera.aspect;
		}
	});
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
	ramp1.position.set(-35,2.5,12);
	scene.add(ramp1);
	collidableMeshList.push(ramp1);

	var ramp2 = new objectsModule.Ramp(renderer);
	ramp2.rotateY(Math.PI);
	ramp2.position.set(35,2.5,30);
	scene.add(ramp2);
	collidableMeshList.push(ramp2);



}


function addFoundation() {
	// Matches the building footprint (cells x:-30..42, z:0..48)
	var geometry = new THREE.BoxGeometry(75, 4, 50);
	var material = new THREE.MeshLambertMaterial({ color: 0x7a6b5a });
	var foundation = new THREE.Mesh(geometry, material);
	foundation.position.set(6, 2.5, 23);
	scene.add(foundation);
	collidableMeshList.push(foundation);
}

function addWall(renderer) {
	prisonWallRoot = new objectsModule.PrisonWall(renderer);
	prisonWallRoot.rotation.y += Math.PI/2;
	var y = 0;
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
	var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
	dirLight.position.set(20, 40, 30);

	const sun = new THREE.AmbientLight(0x404040, 0.4);

	scene.add(dirLight);
	scene.add(sun);
	
}
function addSandFloor(renderer) {
	var sand = new objectsModule.Sand(renderer);
	sand.position.set(100, 0, 100);
	scene.add(sand);
	collidableMeshList.push(sand);
}

function addBullets(renderer) {
	var bullet = new bulletControl.Bullet(renderer);
	bullet.position.set(20, 20, 20);
	scene.add(bullet);	
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
		//console.log("Colision detected with:");
		//console.log(collidingObjects);

	}


	requestAnimationFrame(animate); 
	if (toWakeUp === true) {

		//updateMirrors();
		raycaster.ray.origin.copy( controls.object.position );

		raycasterFront.ray.origin.copy( controls.object.position );
		controls.getDirection(raycasterFront.ray.direction);

		var vector = new THREE.Vector3();
		camera.getWorldDirection(vector); // Get camera forward direction as normalized vector

		raycasterCamera.ray.origin.copy(camera.position);
		raycasterCamera.ray.direction = vector;

		if (multiplayer) {
			multiplayer.sendData(controls.object.position, controls.getDirection(raycasterFront.ray.direction));
			//multiplayer.adjustAudioVolume();
		}

		var delta = clock.getDelta();
		controlsModule.updateControls(controlsEnabled, delta, controls, collidableMeshList, raycaster, raycasterFront, raycasterCamera);
	    renderer.render(scene, camera);
	    
		proximityModule.proximityDetector();
		transformModule.animateDoors();
 		

		transformModule.animateDrop();
		bulletControl.getBulletArray().forEach(singleBullet => {
			if(null == scene.getObjectByName(singleBullet.getName())) {
				//console.log(singleBullet);
				scene.add(singleBullet);
			}
		});
		bulletControl.updateCollidableMeshList(collidableMeshList);
		transformModule.animateBullets(bulletControl.getBulletArray(), delta, collidableMeshList);
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
	camera.updateProjectionMatrix();
}

function showMessage(text){
	document.getElementById("message").innerHTML=text;
}

function showWelcomeMessage(player_name){
	console.log("Hello " + player_name + "!");
	document.getElementById("welcomeMessage").innerHTML="<h1>Hello " + player_name + "!</h1><br>The game starts in 2 seconds!";
	document.getElementById("welcomeMessage").style.display="block";
}

function removeWelcomeMessage(){
	document.getElementById("welcomeMessage").style.display="none";
}

function showBustedMessage() {
	document.getElementById("bustedOverlay").classList.add("visible");
	// Hide after 3 seconds
	setTimeout(() => {
		document.getElementById("bustedOverlay").classList.remove("visible");
	}, 3000);
}

function loadMultiplayer(player_name, selected_server){
	console.log("Loading multiplayer...");
	closeStart();
	init();
	import('./Resources/functions/multiplayer.mjs').then(module => {
		multiplayer = new module.Multiplayer(renderer, collidableMeshList, scene, player_name, selected_server);
		multiplayer.init();
	});
}

export function startSingleplayer() {
	gameMode = "SinglePlayer";
    console.log("Starting Singleplayer mode...");
	showDefeatedCounter(false);
	closeStart();
	init();
}

export function startMultiplayerWithName() {
	gameMode = "MultiPlayer";
	showDefeatedCounter(true);
	var player_name = document.getElementById("player_name").value;
	var selected_server_id = document.getElementById("serverSelector").value;
	if(player_name === "" || player_name === null){
		alert("Please type in a name for your player!");
		return;
	}else{
		// Save player name and server to localStorage
		try {
			localStorage.setItem('orange.playerName', player_name);
			localStorage.setItem('orange.serverId', selected_server_id);
		} catch (e) {
			console.log("Could not save to localStorage:", e);
		}

		document.getElementById("userDetails").style.display = "none";
		console.log("Selected Server ID: " + selected_server_id)

		retrieveServerList().then((result) => {
			var server_list = result;
			// uncomment this line if you want to have a local url AND ALSO UNCOMMENT THE SAME LINE IN FUNCTION startMultiplayer()
			// server_list.push({id: "6666", name: "Lokales Gefängnis", baseUrl: "https://localhost:7000", defaultUrl: "https://localhost:7000/controlhub"});
			var selected_server = server_list.find(obj => {
				return obj.id === selected_server_id;
			});
			showWelcomeMessage(player_name);
			setTimeout(() => {
				loadMultiplayer(player_name, selected_server.defaultUrl);
				removeWelcomeMessage();
			}, 2000);
		});
	}
}

export function startMultiplayer() {
	gameMode = "MultiPlayer";
    console.log("Starting Multiplayer mode...");
	showDefeatedCounter(true);
	// show Config dialogue
	document.getElementById("userDetails").style.display = "block";

	// Try to load saved player name from localStorage
	try {
		const savedName = localStorage.getItem('orange.playerName');
		if (savedName) {
			document.getElementById("player_name").value = savedName;
		}
	} catch (e) {
		console.log("localStorage not available:", e);
	}

	console.log("Getting server list...");

	retrieveServerList().then((result) => {
		var server_list = result;
		// uncomment this line if you want to have a local url AND ALSO UNCOMMENT THE SAME LINE IN FUNCTION startMultiplayerWithName()
		// server_list.push({id: "6666", name: "Lokales Gefängnis", baseUrl: "https://localhost:7000", defaultUrl: "https://localhost:7000/controlhub"});
		console.log("Working on server list: " + JSON.stringify(server_list));
		createServerListDropdown(server_list);
			
			// Try to load saved server after dropdown is populated
			try {
				const savedServerId = localStorage.getItem('orange.serverId');
				if (savedServerId) {
					const serverSelector = document.getElementById("serverSelector");
					const hasServer = Array.from(serverSelector.options).some(opt => opt.value === savedServerId);
					if (hasServer) {
						serverSelector.value = savedServerId;
					}
				}
			} catch (e) {
				console.log("localStorage not available:", e);
			}
	});

	console.log("Selecting User Details");
}


// Make the functions globally accessible
window.startSingleplayer = startSingleplayer;
window.startMultiplayer = startMultiplayer;
window.startMultiplayerWithName = startMultiplayerWithName;
window.init = init;
window.showBustedMessage = showBustedMessage;
window.takeDamage = takeDamage;
window.handleDefeated = handleDefeated;
window.handleScoresRequest = handleScoresRequest;
window.handleScores = handleScores;
