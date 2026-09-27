import * as THREE from 'three';
import { meshloader } from './objects.mjs';

let performanceBoost = true;

export function setPerformanceOptimization(newValue) {
	performanceBoost = newValue;
}

// Constants for cell construction
const DOOR_SCALE = 1.2;

export class PrisonCell extends THREE.Mesh {
	constructor(renderer, collidableMeshList, scene) {
		super();

		this.name = 'PrisonCell_' + this.id;

		if (!performanceBoost) {
			this.castShadow = true;
			this.receiveShadow = true;
		}

		const cellComplete = new CellComplete(renderer);
		cellComplete.name = this.name;
		cellComplete.position.set(0, 0, 0);
		cellComplete.rotation.y = Math.PI * -0.5;
		this.add(cellComplete);
		collidableMeshList.push(cellComplete);

		const door1 = new WallCellDoorCol1(renderer);
		door1.position.set(4, 4.5, 14);
		this.add(door1);
		collidableMeshList.push(door1);

		const door2 = new WallCellDoorCol2(renderer);
		door2.position.set(8, 4.5, 13.5);
		door2.userData.startPosition = door2.position.x;
		this.add(door2);
		collidableMeshList.push(door2);

		const sink = new Sink(renderer);
		sink.position.set(1.2, 4.5, 12);
		sink.rotation.y = Math.PI * 0.5;
		this.add(sink);
		collidableMeshList.push(sink);

		const soap = new Soap(renderer);
		soap.position.set(0.85, 4.5, 11);
		this.add(soap);
		collidableMeshList.push(soap);

		const toilet = new Toilet(renderer);
		toilet.position.set(2.5, -0.1, 5);
		toilet.rotation.y = Math.PI * 0.5;
		this.add(toilet);
		collidableMeshList.push(toilet);

		const radiator = new Radiator(renderer);
		radiator.position.set(0.8, 6, 10);
		radiator.rotation.y = Math.PI / 180 * 90;
		this.add(radiator);

		// Table Stuff
		const table = new Table(renderer);
		table.position.set(10, 0, 12.8);
		table.rotation.y = Math.PI / 180 * 90;
		this.add(table);
		collidableMeshList.push(table);

		const book = new Book(renderer);
		book.position.set(10, 2.2, 10.5);
		book.rotation.y = Math.PI / 180 * 90;
		this.add(book);

		const tablelamp = new TableLamp(renderer, scene);
		tablelamp.position.set(10, 2.2, 8.5);
		tablelamp.rotation.y = Math.PI;
		this.add(tablelamp);

		const chair = new Chair(renderer);
		chair.position.set(9, -0.3, 9.8);
		chair.rotation.y = Math.PI / 180 * -90;
		this.add(chair);
		collidableMeshList.push(chair);

		const bed = new Bett(renderer);
		bed.position.set(9, 0, 4.3);
		bed.rotation.y = Math.PI;
		this.add(bed);
		collidableMeshList.push(bed);
	}
}

class Chair extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.scale.x = this.scale.y = this.scale.z = 1.2;
		this.name = "chair";
		const scope = this;
		meshloader('./Prototypes/Stuhl/stuhl_neu.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

// Cells are built in the same order on every client, so a running number identifies the
// same soap for everybody. It is used to tell the other players which soap was dropped.
let soapCounter = 0;

class Soap extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.userData.syncId = "soap-" + (soapCounter++);
		this.scale.x = this.scale.y = this.scale.z = 0.15;
		this.userData.info = "Wirf mich runter mit Y!";
		this.userData.rotatable = true;
		this.userData.isDropable = true;
		this.userData.name = "soap";
		this.userData.isTriggerable = true;
		const scope = this;
		meshloader('./Prototypes/Seife/seife.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

class TableLamp extends THREE.Mesh {
	constructor(renderer, scene) {
		super();

		// Shadow stuff
		if (!performanceBoost) {
			const light = new THREE.PointLight(0xffff99, 4, 10);
			light.shadow.radius = 200;
			light.shadow.mapSize.width = 512;
			light.shadow.mapSize.height = 512;
			light.position.set(0, 9.8, -4.7);
			light.castShadow = true;
			light.shadow.camera.near = 0.5;
			light.shadow.camera.far = 20;
			const pointLightHelper = new THREE.PointLightHelper(light, 0.8);
			scene.add(pointLightHelper);
			this.add(light);
		}

		this.scale.x = this.scale.y = this.scale.z = 0.15;
		this.name = "Table Lamp";
		this.userData.info = "Licht aus  mit T";
		this.userData.rotatable = true;
		this.userData.isTurnedOn = true;
		this.userData.isTriggerable = true;

		const scope = this;
		meshloader('./Prototypes/TischLampe/TischLampe_neu.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

class Book extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.scale.x = this.scale.y = this.scale.z = 0.5;
		this.name = "Buch";
		this.userData.info = "Lies Faust!";
		this.userData.rotatable = true;

		const scope = this;
		meshloader('./Prototypes/Buch/buch_neu_comb.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

class Table extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.scale.x = this.scale.y = this.scale.z = 1.2;
		this.name = "tisch";
		const scope = this;
		meshloader('./Prototypes/Tisch/table.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

class Radiator extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.scale.x = 1.2;
		this.scale.y = 0.7;
		this.scale.z = 0.5;
		this.name = "Luefter";
		this.userData.info = " ";
		const scope = this;
		meshloader('./Prototypes/Luefter/luefter.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

class Toilet extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.name = "Klo";
		this.userData.info = "Sauber geputzt!";
		this.userData.isTriggerable = true;
		const scope = this;
		meshloader('./Prototypes/Klo/klo.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

class Sink extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.scale.x = this.scale.y = this.scale.z = 1.5;
		this.name = "Waschbecken";
		this.userData.info = " ";

		const scope = this;
		meshloader('./Prototypes/Becken/becken.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

class WallCellDoorCol1 extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.scale.multiplyScalar(DOOR_SCALE);
		const scope = this;
		meshloader('./Prototypes/Tuer/WallCellDoorCol1.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

class WallCellDoorCol2 extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.scale.multiplyScalar(DOOR_SCALE);
		this.userData.isOpenable = true;
		this.userData.isOpen = false;
		this.userData.name = "Door2";
		this.userData.isTriggerable = true;
		const scope = this;
		meshloader('./Prototypes/Tuer/WallCellDoorCol2.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

class CellComplete extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.scale.multiplyScalar(3.5);
		const scope = this;
		meshloader('./Prototypes/Zelle/Zelle_neu_comb4.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}

class Bett extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.scale.y = 1.5;
		this.updateMatrix();
		this.name = "Bett";
		if (!performanceBoost) {
			this.castShadow = true;
			this.receiveShadow = true;
		}
		const scope = this;
		meshloader('./Prototypes/Bett/bett.glb', function(model) {
			scope.add(model);
		}, renderer);
	}
}
