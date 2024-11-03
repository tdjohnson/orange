//loader = new THREE.JSONLoader();
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

export function meshloader(objURL, matURL, callback, renderer){

	/*if(meshes.has(url)){ //check if model has been loaded before
		callback(meshes.get(url));  //return preloaded model from Map
	}else{
		loader = new THREE.JSONLoader();
		loader.load(url,function ( geometry, materials ) {  //load model from json /()
		console.log("LOADING JSON MODEL: " + url);
		meshes.set(url, new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
		callback(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});					
	}*/
	/*if (renderer._microCache) {
		if(renderer._microCache.contains(url)){ //check if model has been loaded before
			callback(renderer._microCache.get(url));  //return preloaded model from Map
		}else{
			loader = new OBJLoader();
			loader.load(url,function (combinedObject) {  //load model from json /()
				//console.log("LOADING JSON MODEL: " + url);
				//meshes.set(url, new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
				renderer._microCache.set(url, combinedObject);
				callback(combinedObject);
			});
		}
	} else {

	}*/
	const matLoader = new MTLLoader();
	matLoader.load(matURL, (materials) => {
		materials.preload();

		const loader = new OBJLoader();
		loader.setMaterials(materials);
		loader.load(objURL, (object) => {
			callback(object)
		});
	});
}


export function Soap()
{
	THREE.Object3D.call( this );

	this.name = 'soap_' + this.id;
	//this.castShadow = true;
	this.scale.x = this.scale.y = this.scale.z = 0.1;
	this.userData.info = "Wirf mich runter mit Y!";
	this.userData.rotatable = true;
	this.userData.isDropable = true;
	
	var scope = this;
	meshloader( '../Prototypes/Seife/seife.json',function(model) {scope.add(model);});
}
Soap.prototype = Object.create(THREE.Object3D.prototype);
Soap.prototype.constructor = Soap;


export function Toilet()
{
	THREE.Object3D.call( this );
	//this.castShadow = true;
	//this.receiveShadow = true;
	this.name = "Klo";
	this.userData.info = "Sauber geputzt!";
	var scope = this;
	meshloader( '../Prototypes/Klo/klo.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);

}
Toilet.prototype =  Object.create(THREE.Object3D.prototype);
Toilet.prototype.constructor = Toilet;


export function Sink()
{
	THREE.Object3D.call( this );

	this.scale.x = this.scale.y = this.scale.x = 1.2;
	//this.castShadow = true;
	this.name = "Waschbecken";
	this.userData.info = " ";

	var scope = this;
	meshloader('../Prototypes/Becken/becken.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Sink.prototype  =  Object.create(THREE.Object3D.prototype);
Sink.prototype.constructor = Sink;


export function Book()
{
	THREE.Object3D.call( this );
	this.scale.x = this.scale.y = this.scale.z = 0.3;
	this.name = "Buch";
	this.userData.info = "Lies Faust!";
	this.userData.rotatable = true;
	var scope = this;
	meshloader('../Prototypes/Buch/buch_neu_comb.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Book.prototype = Object.create(THREE.Object3D.prototype);
Book.prototype.constructor = Book;


export function Table()
{
	THREE.Object3D.call( this );

    this.scale.x = this.scale.y = this.scale.z = 1.2;
    this.name = "tisch";
    //this.castShadow = true;
    this.recieveShadow = true;
	var scope = this;
	meshloader('../Prototypes/Tisch/table.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Table.prototype = Object.create(THREE.Object3D.prototype);
Table.prototype.constructor = Table;

export function Chair()
{
	THREE.Object3D.call( this );

    this.scale.x = this.scale.y = this.scale.z = 1.2;
    this.name = "chair";
	var scope = this;
	meshloader('../Prototypes/Stuhl/stuhl.json',function(model) {scope.add(model);});
}
Chair.prototype = Object.create(THREE.Object3D.prototype);
Chair.prototype.constructor = Chair;


export function Radiator()
{
	THREE.Object3D.call( this );
	this.scale.x = 1.2;
	this.scale.y = 0.7;
	this.scale.z = 0.5;
	this.name = "Luefter";
	this.userData.info = " ";
	var scope = this;
	meshloader('../Prototypes/Luefter/luefter.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Radiator.prototype = Object.create(THREE.Object3D.prototype);
Radiator.prototype.constructor = Radiator;

export function TableLamp()
{	
	THREE.Object3D.call( this );

	var light = new THREE.PointLight(0xffff99, 4, 10 );
	//light.shadowCameraVisible = true;
	light.shadowDarkness = 0.95;
	light.castShadow = true;
	light.position.set(0,9.8,-4.7);
	var pointLightHelper = new THREE.PointLightHelper(light, 0.8);
	scene.add(pointLightHelper);
	
	this.scale.x = this.scale.y = this.scale.z = 0.15;
    this.name = "Table Lamp";
    this.userData.info = "Licht aus  mit T";
   	this.userData.rotatable = true;
   	this.userData.isTurnedOn = true;
	this.add(light);

	var scope = this;
	meshloader('../Prototypes/TischLampe/tischlampe_neu.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
TableLamp.prototype = Object.create(THREE.Object3D.prototype);
//TableLamp.prototype.constructor = TableLamp; //lol


export function Mirror()
{	
	THREE.Object3D.call( this );


	//this.castShadow = true;
	this.scale.x = this.scale.y = this.scale.z = 1.1;
	
	var mmaterial = new THREE.WebGLRenderTarget( 500, 500, { format: THREE.RGBFormat } );
	mirror_materials.push(mmaterial);
	var mcam= new THREE.PerspectiveCamera(45, 1, 3.0,50);
	mcam.up = new THREE.Vector3(0,0,1);
	mcam.applyMatrix(new THREE.Matrix4().makeScale(1, 1, -1)); //flip view to create "mirrored" image
	mcam.position.z = -2.5; //set camera origin behind, (front plane set accordingly)
	mcam.name = "mirror" + this.id;
	this.add(mcam);

	mirror_cameras.push(mcam); // update cameras


	var planeMaterial = new THREE.MeshBasicMaterial( { map: mmaterial } );
	var plane = new THREE.Mesh( new THREE.PlaneBufferGeometry(2,2), planeMaterial );
	this.add(plane);

	
	var scope = this;
	meshloader('../Prototypes/Spiegel/SpiegelRahmen.json',function(model) {
			model.rotation.y = Math.PI*0.5; 
		scope.add(model);});
		this.rotation.y = Math.PI*0.5; 
		this.mvisible  = true;
	
}
Mirror.prototype = new THREE.Object3D();
Mirror.prototype.constructor = Mirror;
	


export function Wall() {
	THREE.Object3D.call( this );

	   this.scale.x = this.scale.z = 4;
	   this.scale.y = 2.85;

	var scope = this;
	meshloader('../Prototypes/Gang/wall.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Wall.prototype = Object.create(THREE.Object3D.prototype);
Wall.prototype.constructor = Wall;


export function Ceiling() {
	THREE.Object3D.call( this );

	this.scale.x = 3.82;
	this.scale.z = 4.1;
	this.scale.y = 3.15;

	var scope = this;
	meshloader('../Prototypes/Gang/ceiling.json',function(model) {scope.add(model);});
}
Ceiling.prototype = Object.create(THREE.Object3D.prototype);
Ceiling.prototype.constructor = Ceiling;


export function WallDoor() 
{
	THREE.Object3D.call( this );

		//this.castShadow = true;
		//this.receiveShadow = true;
	    this.scale.x = this.scale.z = 4;
	    this.scale.y = 2.9;
	    
	var scope = this;
	meshloader('../Prototypes/Gang/wallDoor.json',function(model) {scope.add(model);});

}
WallDoor.prototype = Object.create(THREE.Object3D.prototype);
WallDoor.prototype.constructor = WallDoor;


export function WallCell2() 
{
	THREE.Object3D.call( this );

	//this.castShadow = true;
	//this.receiveShadow = true;
	this.scale.x = this.scale.y = 3.3;
	this.scale.z = 2;
	var scope = this;
	meshloader('../Prototypes/Zelle/wand.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
WallCell2.prototype = Object.create(THREE.Object3D.prototype);
WallCell2.prototype.constructor = WallCell2;

export function WallCellWindow() 
{
	THREE.Object3D.call( this );
	
	//this.castShadow = true;
	//this.receiveShadow = true;
	this.scale.x = this.scale.y = 3.3;
	this.scale.z = 3.3;
   
	var scope = this;
	meshloader('../Prototypes/Zelle/wandFenster.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
WallCellWindow.prototype = Object.create(THREE.Object3D.prototype);
WallCellWindow.prototype.constructor = WallCellWindow;


export function WallCellDoor() 
{
	THREE.Object3D.call( this );

   	//this.castShadow = true;
	//this.receiveShadow = true;
	var scope = this;
	meshloader('../Prototypes/Zelle/wandFront.json',function(model) {scope.add(model);});
	
}
WallCellDoor.prototype = Object.create(THREE.Object3D.prototype);
WallCellDoor.prototype.constructor = WallCellDoor;


export function CeilingCell() 
{
	THREE.Object3D.call( this );
	this.scale.x = 3.3;
	this.scale.z = 3.35;
    //object.scale.y = 3.15;
    this.rotation.y = Math.PI/2;
	var scope = this;
	meshloader('../Prototypes/Zelle/dach.json',function(model) {scope.add(model);});
}
CeilingCell.prototype = Object.create(THREE.Object3D.prototype);
CeilingCell.prototype.constructor = CeilingCell;


export function CeilingLamp() {
	
	THREE.Object3D.call( this );
	//this.castShadow = true;
	//this.receiveShadow = true;
	this.name = "CeilingLamp";
	var scope = this;
	meshloader( '../Prototypes/DeckenLampe/lampe.json',function(model) {scope.add(model);});
	
	this.scale.x = this.scale.z = this.scale.y = 0.5;
	//this.rotation.x = Math.PI;
	


}

CeilingLamp.prototype = Object.create(THREE.Object3D.prototype);
CeilingLamp.prototype.constructor = CeilingLamp;

function generateLamps(){
	var light = new THREE.PointLight(0xffff99, 1, 12);
	light.castShadow = true;
	light.position.set(9.4, 7.8, 21);
	scene.add(light);
	
	var light2 = light.clone();
	light2.position.set(10, 7.8, 21);
	scene.add(light2);
	
	var light3 = light.clone();
	light3.position.set(10.6, 7.8, 21);
	scene.add(light3);
	
	var light4 = light.clone();
	light4.position.set(24.4, 7.8, 21);
	scene.add(light4);
	
	var light5 = light.clone();
	light5.position.set(25, 7.8, 21);
	scene.add(light5);
	
	var light6 = light.clone();
	light6.position.set(25.6, 7.8, 21);
	scene.add(light6);
	
	var light7 = light.clone();
	light7.position.set(34.4, 7.8, 21);
	scene.add(light7);
	
	var light8 = light.clone();
	light8.position.set(35, 7.8, 21);
	scene.add(light8);
	
	var light9 = light.clone();
	light9.position.set(35.6, 7.8, 21);
	scene.add(light9);	
	
	
}

export class Hallway extends THREE.Object3D {
	constructor(renderer) {
        super();
		//this.castShadow = true;
		this.receiveShadow = true;
	   this.scale.x = 3.85;
	   this.scale.z = 4;
		var scope = this;
		meshloader('../Prototypes/Gang/gang_comb.obj', '../Prototypes/Gang/gang_comb.mtl',function(model) {
			scope.add(model);
		}, renderer);
	}
}

export class Tower extends THREE.Object3D {
	constructor(renderer) {
        super();
		this.scale.x = this.scale.z = this.scale.y =3.35;
		var scope = this;
		meshloader('../Prototypes/Turm/turm.obj', '../Prototypes/Turm/turm.mtl',function(model) {
			scope.add(model);
		}, renderer);
	}
}


export class Sand extends THREE.Object3D {
	constructor(renderer) {
        super();
		this.receiveShadow = true;
		this.scale.x = this.scale.z = 2;
		//this.scale.y = 5;
		var scope = this;
		meshloader('../Prototypes/Sand/sand.obj', '../Prototypes/Sand/sand.mtl',function(model) {
			scope.add(model);
		}, renderer);
	}
}

export class PrisonWall extends THREE.Object3D {
	constructor(renderer) {
        super();
		this.castShadow = true;
		this.receiveShadow = true;
		this.name = "Prisonwall";
		this.userData.info = "you shall not pass!";
		this.scale.x = this.scale.y = 4;
		var scope = this;
		meshloader( '../Prototypes/Schutzmauer/wall.obj', '../Prototypes/Schutzmauer/wall.mtl',function(model) {
			scope.add(model);
		}, renderer);
	}
}


export class JailBotBody extends THREE.Object3D {
    constructor(renderer) {
        super();
        this.scale.x = this.scale.y = this.scale.z = 1.2;
		this.castShadow = true;
		this.receiveShadow = true;
        this.name = "JailBotBody";
        this.userData.info = "Ab in deine Zelle!";
        // this.userData.rotatable = true;

        const scope = this;
        meshloader('../Prototypes/Bot/Robo_combined.obj','../Prototypes/Bot/Robo_combined.mtl', function(model) {
            scope.add(model);
        }, renderer);
    }
}

export function JailBotArms()
{
	THREE.Object3D.call( this );

		this.scale.x = this.scale.y = this.scale.z = 1.2;
		//this.castShadow = true;
		this.name = "JailBotArms";
		this.userData.info = " ";
		this.userData.rotatable = true;
	var scope = this;
	meshloader('../Prototypes/Bot/bot_arms.json',function(model) {scope.add(model);});
}
JailBotArms.prototype = Object.create(THREE.Object3D.prototype);
JailBotArms.prototype.constructor = JailBotArms;




