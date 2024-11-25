//loader = new THREE.JSONLoader();
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


export function meshloader(objURL, callback){
	const gtlfLoader = new GLTFLoader();
	gtlfLoader.load(objURL, (gltfObject) => {
		const model = gltfObject.scene;
		model.traverse((child) => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
			};
		});
		callback(model);
	});
}


export function Chair()
{
	THREE.Object3D.call( this );

    this.scale.x = this.scale.y = this.scale.z = 1.2;
    this.name = "chair";
	var scope = this;
	meshloader('./Prototypes/Stuhl/stuhl.json',function(model) {scope.add(model);});
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
	meshloader('./Prototypes/Luefter/luefter.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Radiator.prototype = Object.create(THREE.Object3D.prototype);
Radiator.prototype.constructor = Radiator;


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
	meshloader('./Prototypes/Spiegel/SpiegelRahmen.json',function(model) {
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
	meshloader('./Prototypes/Gang/wall.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Wall.prototype = Object.create(THREE.Object3D.prototype);
Wall.prototype.constructor = Wall;


export function WallDoor() 
{
	THREE.Object3D.call( this );

		//this.castShadow = true;
		//this.receiveShadow = true;
	    this.scale.x = this.scale.z = 4;
	    this.scale.y = 2.9;
	    
	var scope = this;
	meshloader('./Prototypes/Gang/wallDoor.json',function(model) {scope.add(model);});

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
	meshloader('./Prototypes/Zelle/wand.json',function(model) {scope.add(model);});
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
	meshloader('./Prototypes/Zelle/wandFenster.json',function(model) {scope.add(model);});
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
	meshloader('./Prototypes/Zelle/wandFront.json',function(model) {scope.add(model);});
	
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
	meshloader('./Prototypes/Zelle/dach.json',function(model) {scope.add(model);});
}
CeilingCell.prototype = Object.create(THREE.Object3D.prototype);
CeilingCell.prototype.constructor = CeilingCell;




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
export class Tower extends THREE.Mesh {
	constructor(renderer) {
        super();
		this.scale.x = this.scale.z = this.scale.y =3.35;
		var scope = this;
		meshloader('./Prototypes/Turm/turm.glb',function(model) {
			scope.add(model);
		}, renderer);
	}
}


export class Sand extends THREE.Mesh {
	constructor(renderer) {
        super();
		this.receiveShadow = true;
		this.scale.x = this.scale.z = 2;
		//this.scale.y = 5;
		var scope = this;
		meshloader('./Prototypes/Sand/sand.glb',function(model) {
			scope.add(model);
		}, renderer);
	}
}

export class PrisonWall extends THREE.Mesh {
	constructor(renderer) {
        super();
		this.castShadow = true;
		this.receiveShadow = true;
		this.name = "Prisonwall";
		this.userData.info = "you shall not pass!";
		this.scale.x = this.scale.y = 4.6;
		var scope = this;
		meshloader('./Prototypes/Schutzmauer/wall.glb',function(model) {
			scope.add(model);
		}, renderer);
	}
}


export class JailBotBody extends THREE.Mesh {
    constructor(renderer) {
        super();
        this.scale.x = this.scale.y = this.scale.z = 1.2;
		this.castShadow = true;
		this.receiveShadow = true;
        this.name = "JailBotBody";
        this.userData.info = "Ab in deine Zelle!";
        // this.userData.rotatable = true;

        const scope = this;
        meshloader('./Prototypes/Bot/Robo_combined.glb', function(model) {
            scope.add(model);
			//scope.material = model.material;
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
	meshloader('./Prototypes/Bot/bot_arms.json',function(model) {scope.add(model);});
}
JailBotArms.prototype = Object.create(THREE.Object3D.prototype);
JailBotArms.prototype.constructor = JailBotArms;




