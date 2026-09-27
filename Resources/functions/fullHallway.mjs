import * as THREE from 'three';
import { meshloader } from './objects.mjs';

let performanceBoost = true;

export function setPerformanceOptimization(newValue) {
	performanceBoost = newValue;
}

export class FullHallway extends THREE.Mesh {
	constructor(renderer, collidableMeshList, scene) {
		super();

		const hallway = new Hallway(renderer);
		hallway.position.set(0, 0, 0);
		this.add(hallway);
		collidableMeshList.push(hallway);

		const ceilingLamp = new CeilingLamp(renderer);
		ceilingLamp.position.set(0, 9.5, 0);
		ceilingLamp.rotation.x = Math.PI;
		this.add(ceilingLamp);

		if (!performanceBoost) {
			const light = new THREE.PointLight(0xffff99, 100);
			light.position.set(0, 8, 0);
			light.castShadow = true;
			light.shadow.mapSize.width = 512;
			light.shadow.mapSize.height = 512;
			light.shadow.camera.near = 0.5;
			light.shadow.camera.far = 50;
			this.add(light);
		}
	}
}

export class CeilingLamp extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.scale.x = this.scale.z = this.scale.y = 0.5;
		this.name = "CeilingLamp";

		const scope = this;
		meshloader('./Prototypes/DeckenLampe/lampe_comb.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

export class Hallway extends THREE.Mesh {
	constructor(renderer) {
		super();
		if (!performanceBoost) {
			this.castShadow = true;
			this.receiveShadow = true;
		}
		this.scale.x = this.scale.y = this.scale.z = 4;

		const scope = this;
		meshloader('./Prototypes/Gang/gang_comb.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}
