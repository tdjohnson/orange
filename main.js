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
import * as loadingScreen from './Resources/functions/loadingScreen.mjs';

var clock;
var scene, camera, renderer;
var geometry, material, mesh;
var havePointerLock = pointerLockModule.checkForPointerLock();
var controls;
var controlsEnabled = true;
var multiplayer;
var mqttEnabled = false;
var playerBody;
var collidingObjects;
var collidableObjects;

var gameMode;
var health = 100;
var defeatedPlayers = new Map();
var serverScoresActive = false;
var sessionKills = new Map();
var sessionDeaths = new Map();
var roundPaused = false;
var viewBeforeDeath = null;

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
var collidableMeshList = [];

// ========== MIRROR SYSTEM ==========
// COMMENTED OUT: THREE.Mirror not available at CDN paths in r186
// var mirrorCameras = [];
// var mirrorTextures = [];
// var mirrorMeshes = [];

var toWakeUp = false;
var animationLock = false;

// Track if we're in an active game
var inActiveGame = false;

var collided = false;
var meshes = new Map();
var rootCell;
var prisonWallRoot;

const raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 100 );
const raycasterFront = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 1, 0, 0 ), 0, 1 );
var raycasterCamera;

var playerBoundingBox;

// ========== RENDERING QUALITY SETTINGS ==========
var qualityMode = 'balanced';

try {
	const savedQuality = localStorage.getItem('orange.qualityMode');
	if (savedQuality && ['performance', 'balanced', 'quality'].includes(savedQuality)) {
		qualityMode = savedQuality;
	}
} catch(e) {
	console.log("Could not load quality mode from localStorage:", e);
}

var performanceBoostGlobal = qualityMode === 'performance';

objectsModule.setPerformanceOptimization(performanceBoostGlobal);
prisonCellModule.setPerformanceOptimization(performanceBoostGlobal);
hallwayModule.setPerformanceOptimization(performanceBoostGlobal);

function events2main(type, destination){
	if (mqttEnabled && multiplayer) multiplayer.sendEvent(type, destination);
}
events2main._real = events2main;
window.events2main = events2main;
export { events2main };

function updateHealthBar() {
	const container = document.getElementById("healthBarContainer");
	const healthBarFill = document.getElementById("healthBarFill");
	const healthBarText = document.getElementById("healthBarText");
	if (!container || !healthBarFill || !healthBarText) return;

	const percentage = Math.max(0, Math.min(100, health));
	healthBarFill.style.width = percentage + "%";
	healthBarText.textContent = percentage;

	var color = "#3ddc5a";
	if (percentage < 34) {
		color = "#ff3b3b";
	} else if (percentage < 67) {
		color = "#ffb020";
	}
	healthBarFill.style.backgroundColor = color;
	healthBarText.style.color = (percentage < 34) ? color : "#ffffff";
	container.classList.toggle("low", percentage < 34);
}

function resetHealth() {
	health = 100;
	updateHealthBar();
	const healthBar = document.getElementById("healthBarContainer");
	if (healthBar) {
		healthBar.classList.remove("healthBarHidden");
	}
}

function takeDamage(amount) {
	if (health <= 0) return;
	
	health -= amount;
	updateHealthBar();
	
	if (health <= 0) {
		health = 0;
		updateHealthBar();
		showBustedMessage();
		controlsModule.setInputBlocked(true);
		if (controls && controls.object) {
			viewBeforeDeath = controls.object.quaternion.clone();
			controls.enabled = false;
			controls.object.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2));
		}
		if (multiplayer && multiplayer.name) {
			const localPlayerName = multiplayer.name;
			if (!serverScoresActive) {
				const currentCount = defeatedPlayers.get(localPlayerName) || 0;
				defeatedPlayers.set(localPlayerName, currentCount + 1);
				updateDefeatedCounter();
			}
			if (multiplayer) {
				const killer = multiplayer.getLastHitterName();
				if (orangeSessions.current) recordSessionDefeat(localPlayerName, killer);
				addKillFeedEntry(localPlayerName, killer);
				const payload = (orangeSessions.supported && killer) ? JSON.stringify({ name: localPlayerName, by: killer }) : localPlayerName;
				multiplayer.sendEvent("defeated", payload);
			}
		}
		setTimeout(() => {
			resetHealth();
			respawnPlayer();
			if (multiplayer) {
				multiplayer.sendEvent("healthReset", multiplayer.name);
			}
		}, 3000);
	}
}
takeDamage._real = takeDamage;
window.takeDamage = takeDamage;
export { takeDamage };

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
addKillFeedEntry._real = addKillFeedEntry;
window.handleKillFeed = addKillFeedEntry;
export { addKillFeedEntry as handleKillFeed };

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
recordSessionDefeat._real = recordSessionDefeat;
window.handleSessionDefeat = recordSessionDefeat;
export { recordSessionDefeat as handleSessionDefeat };

function resetSessionStats() {
	sessionKills = new Map();
	sessionDeaths = new Map();
	updateDefeatedCounter();
}

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

function handleServerScores(scores) {
	if (!scores || typeof scores !== 'object') return;
	serverScoresActive = true;
	defeatedPlayers = new Map(Object.entries(scores).map(([name, count]) => [name, Number(count) || 0]));
	updateDefeatedCounter();
}
handleServerScores._real = handleServerScores;
window.handleServerScores = handleServerScores;
export { handleServerScores };

function handleDefeated(playerName) {
	if (serverScoresActive) return;
	const currentCount = defeatedPlayers.get(playerName) || 0;
	defeatedPlayers.set(playerName, currentCount + 1);
	updateDefeatedCounter();
	try {
		const scores = Object.fromEntries(defeatedPlayers.entries());
		localStorage.setItem('orange.defeated', JSON.stringify(scores));
	} catch (e) {
		console.log("Could not save scores to localStorage:", e);
	}
	if (multiplayer) {
		const scoresJson = JSON.stringify(Object.fromEntries(defeatedPlayers.entries()));
		multiplayer.sendEvent("scores", scoresJson);
	}
}
handleDefeated._real = handleDefeated;
window.handleDefeated = handleDefeated;
export { handleDefeated };
function handleScores(scoresJson, sourcePlayerId) {
	if (serverScoresActive) return;
	try {
		const receivedScores = JSON.parse(scoresJson);
		for (const [playerName, count] of Object.entries(receivedScores)) {
			const currentCount = defeatedPlayers.get(playerName) || 0;
			if (count > currentCount) {
				defeatedPlayers.set(playerName, count);
			}
		}
		updateDefeatedCounter();
		try {
			localStorage.setItem('orange.defeated', JSON.stringify(Object.fromEntries(defeatedPlayers.entries())));
		} catch (e) {
			console.log("Could not save merged scores to localStorage:", e);
		}
	} catch (e) {
		console.log("Could not parse scores:", e);
	}
}
handleScores._real = handleScores;
window.handleScores = handleScores;
export { handleScores };

function handleScoresRequest(sourcePlayerId) {
	if (serverScoresActive) return;
	if (multiplayer) {
		const scoresJson = JSON.stringify(Object.fromEntries(defeatedPlayers.entries()));
		multiplayer.sendEvent("scores", scoresJson);
	}
}
handleScoresRequest._real = handleScoresRequest;
window.handleScoresRequest = handleScoresRequest;
export { handleScoresRequest };

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
	const sign = row === 0 ? 1 : -1;
	return {
		x: cellOffsetX + sign * cameraPositionInCellOfset,
		y: 10,
		z: cellOffsetZ + sign * cameraPositionInCellOfset
	};
}

function respawnPlayer() {
	if (!controls || !controls.object) return;
	const heading = new THREE.Euler().setFromQuaternion(viewBeforeDeath || controls.object.quaternion, 'YXZ');
	heading.x = 0;
	heading.z = 0;
	controls.object.quaternion.setFromEuler(heading);
	viewBeforeDeath = null;
	controls.enabled = true;
	if (playerBody) playerBody.rotation.set(0, 0, 0);
	controlsModule.resetMovement();
	controlsModule.setInputBlocked(roundPaused);
	controls.enabled = !roundPaused;
	const totalCellcount = 2 * 6;
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
	updateHudVisibility();
}

function GetCollidableMeshList() {
	return collidableMeshList
}

// ========== CROSSHAIR FUNCTIONS ==========

/**
 * Creates a proper 3D crosshair with + shape
 * Fixed: Now creates proper horizontal and vertical lines
 */
function create3DCrosshair() {
	const crosshairSize = 0.03;
	const crosshairColor = 0xAAFFAA;
	const crosshairMaterial = new THREE.LineBasicMaterial({ color: crosshairColor });
	
	// Create proper crosshair geometry: horizontal and vertical lines
	const points = [];
	
	// Horizontal line (left to right)
	points.push(new THREE.Vector3(-crosshairSize, 0, -0.5));
	points.push(new THREE.Vector3(crosshairSize, 0, -0.5));
	
	// Vertical line (bottom to top)
	points.push(new THREE.Vector3(0, -crosshairSize, -0.5));
	points.push(new THREE.Vector3(0, crosshairSize, -0.5));
	
	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const crosshair = new THREE.LineSegments(geometry, crosshairMaterial);
	crosshair.name = 'crosshair';
	
	// Position at center of screen
	crosshair.position.z = -0.5;
	camera.add(crosshair);
	
	return crosshair;
}

/**
 * Updates the cooldown bar progress - bar is always visible
 */
function updateCooldownBar(progress) {
	const barFill = document.getElementById('cooldownBarFill');
	if (!barFill) return;
	
	// Progress goes from 0 (empty) to 1 (full)
	// When shooting, progress = 0, then increases to 1 over 1 second
	barFill.style.width = (progress * 100) + '%';
}

/**
 * Creates CSS crosshair as fallback/alternative
 */
function createCSSCrosshair() {
	// Remove existing 3D crosshair if any
	if (camera) {
		const existingCrosshair = camera.getObjectByName('crosshair');
		if (existingCrosshair) {
			camera.remove(existingCrosshair);
		}
	}
	
	let crosshair = document.getElementById('cssCrosshair');
	if (!crosshair) {
		crosshair = document.createElement('div');
		crosshair.id = 'cssCrosshair';
		crosshair.innerHTML = `
			<div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 0; height: 0; pointer-events: none;">
				<div style="position: absolute; left: -10px; top: 0; width: 20px; height: 2px; background: #AAFFAA;"></div>
				<div style="position: absolute; left: 0; top: -10px; width: 2px; height: 20px; background: #AAFFAA;"></div>
			</div>
		`;
		
		const rendererElement = renderer?.domElement;
		if (rendererElement && rendererElement.parentNode) {
			rendererElement.parentNode.style.position = 'relative';
			rendererElement.parentNode.insertBefore(crosshair, rendererElement);
		} else {
			document.body.style.position = 'relative';
			document.body.appendChild(crosshair);
		}
	}
}

// ========== QUALITY SETTINGS ==========
function applyQualitySettings() {
	if (!renderer) return;
	
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.0;
	renderer.physicallyCorrectLights = true;
	
	// Update performance mode flag for object modules
	performanceBoostGlobal = (qualityMode === 'performance');
	
	switch(qualityMode) {
		case 'performance':
			renderer.shadowMap.enabled = false;
			break;
		case 'balanced':
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFShadowMap;
			break;
		case 'quality':
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFShadowMap;
			break;
	}
	
	objectsModule.setPerformanceOptimization(performanceBoostGlobal);
	prisonCellModule.setPerformanceOptimization(performanceBoostGlobal);
	hallwayModule.setPerformanceOptimization(performanceBoostGlobal);
	
	// Force shadow map update by clearing and re-enabling if needed
	if (renderer.shadowMap.enabled) {
		renderer.shadowMap.needsUpdate = true;
	}
	
	try {
		localStorage.setItem('orange.qualityMode', qualityMode);
	} catch(e) {
		console.log("Could not save quality mode to localStorage:", e);
	}
}

function setQualityMode(mode) {
	if (['performance', 'balanced', 'quality'].includes(mode)) {
		qualityMode = mode;
		applyQualitySettings();
		console.log("Quality mode set to:", mode);
	}
}

function cycleQualityMode() {
	const modes = ['performance', 'balanced', 'quality'];
	const currentIndex = modes.indexOf(qualityMode);
	const nextIndex = (currentIndex + 1) % modes.length;
	setQualityMode(modes[nextIndex]);
	showQualityModeNotice();
	// Force re-apply settings in case renderer is already initialized
	if (renderer) {
		applyQualitySettings();
	}
	return qualityMode;
}

function showQualityModeNotice() {
	let notice = document.getElementById("qualityModeNotice");
	if (!notice) {
		notice = document.createElement("div");
		notice.id = "qualityModeNotice";
		notice.style.cssText = "position:fixed; top:24px; right:24px; z-index:1000; padding:8px 14px; " +
			"color:#fff; background:rgba(0,0,0,0.6); border-radius:4px; font-family:Arial,sans-serif; pointer-events:none;";
		document.body.appendChild(notice);
	}
	notice.textContent = "Quality mode: " + qualityMode;
	notice.style.display = "block";
	setTimeout(() => { notice.style.display = "none"; }, 2000);
}

function updateHudVisibility() {
	const cooldownContainer = document.getElementById("cooldownBarContainer");
	const pistolContainer = document.getElementById("pistolContainer");
	if (cooldownContainer) {
		cooldownContainer.classList.toggle("healthBarHidden", !inActiveGame);
	}
	if (pistolContainer) {
		pistolContainer.classList.toggle("healthBarHidden", !inActiveGame);
	}
}

setQualityMode._real = setQualityMode;
window.setQualityMode = setQualityMode;
window.cycleQualityMode = cycleQualityMode;
export { setQualityMode, cycleQualityMode };

// ========== MIRROR SYSTEM FUNCTIONS ==========
// COMMENTED OUT: THREE.Mirror not available at CDN paths in r186
// function createMirror(position, size, rotation) { ... }
// function updateMirrors() { ... }


function init() {
	// Create renderer with improved settings
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		powerPreference: "high-performance",
		alpha: false
	});
	
	renderer._microCache = MicroCache();
	renderer.domElement.id = "scene";
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0xb2e1f2);
	
	// Enable sRGB encoding for correct color display
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.0;
	renderer.physicallyCorrectLights = true;
	
	// Configure shadows based on quality mode
	applyQualitySettings();
	
	document.body.appendChild(renderer.domElement);
	
	clock = new THREE.Timer();
	scene = new THREE.Scene();
	
	// Add fog for depth perception
	scene.fog = new THREE.Fog(0xb2e1f2, 1, 500);
	scene.background = new THREE.Color(0xb2e1f2);
	
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	
	// Create proper 3D crosshair (fixed)
	create3DCrosshair();
	
	// Set initial camera position
	camera.position.x = 5;
	camera.position.y = 5 + 5.0;
	camera.position.z = 8;
	
	controlsModule.initControls(renderer, scene);

	controls = new PointerLockControls(camera, document.body);
	
	var playerHeight = 5.0;
	controls.object.playerHeight = playerHeight;
	
	playerBody = new objectsModule.JailBotBody(renderer);
	controls.object.add(playerBody);
	playerBody.position.set(0, 0.5, 1); 
	
	playerBoundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
	playerBoundingBox.setFromObject(controls.object);
	playerBody.frustumCulled = true;

	scene.add(controls.object);
	resetHealth();

	var hallwayStart = -38;
	for (var i = 0; i < 3; i++) {
		var hallwayOffset = hallwayStart + (48 * i);
		var fullHallway = new hallwayModule.FullHallway(renderer, collidableMeshList, scene, i === 1);
		fullHallway.position.set(hallwayOffset, 5, 21);
		fullHallway.traverse(function(child) {
			if (child instanceof THREE.Mesh) {
				child.frustumCulled = true;
			}
		});
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
	vector.sub(camera.position);

	raycasterCamera = new THREE.Raycaster(camera.position, vector, 0, 50);

	var cellRowCount = 2;
	var cellsPerRow = 6;
	var totalCellcount = cellRowCount * cellsPerRow;
	var startCell = Math.floor(Math.random() * totalCellcount);
	console.log("StartCell: " + startCell);

	var currentCell = 0;
	for (var j = 0; j < cellRowCount; j++) {
		var rotate = rotationPerColumn * j;
		for (var i = 0; i < cellsPerRow; i++) {
			var cellOffsetX = cellStartX + (12 * i);
			var cellOffsetZ = cellStartZ + (42 * j);
			var rootCell = new prisonCellModule.PrisonCell(renderer, collidableMeshList, scene);
			rootCell.position.set(cellOffsetX, 5, cellOffsetZ);
			rootCell.rotateY(rotate);
			rootCell.traverse(function(child) {
				if (child instanceof THREE.Mesh) {
					child.frustumCulled = true;
				}
			});
			scene.add(rootCell);

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
	addTowers(renderer);

	// ========== CREATE MIRRORS ==========
	// COMMENTED OUT: THREE.Mirror not available at CDN paths in r186
	// const mirror1 = createMirror(
	// 	new THREE.Vector3(-30, 8, -45),
	// 	new THREE.Vector2(8, 8),
	// 	new THREE.Euler(0, 0, 0)
	// );
	// if (mirror1) {
	// 	scene.add(mirror1);
	// 	collidableMeshList.push(mirror1);
	// }
	// 
	// Mirror 2: On another wall
	// const mirror2 = createMirror(
	// 	new THREE.Vector3(30, 8, 45),
	// 	new THREE.Vector2(8, 8),
	// 	new THREE.Euler(0, Math.PI, 0)
	// );
	// if (mirror2) {
	// 	scene.add(mirror2);
	// 	collidableMeshList.push(mirror2);
	// }

	// Clean up old pointer lock listeners before setting up new ones
	if (typeof pointerLockModule.cleanupPointerLock === 'function') {
		pointerLockModule.cleanupPointerLock();
	}
	
	pointerLockModule.initPointerLock(havePointerLock, controls);
	addRamps(renderer);
	addFoundation();
	addSandFloor(renderer);
	addBullets(renderer);

	sun();

	bulletControl.setPositionReference(camera);

	updateHudVisibility();
	animate();
	
	window.addEventListener('resize', () => {
		renderer.setSize(window.innerWidth, window.innerHeight);
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		
		// COMMENTED OUT: Mirror resize handler disabled
		// for (let i = 0; i < mirrorCameras.length; i++) {
		// 	const mirrorMesh = mirrorMeshes[i];
		// 	if (mirrorMesh && mirrorMesh.geometry) {
		// 		const width = mirrorMesh.geometry.parameters.width || 1;
		// 		const height = mirrorMesh.geometry.parameters.height || 1;
		// 		mirrorCameras[i].camera.aspect = width / height;
		// 		mirrorCameras[i].camera.updateProjectionMatrix();
		// 	}
		// }
	});
}
init._real = init;
window.init = init;
export { init };

function cloning(n) {
	for (let i = 1; i < n; i++) {
		var newCell = rootCell.clone();
		newCell.position.set(i*11.55, 0, 0);
		newCell.traverse(function(child) {
			if (child instanceof THREE.Mesh) {
				child.frustumCulled = true;
			}
		});
		scene.add(newCell);
	}
	
	for (let j = 1; j < n+1; j++) {
		var newCell = rootCell.clone();
		newCell.rotation.y = Math.PI;
		newCell.position.set(j*11.55, 0, 41.5);
		newCell.traverse(function(child) {
			if (child instanceof THREE.Mesh) {
				child.frustumCulled = true;
			}
		});
		scene.add(newCell);
	}
}

function addRamps(renderer) {
	var ramp1 = new objectsModule.Ramp(renderer);
	ramp1.position.set(-35, 2.5, 12);
	ramp1.traverse(function(child) {
		if (child instanceof THREE.Mesh) {
			child.castShadow = true;
			child.receiveShadow = true;
			child.frustumCulled = true;
		}
	});
	scene.add(ramp1);
	collidableMeshList.push(ramp1);

	var ramp2 = new objectsModule.Ramp(renderer);
	ramp2.rotateY(Math.PI);
	ramp2.position.set(35, 2.5, 30);
	ramp2.traverse(function(child) {
		if (child instanceof THREE.Mesh) {
			child.castShadow = true;
			child.receiveShadow = true;
			child.frustumCulled = true;
		}
	});
	scene.add(ramp2);
	collidableMeshList.push(ramp2);
}

function addFoundation() {
	var geometry = new THREE.BoxGeometry(75, 4, 50);
	var material = new THREE.MeshLambertMaterial({ color: 0x7a6b5a });
	var foundation = new THREE.Mesh(geometry, material);
	foundation.receiveShadow = true;
	foundation.frustumCulled = true;
	foundation.position.set(6, 2.5, 23);
	scene.add(foundation);
	collidableMeshList.push(foundation);
}

function addWall(renderer) {
	prisonWallRoot = new objectsModule.PrisonWall(renderer);
	prisonWallRoot.traverse(function(child) {
		if (child instanceof THREE.Mesh) {
			child.castShadow = true;
			child.receiveShadow = true;
			child.frustumCulled = true;
		}
	});
	
	prisonWallRoot.rotation.y += Math.PI/2;
	var y = 0;
	prisonWallRoot.rotation.y += Math.PI/2;
	
	for (let i = -3; i < 5; i++) {
		var prisonWall = prisonWallRoot.clone();
		prisonWall.position.set(i*16+7, y, -50);
		prisonWall.traverse(function(child) {
			if (child instanceof THREE.Mesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				child.frustumCulled = true;
			}
		});
		scene.add(prisonWall);
	}
	
	prisonWallRoot.rotation.y += Math.PI/2;
	for (let i = -3; i < 4; i++) {
		var prisonWall = prisonWallRoot.clone();
		prisonWall.position.set(-50, y, i*16+7);
		prisonWall.traverse(function(child) {
			if (child instanceof THREE.Mesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				child.frustumCulled = true;
			}
		});
		scene.add(prisonWall);
	}
	
	prisonWallRoot.rotation.y -= Math.PI/2;
	for (let i = -3; i < 5; i++) {
		var prisonWall = prisonWallRoot.clone();
		prisonWall.position.set(i*16+7, y, 60);
		prisonWall.traverse(function(child) {
			if (child instanceof THREE.Mesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				child.frustumCulled = true;
			}
		});
		scene.add(prisonWall);
	}
	
	prisonWallRoot.rotation.y -= Math.PI/2;
	for (let i = -3; i < 4; i++) {
		var prisonWall = prisonWallRoot.clone();
		prisonWall.position.set(80, y, i*16+7);
		prisonWall.traverse(function(child) {
			if (child instanceof THREE.Mesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				child.frustumCulled = true;
			}
		});
		scene.add(prisonWall);
	}
}

function addTowers(renderer) {
	var tower = new objectsModule.Tower(renderer);
	tower.traverse(function(child) {
		if (child instanceof THREE.Mesh) {
			child.castShadow = true;
			child.receiveShadow = true;
			child.frustumCulled = true;
		}
	});
	tower.position.set(-50, 0, -50);
	scene.add(tower);

	var tower2 = new objectsModule.Tower(renderer);
	tower2.traverse(function(child) {
		if (child instanceof THREE.Mesh) {
			child.castShadow = true;
			child.receiveShadow = true;
			child.frustumCulled = true;
		}
	});
	tower2.position.set(80, 0, -50);
	scene.add(tower2);

	var tower3 = new objectsModule.Tower(renderer);
	tower3.traverse(function(child) {
		if (child instanceof THREE.Mesh) {
			child.castShadow = true;
			child.receiveShadow = true;
			child.frustumCulled = true;
		}
	});
	tower3.position.set(80, 0, 60);
	scene.add(tower3);

	var tower4 = new objectsModule.Tower(renderer);
	tower4.traverse(function(child) {
		if (child instanceof THREE.Mesh) {
			child.castShadow = true;
			child.receiveShadow = true;
			child.frustumCulled = true;
		}
	});
	tower4.position.set(-50, 0, 60);
	scene.add(tower4);
}

function sun() {
	var dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
	dirLight.position.set(50, 80, 30);
	
	dirLight.castShadow = true;
	dirLight.shadow.mapSize.width = 1024;
	dirLight.shadow.mapSize.height = 1024;
	dirLight.shadow.camera.near = 0.5;
	dirLight.shadow.camera.far = 200;
	dirLight.shadow.camera.left = -120;
	dirLight.shadow.camera.right = 120;
	dirLight.shadow.camera.top = 120;
	dirLight.shadow.camera.bottom = -120;
	
	const ambient = new THREE.AmbientLight(0x404040, 0.3);
	const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.3);
	
	scene.add(dirLight);
	scene.add(ambient);
	scene.add(hemiLight);
	
	const fillLight = new THREE.DirectionalLight(0xfff5eb, 0.3);
	fillLight.position.set(-30, 40, -20);
	fillLight.castShadow = false;
	scene.add(fillLight);
}

function addSandFloor(renderer) {
	var sand = new objectsModule.Sand(renderer);
	sand.traverse(function(child) {
		if (child instanceof THREE.Mesh) {
			child.receiveShadow = true;
			child.frustumCulled = true;
		}
	});
	sand.position.set(100, 0, 100);
	scene.add(sand);
	collidableMeshList.push(sand);
}

function addBullets(renderer) {
	var bullet = new bulletControl.Bullet(renderer);
	bullet.traverse(function(child) {
		if (child instanceof THREE.Mesh) {
			child.frustumCulled = false;
		}
	});
	bullet.position.set(20, 20, 20);
	scene.add(bullet);	
}

const cameraDirection = new THREE.Vector3();

function animate() {
	requestAnimationFrame(animate); 
	if (toWakeUp === true) {

		raycaster.ray.origin.copy(controls.object.position);
		raycasterFront.ray.origin.copy(controls.object.position);
		controls.getDirection(raycasterFront.ray.direction);

		camera.getWorldDirection(cameraDirection);
		raycasterCamera.ray.origin.copy(camera.position);
		raycasterCamera.ray.direction.copy(cameraDirection);

		if (multiplayer) {
			multiplayer.sendData(controls.object.position, raycasterFront.ray.direction);
		}

		clock.update();
		var delta = clock.getDelta();
		controlsModule.updateControls(controlsEnabled, delta, controls, collidableMeshList, raycaster, raycasterFront, raycasterCamera);
		
		// Update cooldown bar
		if (typeof bulletControl.getCooldownProgress === 'function') {
			updateCooldownBar(bulletControl.getCooldownProgress());
		}
		
		// COMMENTED OUT: Mirror updates disabled
		// updateMirrors();
		
		renderer.render(scene, camera);
		
		transformModule.animateDoors();
		transformModule.animateDrop();
		
		const bullets = bulletControl.getBulletArray();
		for (let i = 0; i < bullets.length; i++) {
			if (bullets[i].parent === null) scene.add(bullets[i]);
		}
		bulletControl.updateCollidableMeshList(collidableMeshList);
		transformModule.animateBullets(bulletControl.getBulletArray(), delta, collidableMeshList);
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
	setTimeout(() => {
		document.getElementById("bustedOverlay").classList.remove("visible");
	}, 3000);
}
showBustedMessage._real = showBustedMessage;
window.showBustedMessage = showBustedMessage;
export { showBustedMessage };

function loadMultiplayer(player_name, selected_server){
	console.log("Loading multiplayer...");
	try { localStorage.setItem('orange.lastMode', 'MultiPlayer'); } catch(e) { console.log('Could not save lastMode:', e); }
	closeStart();
	inActiveGame = true;
	
	// Show loading screen and set up loading manager
	loadingScreen.showLoadingScreen();
	loadingScreen.setupLoadingManager();
	
	init();
	import('./Resources/functions/multiplayer.mjs').then(module => {
		multiplayer = new module.Multiplayer(renderer, collidableMeshList, scene, player_name, selected_server);
		multiplayer.init();
	});
}

function startSingleplayer() {
	gameMode = "SinglePlayer";
	console.log("Starting Singleplayer mode...");
	showDefeatedCounter(false);
	try { localStorage.setItem('orange.lastMode', 'SinglePlayer'); } catch(e) { console.log('Could not save lastMode:', e); }
	closeStart();
	inActiveGame = true;
	
	// Show loading screen and set up loading manager
	loadingScreen.showLoadingScreen();
	loadingScreen.setupLoadingManager();
	
	init();
}
startSingleplayer._real = startSingleplayer;
window.startSingleplayer = startSingleplayer;
export { startSingleplayer };

var multiplayerStarting = false;

function startMultiplayerWithName() {
	if (multiplayerStarting) return;
	var player_name = document.getElementById("player_name").value.trim();
	var selected_server_id = document.getElementById("serverSelector").value;
	if(player_name === "" || player_name === null){
		alert("Please type in a name for your player!");
		return;
	}else{
		multiplayerStarting = true;
		gameMode = "MultiPlayer";
		showDefeatedCounter(true);
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
startMultiplayerWithName._real = startMultiplayerWithName;
window.startMultiplayerWithName = startMultiplayerWithName;
export { startMultiplayerWithName };

function formatSeconds(totalSeconds) {
	const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
	return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

async function updateSessionTable(baseUrl) {
	const chooser = document.getElementById("sessionChooser");
	const container = document.getElementById("sessionTableContainer");
	const startButton = document.getElementById("start_multiplayer_button");
	if (!chooser || !container) return;

	const sessions = await orangeSessions.list(baseUrl);
	if (!orangeSessions.supported) {
		chooser.style.display = "none";
		if (startButton) startButton.style.display = "";
		return;
	}

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
	head.appendChild(headerRow);
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
	if (startButton) startButton.style.display = "none";
}

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

function chosenSession() {
	const chooser = document.getElementById("sessionChooser");
	if (!chooser || chooser.style.display === "none") return null;
	return orangeSessions.choice;
}

function chooseSession(sessionId) {
	const lobby = sessionId === "lobby" || sessionId === null || sessionId === undefined || sessionId === "";
	orangeSessions.choose(lobby ? null : String(sessionId));
	startMultiplayerWithName();
}
chooseSession._real = chooseSession;
window.chooseSession = chooseSession;
export { chooseSession };

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

	const names = Array.from(new Set(Object.keys(kills).concat(Object.keys(defeats))));
	names.sort((a, b) => ((kills[b] || 0) - (kills[a] || 0)) || ((defeats[a] || 0) - (defeats[b] || 0)));

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
	head.appendChild(headerRow);
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
	hideSessionResults();
	resetSessionStats();
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
	hallOfFame.recordRound(e.detail);
	roundPaused = true;
	if (controls && health > 0) {
		resetHealth();
		respawnPlayer();
	}
	setTimeout(updateDefeatedCounter, 0);
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

function startMultiplayer() {
	gameMode = "MultiPlayer";
	console.log("Starting Multiplayer mode...");
	showDefeatedCounter(true);
	document.getElementById("userDetails").style.display = "block";

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
		console.log("Working on server list: " + JSON.stringify(server_list));
		createServerListDropdown(server_list);
		setTimeout(() => updateSessionDropdownForSelectedServer(server_list), 0);
			
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
startMultiplayer._real = startMultiplayer;
window.startMultiplayer = startMultiplayer;
export { startMultiplayer };

async function showHallOfFame() {
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

// Initialize HUD visibility for menu screen
inActiveGame = false;
updateHudVisibility();

showHallOfFame();

// ========== GAME MENU SYSTEM ==========
let gameMenuOpen = false;
let optionsMenuOpen = false;
let gameMenuElement = null;
let optionsMenuElement = null;

/**
 * Creates the game menu overlay
 */
function createGameMenu() {
	if (gameMenuElement) return;
	
	gameMenuElement = document.createElement('div');
	gameMenuElement.id = 'gameMenu';
	gameMenuElement.style.cssText = `
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 300px;
		background: rgba(0, 0, 0, 0.9);
		border: 2px solid #4CAF50;
		border-radius: 10px;
		padding: 20px;
		z-index: 20000;
		font-family: Arial, sans-serif;
		color: white;
		text-align: center;
		display: none;
	`;
	
	const title = document.createElement('h2');
	title.textContent = 'Game Menu';
	title.style.marginTop = '0';
	title.style.color = '#4CAF50';
	gameMenuElement.appendChild(title);
	
	const menuList = document.createElement('div');
	menuList.style.margin = '20px 0';
	
	// Back to main menu button
	const backToMenuBtn = document.createElement('button');
	backToMenuBtn.textContent = 'Back to Main Menu';
	backToMenuBtn.style.cssText = `
		width: 100%;
		padding: 12px;
		margin: 8px 0;
		background: #4CAF50;
		color: white;
		border: none;
		border-radius: 5px;
		font-size: 16px;
		cursor: pointer;
	`;
	backToMenuBtn.addEventListener('click', () => {
		hideGameMenu();
		returnToMainMenu();
	});
	backToMenuBtn.addEventListener('mouseover', () => {
		backToMenuBtn.style.background = '#45a049';
	});
	backToMenuBtn.addEventListener('mouseout', () => {
		backToMenuBtn.style.background = '#4CAF50';
	});
	menuList.appendChild(backToMenuBtn);
	
	// Options button
	const optionsBtn = document.createElement('button');
	optionsBtn.textContent = 'Options';
	optionsBtn.style.cssText = `
		width: 100%;
		padding: 12px;
		margin: 8px 0;
		background: #2196F3;
		color: white;
		border: none;
		border-radius: 5px;
		font-size: 16px;
		cursor: pointer;
	`;
	optionsBtn.addEventListener('click', () => {
		hideGameMenu();
		showOptionsMenu();
	});
	optionsBtn.addEventListener('mouseover', () => {
		optionsBtn.style.background = '#0b7dda';
	});
	optionsBtn.addEventListener('mouseout', () => {
		optionsBtn.style.background = '#2196F3';
	});
	menuList.appendChild(optionsBtn);
	
	// Resume button
	const resumeBtn = document.createElement('button');
	resumeBtn.textContent = 'Resume Game';
	resumeBtn.style.cssText = `
		width: 100%;
		padding: 12px;
		margin: 8px 0;
		background: #607D8B;
		color: white;
		border: none;
		border-radius: 5px;
		font-size: 16px;
		cursor: pointer;
	`;
	resumeBtn.addEventListener('click', () => {
		hideGameMenu();
	});
	resumeBtn.addEventListener('mouseover', () => {
		resumeBtn.style.background = '#546E7A';
	});
	resumeBtn.addEventListener('mouseout', () => {
		resumeBtn.style.background = '#607D8B';
	});
	menuList.appendChild(resumeBtn);
	
	gameMenuElement.appendChild(menuList);
	document.body.appendChild(gameMenuElement);
}

/**
 * Creates the options menu overlay
 */
function createOptionsMenu() {
	if (optionsMenuElement) return;
	
	optionsMenuElement = document.createElement('div');
	optionsMenuElement.id = 'optionsMenu';
	optionsMenuElement.style.cssText = `
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 350px;
		background: rgba(0, 0, 0, 0.9);
		border: 2px solid #2196F3;
		border-radius: 10px;
		padding: 20px;
		z-index: 20000;
		font-family: Arial, sans-serif;
		color: white;
		text-align: center;
		display: none;
	`;
	
	const title = document.createElement('h2');
	title.textContent = 'Options';
	title.style.marginTop = '0';
	title.style.color = '#2196F3';
	optionsMenuElement.appendChild(title);
	
	// Quality settings section
	const qualitySection = document.createElement('div');
	qualitySection.style.margin = '20px 0';
	qualitySection.style.textAlign = 'left';
	
	const qualityLabel = document.createElement('label');
	qualityLabel.textContent = 'Quality Mode:';
	qualityLabel.style.cssText = `
		display: block;
		margin-bottom: 8px;
		font-weight: bold;
		color: #ccc;
	`;
	qualitySection.appendChild(qualityLabel);
	
	// Create radio buttons for quality modes
	const modes = ['performance', 'balanced', 'quality'];
	const modeLabels = ['Performance', 'Balanced', 'Quality'];
	
	modes.forEach((mode, index) => {
		const radioContainer = document.createElement('div');
		radioContainer.style.margin = '8px 0';
		radioContainer.style.display = 'flex';
		radioContainer.style.alignItems = 'center';
		
		const radio = document.createElement('input');
		radio.type = 'radio';
		radio.id = 'quality_' + mode;
		radio.name = 'qualityMode';
		radio.value = mode;
		radio.checked = (qualityMode === mode);
		radio.style.marginRight = '10px';
		
		const label = document.createElement('label');
		label.htmlFor = 'quality_' + mode;
		label.textContent = modeLabels[index];
		
		radioContainer.appendChild(radio);
		radioContainer.appendChild(label);
		qualitySection.appendChild(radioContainer);
	});
	
	optionsMenuElement.appendChild(qualitySection);
	
	// Buttons container
	const buttonsContainer = document.createElement('div');
	buttonsContainer.style.display = 'flex';
	buttonsContainer.style.justifyContent = 'space-between';
	buttonsContainer.style.marginTop = '20px';
	
	// Cancel button
	const cancelBtn = document.createElement('button');
	cancelBtn.textContent = 'Cancel';
	cancelBtn.style.cssText = `
		padding: 12px 24px;
		background: #607D8B;
		color: white;
		border: none;
		border-radius: 5px;
		font-size: 16px;
		cursor: pointer;
	`;
	cancelBtn.addEventListener('click', () => {
		hideOptionsMenu();
		showGameMenu();
	});
	cancelBtn.addEventListener('mouseover', () => {
		cancelBtn.style.background = '#546E7A';
	});
	cancelBtn.addEventListener('mouseout', () => {
		cancelBtn.style.background = '#607D8B';
	});
	buttonsContainer.appendChild(cancelBtn);
	
	// Apply button
	const applyBtn = document.createElement('button');
	applyBtn.textContent = 'Apply';
	applyBtn.style.cssText = `
		padding: 12px 24px;
		background: #4CAF50;
		color: white;
		border: none;
		border-radius: 5px;
		font-size: 16px;
		cursor: pointer;
	`;
	applyBtn.addEventListener('click', () => {
		const selectedMode = document.querySelector('input[name="qualityMode"]:checked');
		if (selectedMode) {
			localStorage.setItem('orange.qualityMode', selectedMode.value);
		}
		// Reload page to apply changes
		location.reload();
	});
	applyBtn.addEventListener('mouseover', () => {
		applyBtn.style.background = '#45a049';
	});
	applyBtn.addEventListener('mouseout', () => {
		applyBtn.style.background = '#4CAF50';
	});
	buttonsContainer.appendChild(applyBtn);
	
	optionsMenuElement.appendChild(buttonsContainer);
	document.body.appendChild(optionsMenuElement);
}

/**
 * Shows the game menu and pauses the game
 */
function showGameMenu() {
	if (!gameMenuElement) {
		createGameMenu();
	}
	
	gameMenuElement.style.display = 'block';
	gameMenuOpen = true;
	
	// Pause the game
	if (controls) {
		controls.enabled = false;
	}
	controlsModule.setInputBlocked(true);
	
	// Try to exit pointer lock
	if (document.pointerLockElement || 
		document.mozPointerLockElement || 
		document.webkitPointerLockElement) {
		document.exitPointerLock();
	}
}

/**
 * Hides the game menu and resumes the game
 */
function hideGameMenu() {
	if (gameMenuElement) {
		gameMenuElement.style.display = 'none';
	}
	gameMenuOpen = false;
	
	// Resume the game
	if (controls && !roundPaused && health > 0) {
		controls.enabled = true;
		controlsModule.setInputBlocked(false);
	}
}

/**
 * Shows the options menu
 */
function showOptionsMenu() {
	if (!optionsMenuElement) {
		createOptionsMenu();
	}
	
	// Update radio button selection based on current quality mode
	const currentMode = localStorage.getItem('orange.qualityMode') || qualityMode;
	const radios = document.querySelectorAll('input[name="qualityMode"]');
	radios.forEach(radio => {
		radio.checked = (radio.value === currentMode);
	});
	
	optionsMenuElement.style.display = 'block';
	optionsMenuOpen = true;
}

/**
 * Hides the options menu
 */
function hideOptionsMenu() {
	if (optionsMenuElement) {
		optionsMenuElement.style.display = 'none';
	}
	optionsMenuOpen = false;
}

/**
 * Returns to the main menu
 */
function returnToMainMenu() {
	// Reset game state
	toWakeUp = false;
	inActiveGame = false;
	gameMenuOpen = false;
	optionsMenuOpen = false;
	updateHudVisibility();
	
	// Clean up pointer lock
	if (typeof pointerLockModule.cleanupPointerLock === 'function') {
		pointerLockModule.cleanupPointerLock();
	}
	
	// Stop animation loop if running
	// Note: We can't really stop requestAnimationFrame, but we can prevent rendering
	// by setting toWakeUp to false
	
	// Hide any game UI
	hideGameMenu();
	hideOptionsMenu();
	
	// Show start screen
	const startScreen = document.getElementById('startScreen');
	if (startScreen) {
		startScreen.style.display = 'block';
	}
	
	// Clean up multiplayer if active
	if (multiplayer) {
		// Note: multiplayer cleanup would need to be implemented in multiplayer.mjs
	}
	
	// Reset camera position for menu
	if (camera) {
		camera.position.set(5, 10, 8);
		camera.lookAt(0, 0, 0);
	}
	
	// Remove scene from renderer if it exists
	if (renderer && renderer.domElement) {
		// Just hide it, don't remove from DOM
	}
	
	// Clear scene if it exists
	if (scene) {
		while (scene.children.length > 0) {
			scene.remove(scene.children[0]);
		}
	}
	
	// Reset player state
	resetHealth();
	
	console.log('Returned to main menu');
}

// Add event listener for Escape key
document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
		// Exit pointer lock if active
		if (document.pointerLockElement || 
			document.mozPointerLockElement || 
			document.webkitPointerLockElement) {
			document.exitPointerLock();
		}
		
		// If options menu is open, close it and show game menu
		if (optionsMenuOpen) {
			hideOptionsMenu();
			showGameMenu();
			event.preventDefault();
		} 
		// If game menu is open, close it
		else if (gameMenuOpen) {
			hideGameMenu();
			event.preventDefault();
		} 
		// If game is active and no menu is open, show game menu
		else if (inActiveGame && toWakeUp) {
			showGameMenu();
			event.preventDefault();
		}
		// If on start screen, do nothing (let default behavior handle it)
	}
});
