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
import { orangeSessions } from './Resources/functions/sessions.mjs';
import * as hallOfFame from './Resources/functions/hallOfFame.mjs';

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
var serverScoresActive = false;
var sessionKills = new Map();   // kills per player in the running round
var sessionDeaths = new Map();  // deaths per player in the running round
var roundPaused = false;        // true between the end of a round and the start of the next one
var viewBeforeDeath = null;     // camera orientation saved when the player is busted // true once the server has sent its scoreboard; then clients stop counting

// Load game mode from localStorage to persist across page reloads
try { gameMode = localStorage.getItem('orange.lastMode'); } catch(e) {}

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
	if (mqttEnabled && multiplayer) multiplayer.sendEvent(type, destination);
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
		// Busted: no input, no mouse look, and the view falls over. The orientation is restored on respawn.
		controlsModule.setInputBlocked(true);
		if (controls && controls.object) {
			viewBeforeDeath = controls.object.quaternion.clone();
			controls.enabled = false;
			controls.object.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2));
		}
		// Track local player defeat
		if (multiplayer && multiplayer.name) {
			const localPlayerName = multiplayer.name;
			if (!serverScoresActive) {
				const currentCount = defeatedPlayers.get(localPlayerName) || 0;
				defeatedPlayers.set(localPlayerName, currentCount + 1);
				updateDefeatedCounter();
			}
			// Send defeat event: other players (old server) or the server's counter (new server)
			if (multiplayer) {
				// Servers with sessions take JSON {name, by} so kills can be counted; older ones only a plain name
				const killer = multiplayer.getLastHitterName();
				if (orangeSessions.current) recordSessionDefeat(localPlayerName, killer);
				addKillFeedEntry(localPlayerName, killer);
				const payload = (orangeSessions.supported && killer) ? JSON.stringify({ name: localPlayerName, by: killer }) : localPlayerName;
				multiplayer.sendEvent("defeated", payload);
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

// Kill feed, top left: the last five bustings, each shown for eight seconds
var killFeedEntries = [];
const KILL_FEED_MAX = 5;
const KILL_FEED_MS = 8000;

function addKillFeedEntry(victim, killer) {
	if (!victim) return;
	killFeedEntries.push({
		text: killer ? killer + " busted " + victim : victim + " was busted",
		until: performance.now() + KILL_FEED_MS
	});
	while (killFeedEntries.length > KILL_FEED_MAX) killFeedEntries.shift();
	renderKillFeed();
	setTimeout(renderKillFeed, KILL_FEED_MS + 100);
}

function renderKillFeed() {
	const feed = document.getElementById("killFeed");
	if (!feed) return;
	const now = performance.now();
	killFeedEntries = killFeedEntries.filter(entry => entry.until > now);
	feed.textContent = "";
	killFeedEntries.forEach(entry => {
		const line = document.createElement("div");
		line.className = "killFeedEntry";
		line.textContent = entry.text;
		feed.appendChild(line);
	});
}

function recordSessionDefeat(victim, killer) {
	if (victim) sessionDeaths.set(victim, (sessionDeaths.get(victim) || 0) + 1);
	if (killer) sessionKills.set(killer, (sessionKills.get(killer) || 0) + 1);
	updateDefeatedCounter();
}

function resetSessionStats() {
	sessionKills = new Map();
	sessionDeaths = new Map();
	updateDefeatedCounter();
}

// Board for the running round: kills / deaths per player, most kills first
function updateRoundBoard(container, title) {
	title.textContent = "ROUND  K / D";
	container.textContent = "";
	const names = Array.from(new Set(Array.from(sessionKills.keys()).concat(Array.from(sessionDeaths.keys()))));
	names.sort((a, b) => ((sessionKills.get(b) || 0) - (sessionKills.get(a) || 0)) || ((sessionDeaths.get(a) || 0) - (sessionDeaths.get(b) || 0)));
	if (names.length === 0) {
		const empty = document.createElement("div");
		empty.className = "defeatedEntry";
		empty.textContent = "0 / 0";
		container.appendChild(empty);
		return;
	}
	names.forEach(name => {
		const entry = document.createElement("div");
		entry.className = "defeatedEntry";
		entry.textContent = name + ": " + (sessionKills.get(name) || 0) + " / " + (sessionDeaths.get(name) || 0);
		container.appendChild(entry);
	});
}

function updateDefeatedCounter() {
	const container = document.getElementById("defeatedCounter");
	if (!container) return;
	const title = document.getElementById("defeatedCounterTitle");
	if (orangeSessions.current && title) {
		updateRoundBoard(container, title);
		return;
	}
	if (title) title.textContent = "DEFEATED";
	
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

// Server-authoritative scoreboard: replaces the local map, called from GetScores and ScoresUpdated
export function handleServerScores(scores) {
	if (!scores || typeof scores !== 'object') return;
	serverScoresActive = true;
	defeatedPlayers = new Map(Object.entries(scores).map(([name, count]) => [name, Number(count) || 0]));
	updateDefeatedCounter();
}

export function handleDefeated(playerName) {
	if (serverScoresActive) return; // the server counts and will send ScoresUpdated
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
	if (serverScoresActive) return; // peer sync is only the fallback for old servers
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
	if (serverScoresActive) return;
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
	
	// Restore a level view. Setting rotation.x on the camera is not enough: the mouse look keeps the
	// orientation as a quaternion in YXZ order, so rebuild it from the heading the player had.
	const heading = new THREE.Euler().setFromQuaternion(viewBeforeDeath || controls.object.quaternion, 'YXZ');
	heading.x = 0;
	heading.z = 0;
	controls.object.quaternion.setFromEuler(heading);
	viewBeforeDeath = null;
	controls.enabled = true;
	if (playerBody) playerBody.rotation.set(0, 0, 0);
	controlsModule.resetMovement();
	// between two rounds everyone waits in a cell; the next round releases the input
	controlsModule.setInputBlocked(roundPaused);
	controls.enabled = !roundPaused;
	
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


const cameraDirection = new THREE.Vector3();

function animate() {

	// A bounding-box pass over every collidable object used to run here on each frame.
	// Its result was never read, so it is gone; movement collisions live in controls.mjs.

	requestAnimationFrame(animate); 
	if (toWakeUp === true) {

		//updateMirrors();
		raycaster.ray.origin.copy( controls.object.position );

		raycasterFront.ray.origin.copy( controls.object.position );
		controls.getDirection(raycasterFront.ray.direction);

		camera.getWorldDirection(cameraDirection); // camera forward direction, normalized

		raycasterCamera.ray.origin.copy(camera.position);
		raycasterCamera.ray.direction.copy(cameraDirection);

		if (multiplayer) {
			multiplayer.sendData(controls.object.position, raycasterFront.ray.direction);
			//multiplayer.adjustAudioVolume();
		}

		var delta = clock.getDelta();
		controlsModule.updateControls(controlsEnabled, delta, controls, collidableMeshList, raycaster, raycasterFront, raycasterCamera);
	    renderer.render(scene, camera);
	    
		// proximityModule.proximityDetector() was called here without arguments: it threw on its
		// first line and swallowed the error, on every frame, and never did anything else.
		transformModule.animateDoors();
 		

		transformModule.animateDrop();
		// new bullets are not in the scene yet; asking the bullet is cheaper than searching the scene by name
		const bullets = bulletControl.getBulletArray();
		for (let i = 0; i < bullets.length; i++) {
			if (bullets[i].parent === null) scene.add(bullets[i]);
		}
		bulletControl.updateCollidableMeshList(collidableMeshList);
		transformModule.animateBullets(bulletControl.getBulletArray(), delta, collidableMeshList);
		//transformModule.patrolRobot(botBody);
 	
		/*if(botAggressive == 1)
			{
				robotAttack();
			}	 	
	 	} */
		// the projection only changes on zoom and resize, which update it themselves
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
	try { localStorage.setItem('orange.lastMode', 'MultiPlayer'); } catch(e) { console.log('Could not save lastMode:', e); }
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
	try { localStorage.setItem('orange.lastMode', 'SinglePlayer'); } catch(e) { console.log('Could not save lastMode:', e); }
	closeStart();
	init();
}

var multiplayerStarting = false;

export function startMultiplayerWithName() {
	if (multiplayerStarting) return; // already on the way in, e.g. a double click
	var player_name = document.getElementById("player_name").value.trim();
	var selected_server_id = document.getElementById("serverSelector").value;
	if(player_name === "" || player_name === null){
		alert("Please type in a name for your player!");
		return;
	}else{
		multiplayerStarting = true;
		gameMode = "MultiPlayer";
		showDefeatedCounter(true);
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
			orangeSessions.choose(chosenSession());
			showWelcomeMessage(player_name);
			setTimeout(() => {
				loadMultiplayer(player_name, selected_server.defaultUrl);
				removeWelcomeMessage();
			}, 2000);
		});
	}
}



// ---------- Session UI: dropdown, countdown, result screen ----------
// Plumbing and events live in Resources/functions/sessions.mjs and multiplayer.mjs.
function formatSeconds(totalSeconds) {
	const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
	return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

// Fill the session dropdown for one server. Hides the whole chooser if that server has no sessions.
async function updateSessionTable(baseUrl) {
	const chooser = document.getElementById("sessionChooser");
	const container = document.getElementById("sessionTableContainer");
	const startButton = document.getElementById("start_multiplayer_button");
	if (!chooser || !container) return;

	const sessions = await orangeSessions.list(baseUrl); // sets orangeSessions.supported
	if (!orangeSessions.supported) {
		// server without sessions: the plain Start Game button is the way in
		chooser.style.display = "none";
		if (startButton) startButton.style.display = "";
		return;
	}

	// One table, one row per option; the button in a row starts the game with that option
	const rows = [{ id: "new", name: "New session", time: "2:00", players: "you", action: "Start" }];
	sessions.forEach(session => rows.push({
		id: String(session.id),
		name: String(session.name),
		time: formatSeconds(session.secondsRemaining) + " left",
		players: session.playerCount + " of " + session.maxPlayers,
		action: "Join"
	}));
	rows.push({ id: "lobby", name: "Lobby (no session)", time: "no limit", players: "open", action: "Join" });

	const table = document.createElement("table");
	table.className = "sessionTable";
	const thead = document.createElement("thead");
	const headerRow = document.createElement("tr");
	["Session", "Time", "Players", ""].forEach(text => {
		const th = document.createElement("th");
		th.textContent = text;
		headerRow.appendChild(th);
	});
	thead.appendChild(headerRow);
	table.appendChild(thead);

	const tbody = document.createElement("tbody");
	rows.forEach(entry => {
		const row = document.createElement("tr");
		[entry.name, entry.time, entry.players].forEach(text => {
			const cell = document.createElement("td");
			cell.textContent = text;
			row.appendChild(cell);
		});
		const actionCell = document.createElement("td");
		const button = document.createElement("button");
		button.className = "joinButton";
		button.textContent = entry.action;
		button.dataset.sessionId = entry.id;
		button.dataset.sessionName = entry.name;
		button.addEventListener("click", () => chooseSession(entry.id));
		actionCell.appendChild(button);
		row.appendChild(actionCell);
		tbody.appendChild(row);
	});
	table.appendChild(tbody);

	container.textContent = "";
	container.appendChild(table);
	chooser.style.display = "block";
	if (startButton) startButton.style.display = "none"; // the rows start the game
}

// Wrapper to maintain backward compatibility
async function updateSessionDropdown(baseUrl) {
	return updateSessionTable(baseUrl);
}

async function updateSessionDropdownForSelectedServer(server_list) {
	const serverSelector = document.getElementById("serverSelector");
	if (!serverSelector) return;
	try {
		const list = server_list || await retrieveServerList();
		const selected = list.find(s => s.id === serverSelector.value);
		if (selected) await updateSessionDropdown(selected.baseUrl);
	} catch (e) {
		console.log("Could not update the session list:", e);
	}
}

// What the player picked: 'new', a session id, or null for the lobby
function chosenSession() {
	const chooser = document.getElementById("sessionChooser");
	if (!chooser || chooser.style.display === "none") return null; // server without sessions
	return orangeSessions.choice;
}

// A row button in the session table: remember the choice and start the game right away
function chooseSession(sessionId) {
	const lobby = sessionId === "lobby" || sessionId === null || sessionId === undefined || sessionId === "";
	orangeSessions.choose(lobby ? null : String(sessionId));
	startMultiplayerWithName();
}

function updateSessionCountdown(secondsLeft, visible) {
	const countdown = document.getElementById("sessionCountdown");
	const timeSpan = document.getElementById("sessionTime");
	if (!countdown || !timeSpan) return;
	timeSpan.textContent = formatSeconds(secondsLeft);
	countdown.classList.toggle("healthBarHidden", !visible);
	countdown.classList.toggle("low", visible && secondsLeft <= 15);
}

function showSessionNotice(text) {
	let notice = document.getElementById("sessionNotice");
	if (!notice) {
		notice = document.createElement("div");
		notice.id = "sessionNotice";
		notice.style.cssText = "position:fixed; top:60px; left:50%; transform:translateX(-50%); z-index:1000; padding:6px 12px;" +
			" color:#fff; background:rgba(0,0,0,0.6); border-radius:4px; font-family:Arial,sans-serif; pointer-events:none;";
		document.body.appendChild(notice);
	}
	notice.textContent = text;
	notice.style.display = "block";
	setTimeout(() => { notice.style.display = "none"; }, 6000);
}

var sessionResultTimer = null;

function showSessionResults(detail) {
	const kills = (detail && detail.kills) || {};
	const defeats = (detail && detail.defeats) || {};
	let overlay = document.getElementById("sessionResultOverlay");
	if (!overlay) {
		overlay = document.createElement("div");
		overlay.id = "sessionResultOverlay";
		document.body.appendChild(overlay);
	}
	overlay.textContent = "";
	const title = document.createElement("h1");
	title.textContent = ((detail && detail.name) || "Session") + " is over";
	overlay.appendChild(title);

	// everyone who scored or was busted; most kills first, then fewest times busted
	const names = Array.from(new Set(Object.keys(kills).concat(Object.keys(defeats))));
	names.sort((a, b) => ((kills[b] || 0) - (kills[a] || 0)) || ((defeats[a] || 0) - (defeats[b] || 0)));

	// winner: best by kills, then by fewest deaths; equal on both is a draw; no kills at all, no winner
	const winnerLine = document.createElement("h2");
	winnerLine.id = "sessionWinner";
	const score = (name) => [(kills[name] || 0), (defeats[name] || 0)];
	const best = names.filter(name => score(name)[0] === score(names[0])[0] && score(name)[1] === score(names[0])[1]);
	if (names.length === 0 || score(names[0])[0] === 0) {
		winnerLine.textContent = "No winner, nobody scored a kill";
	} else if (best.length > 1) {
		winnerLine.textContent = "Draw: " + best.join(" and ");
	} else {
		winnerLine.textContent = "Winner: " + names[0];
	}
	overlay.appendChild(winnerLine);

	const table = document.createElement("table");
	table.id = "sessionResults";
	const thead = document.createElement("thead");
	const headerRow = document.createElement("tr");
	["Rank", "Player", "Kills", "Deaths", "K/D"].forEach(text => {
		const th = document.createElement("th");
		th.textContent = text;
		headerRow.appendChild(th);
	});
	thead.appendChild(headerRow);
	table.appendChild(thead);

	const tbody = document.createElement("tbody");
	if (names.length === 0) {
		const row = document.createElement("tr");
		const cell = document.createElement("td");
		cell.colSpan = 5;
		cell.textContent = "Nobody was busted.";
		row.appendChild(cell);
		tbody.appendChild(row);
	} else {
		names.forEach((name, index) => {
			const killCount = kills[name] || 0;
			const deathCount = defeats[name] || 0;
			// no deaths: the ratio is undefined, show the kills as they are
			const ratio = deathCount === 0 ? (killCount === 0 ? "0.00" : killCount + ".00 (never busted)") : (killCount / deathCount).toFixed(2);
			const row = document.createElement("tr");
			[(index + 1) + ".", name, String(killCount), String(deathCount), ratio].forEach(text => {
				const cell = document.createElement("td");
				cell.textContent = text;
				row.appendChild(cell);
			});
			tbody.appendChild(row);
		});
	}
	table.appendChild(tbody);
	overlay.appendChild(table);

	const footer = document.createElement("p");
	overlay.appendChild(footer);
	const leaveButton = document.createElement("button");
	leaveButton.className = "modeButton";
	leaveButton.textContent = "Back to the menu";
	leaveButton.addEventListener("click", () => {
		clearInterval(sessionResultTimer);
		Promise.resolve(orangeSessions.leave()).finally(() => location.reload());
	});
	overlay.appendChild(leaveButton);
	overlay.style.display = "block";

	// The server starts the next round 10 s after the end and announces it (orange:sessionJoined).
	// If nothing arrives a few seconds later (older server, or nobody left), go back to the menu.
	let remaining = 10;
	footer.textContent = "Next round in " + remaining + " s";
	clearInterval(sessionResultTimer);
	sessionResultTimer = setInterval(() => {
		remaining--;
		footer.textContent = remaining > 0 ? "Next round in " + remaining + " s" : "Waiting for the next round ...";
		if (remaining <= -4) {
			clearInterval(sessionResultTimer);
			location.reload();
		}
	}, 1000);
}

function hideSessionResults() {
	clearInterval(sessionResultTimer);
	const overlay = document.getElementById("sessionResultOverlay");
	if (overlay) overlay.style.display = "none";
}

window.addEventListener("orange:sessionJoined", (e) => {
	hideSessionResults(); // a new round has started
	resetSessionStats(); // kills and deaths count per round
	// release the players that were parked in their cells at the end of the last round
	roundPaused = false;
	if (controls && health > 0) {
		resetHealth();
		controlsModule.setInputBlocked(false);
		controls.enabled = true;
	}
	updateSessionCountdown(e.detail.secondsLeft, true);
	showSessionNotice("You are in " + (e.detail.name || "a session"));
});
window.addEventListener("orange:sessionTime", (e) => updateSessionCountdown(e.detail.secondsLeft, true));
window.addEventListener("orange:sessionEnded", (e) => {
	hallOfFame.recordRound(e.detail); // best K/D of the round goes into the hall of fame
	// round over: everyone back into a cell with full health, no moving or shooting during the results.
	// A player who is busted right now gets there through the respawn that is already scheduled.
	roundPaused = true;
	if (controls && health > 0) {
		resetHealth();
		respawnPlayer();
	}
	setTimeout(updateDefeatedCounter, 0); // back to the all-time board until the next round starts
	updateSessionCountdown(0, false);
	showSessionResults(e.detail);
});
window.addEventListener("orange:sessionJoinFailed", (e) => {
	updateSessionCountdown(0, false);
	showSessionNotice("Session not available (" + ((e.detail && e.detail.reason) || "unknown") + "). You are in the lobby.");
});
{
	const serverSelector = document.getElementById("serverSelector");
	if (serverSelector) serverSelector.addEventListener("change", () => updateSessionDropdownForSelectedServer());
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
		setTimeout(() => updateSessionDropdownForSelectedServer(server_list), 0);
			
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


// Hall of fame on the start screen: from the server the player used last, or the first one in the list
async function showHallOfFame() {
	// Hide hall of fame in singleplayer mode
	if (gameMode === 'SinglePlayer') return;
	hallOfFame.render(hallOfFame.loadLocal(), 'Rounds played in this browser');
	try {
		const servers = await retrieveServerList();
		let savedId = null;
		try { savedId = localStorage.getItem('orange.serverId'); } catch (e) { savedId = null; }
		const server = servers.find(s => s.id === savedId) || servers[0];
		if (server) await hallOfFame.show(server.baseUrl, server.name);
	} catch (e) {
		console.log("Hall of fame: server list not available, showing local entries.", e);
	}
}
showHallOfFame();

// Make the functions globally accessible
window.startSingleplayer = startSingleplayer;
window.startMultiplayer = startMultiplayer;
window.startMultiplayerWithName = startMultiplayerWithName;
window.init = init;
window.showBustedMessage = showBustedMessage;
window.takeDamage = takeDamage;
window.handleDefeated = handleDefeated;
window.chooseSession = chooseSession;
window.handleScoresRequest = handleScoresRequest;
window.handleScores = handleScores;
window.handleServerScores = handleServerScores;
window.handleSessionDefeat = recordSessionDefeat;
window.handleKillFeed = addKillFeedEntry;
window.events2main = events2main;
