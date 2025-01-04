import * as THREE from 'three';
import {meshloader} from './objects.mjs';

const performanceBoost = true;

export class PrisonCell extends THREE.Mesh {
	constructor(renderer, collidableMeshList, scene) {
        super();

		this.name = 'PrisonCell_' + this.id;

		if (!performanceBoost) {
			this.castShadow = true;
			this.receiveShadow = true;
		}
		
		var cellComplete = new CellComplete(renderer);
		cellComplete.position.set(0,0,0);
		cellComplete.rotation.y = Math.PI*-0.5;
		this.add(cellComplete);
		collidableMeshList.push(cellComplete);

		/*var wallCell1 = new WallCell1(renderer);
		wallCell1.position.set(0,0,0);
		wallCell1.rotation.y = Math.PI*-0.5;
		this.add(wallCell1);
		collidableMeshList.push(wallCell1);
		
		var floorCell = new FloorCell(renderer);
		floorCell.position.set(0,0,0);
		floorCell.rotation.y = Math.PI/-2;
		this.add(floorCell);
		collidableMeshList.push(floorCell);
		
		var wallCell2 = new WallCell2();
		wallCell2.position.set(4.8,0,0);
		wallCell2.rotation.y = Math.PI*-0.5;
		this.add(wallCell2);
		
		var wallCellWindow = new WallCellWindow();
		wallCellWindow.position.set(0.4,0,0);
		wallCellWindow.rotation.y = Math.PI*-0.5;
		this.add(wallCellWindow);
		
		var wallCellDoor = new WallCellDoor();
		wallCellDoor.position.set(-0.7,0,6.1);
		wallCellDoor.scale.z = 3.85;
		wallCellDoor.scale.y = 3.4;
		wallCellDoor.scale.x = 2;
		wallCellDoor.rotation.y = Math.PI*-0.5;;
		this.add(wallCellDoor);
		
		
		var wallCellDoorCol1 = new WallCellDoorCol1();
		wallCellDoorCol1.position.set(-0.4,0,6.2);
		wallCellDoorCol1.scale.z = 3.7;
		wallCellDoorCol1.scale.y = 3.4;
		wallCellDoorCol1.scale.x = 2;
		wallCellDoorCol1.rotation.y = Math.PI*-0.5;
		wallCellDoorCol1.visible = false;
		this.add(wallCellDoorCol1);
		collidableMeshList.push(wallCellDoorCol1);
		
		var wallCellDoorCol2 = new WallCellDoorCol2();
		wallCellDoorCol2.position.set(-0.4,0,6.2);
		wallCellDoorCol2.scale.z = 3.7;
		wallCellDoorCol2.scale.y = 3.4;
		wallCellDoorCol2.scale.x = 2;
		wallCellDoorCol2.rotation.y = Math.PI*-0.5;;
		wallCellDoorCol2.visible = false;
		this.add(wallCellDoorCol2);
		collidableMeshList.push(wallCellDoorCol1);
		*/
		var door1 = new WallCellDoorCol1(renderer);
		door1.position.set(4,4.5,14);
		this.add(door1);
		collidableMeshList.push(door1);

		
		var door2 = new WallCellDoorCol2(renderer);
		door2.position.set(8,4.5,13.5);
		door2.userData.startPosition = door2.position.x;
		this.add(door2);
		collidableMeshList.push(door2);

		var sink = new Sink(renderer);
		sink.position.set(1.2,4.5,12);
		sink.rotation.y = Math.PI*0.5;
		this.add(sink);
		collidableMeshList.push(sink);

		
		var soap = new Soap(renderer);
		soap.position.set(0.85,4.5,11);
		this.add(soap);
		collidableMeshList.push(soap);

		var toilet = new Toilet(renderer);
		toilet.position.set(2.5,0,5);
		toilet.rotation.y =  Math.PI*0.5;
		this.add(toilet);
		collidableMeshList.push(toilet);

		const toiletBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
		toiletBB.setFromObject(toilet);
		
		
		
		var radiator = new Radiator(renderer);
		radiator.position.set(0.8,6,10);
		radiator.rotation.y =  Math.PI/180*90;
		this.add(radiator);


		//Table Stuff
		var table = new Table(renderer);
		table.position.set(10,0,12.8);
		table.rotation.y =  Math.PI/180*90;
		this.add(table);
		collidableMeshList.push(table);


		var book = new Book(renderer);
		book.position.set(10,2.2,10.5);
		book.rotation.y =  Math.PI/180*90;
		this.add(book);

		var tablelamp = new TableLamp(renderer, scene);
		tablelamp.position.set(10, 2.2, 8.5);
		tablelamp.rotation.y =  Math.PI;
		this.add(tablelamp);
		
		var chair = new Chair(renderer);
		chair.position.set(9,-0.3, 9.8);
		chair.rotation.y =  Math.PI/180*-90;
		this.add(chair);
		collidableMeshList.push(chair);

		
		var bed = new Bett(renderer);
		bed.position.set(9,0,4.3);
		bed.rotation.y =  Math.PI;
		this.add(bed);
		collidableMeshList.push(bed);
		

		/*
		var mirror = new Mirror();
		mirror.position.set(0.5,4,12.8);
		mirror.rotation.y =  Math.PI/180*90;

		this.add(mirror);
		*/
	}

}

class Chair extends THREE.Mesh {
	constructor(renderer) {
		super();

		this.scale.x = this.scale.y = this.scale.z = 1.2;
		this.name = "chair";
		var scope = this;
		meshloader('./Prototypes/Stuhl/stuhl_neu.glb',function(model) {
			scope.add(model);
		}, renderer);
	}
}

class Soap extends THREE.Mesh {
	constructor(renderer) {
		super();

		this.scale.x = this.scale.y = this.scale.z = 0.15;
		this.userData.info = "Wirf mich runter mit Y!";
		this.userData.rotatable = true;
		this.userData.isDropable = true;
		this.userData.name = "soap"
		this.userData.isTriggerable = true;
		var scope = this;
		meshloader('./Prototypes/Seife/seife.glb',function(model) {
			scope.add(model);
		}, renderer);
	}
}


class TableLamp extends THREE.Mesh {
	constructor(renderer, scene) {
		super();
		var light = new THREE.PointLight(0xffff99, 4, 10 );

		//Shadow stuff
		if (!performanceBoost) {
			light.shadow.radius = 200;
			light.shadow.mapSize.width = 2048;
			light.shadow.mapSize.height = 2048;

			light.position.set(0,9.8,-4.7);
			var pointLightHelper = new THREE.PointLightHelper(light, 0.8);
			scene.add(pointLightHelper);
		}
		
		
		this.scale.x = this.scale.y = this.scale.z = 0.15;
		this.name = "Table Lamp";
		this.userData.info = "Licht aus  mit T";
		this.userData.rotatable = true;
		this.userData.isTurnedOn = true;
		this.userData.isTriggerable = true;
		this.add(light);

		var scope = this;
		meshloader('./Prototypes/TischLampe/TischLampe_neu.glb',function(model) {
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

		var scope = this;
		meshloader('./Prototypes/Buch/buch_neu_comb.glb',function(model) {
			scope.add(model);
		}, renderer);
	}
}

class Table extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.scale.x = this.scale.y = this.scale.z = 1.2;
		this.name = "tisch";
		var scope = this;
		meshloader('./Prototypes/Tisch/table.glb',function(model) {
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
		var scope = this;
		meshloader('./Prototypes/Luefter/luefter.glb',function(model) {
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
		var scope = this;
		meshloader('./Prototypes/Klo/klo.glb',function(model) {
			scope.add(model);
		}, renderer);
	}
}


class Sink extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.scale.x = this.scale.y = this.scale.x = 1.5;
		this.name = "Waschbecken";
		this.userData.info = " ";

		var scope = this;
		meshloader('./Prototypes/Becken/becken.glb',function(model) {
			scope.add(model);
		}, renderer);
	}
}

const doorscaler = 1.2;
class WallCellDoorCol1 extends THREE.Mesh {
	constructor(renderer) {
		super();
		this.scale.multiplyScalar(doorscaler);
		var scope = this;
		meshloader('./Prototypes/Tuer/WallCellDoorCol1.glb',function(model) {
			scope.add(model);
		}, renderer);
	}
}



class WallCellDoorCol2 extends THREE.Mesh {
		constructor(renderer) {
		super();

		this.scale.multiplyScalar(doorscaler);

		this.userData.isOpenable = true;
		this.userData.isOpen = false;
		this.userData.name = "Door2";
		this.userData.isTriggerable = true;
		var scope = this;
		meshloader('./Prototypes/Tuer/WallCellDoorCol2.glb',function(model) {
			scope.add(model);
		}, renderer);
	}
}


class CellComplete extends THREE.Mesh {
	constructor(renderer) {
        super();
		this.scale.multiplyScalar(3.5);
		var scope = this;
		meshloader('./Prototypes/Zelle/Zelle_neu_comb4.glb',function(model) {
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
		var scope = this;
		meshloader('./Prototypes/Bett/bett.glb',function(model) {
			scope.add(model);
		}, renderer);
		//collidableMeshList.push(this);
	}
}