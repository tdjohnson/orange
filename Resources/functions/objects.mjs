// loader = new THREE.JSONLoader();
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as bulletControl from './bulletControl.mjs';

let performanceBoost = true;

export function setPerformanceOptimization(newValue) {
	performanceBoost = newValue;
}

export function meshloader(objURL, callback) {
	const gltfLoader = new GLTFLoader();
	gltfLoader.load(objURL, (gltfObject) => {
		const model = gltfObject.scene;
		model.traverse((child) => {
			if (child.isMesh) {
				if (!performanceBoost) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			}
		});
		callback(model);
	});
}

// Reusable geometry and materials cache to reduce memory usage
const geometryCache = new Map();
const materialCache = new Map();

export function getCachedGeometry(key) {
	if (geometryCache.has(key)) {
		return geometryCache.get(key).clone();
	}
	return null;
}

export function cacheGeometry(key, geometry) {
	geometryCache.set(key, geometry);
}

export class Tower extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.scale.x = this.scale.z = this.scale.y = 3.35;
		const scope = this;
		meshloader('./Prototypes/Turm/turm.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

export class Sand extends THREE.Mesh {
	constructor(renderer) {
		super();
		if (!performanceBoost) {
			this.receiveShadow = true;
		}
		this.scale.x = this.scale.z = 2;
		const scope = this;
		meshloader('./Prototypes/Sand/sand.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

export class Ramp extends THREE.Mesh {
	constructor(renderer) {
		super();
		if (!performanceBoost) {
			this.receiveShadow = true;
		}
		const rampScaler = 3;
		this.scale.multiplyScalar(rampScaler);
		const scope = this;
		meshloader('./Prototypes/Sand/ramp.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

export class PrisonWall extends THREE.Mesh {
	constructor(renderer) {
		super();
		if (!performanceBoost) {
			this.castShadow = true;
			this.receiveShadow = true;
		}
		this.name = "Prisonwall";
		this.userData.info = "you shall not pass!";
		this.scale.x = this.scale.y = 4.6;
		const scope = this;
		meshloader('./Prototypes/Schutzmauer/wall.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

export class JailBotBody extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.scale.x = this.scale.y = this.scale.z = 1.2;
		if (!performanceBoost) {
			this.castShadow = true;
			this.receiveShadow = true;
		}
		this.name = "JailBotBody";
		this.userData.info = "Ab in deine Zelle!";

		const scope = this;
		meshloader('./Prototypes/Bot/Robo_combined.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

export function JailBotArms() {
	THREE.Object3D.call(this);
	this.scale.x = this.scale.y = this.scale.z = 1.2;
	if (!performanceBoost) {
		this.castShadow = true;
		this.receiveShadow = true;
	}
	this.name = "JailBotArms";
	this.userData.info = " ";
	this.userData.rotatable = true;
	const scope = this;
	meshloader('./Prototypes/Bot/bot_arms.json', function(model) { scope.add(model); });
}
JailBotArms.prototype = Object.create(THREE.Object3D.prototype);
JailBotArms.prototype.constructor = JailBotArms;
