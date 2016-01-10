//loader = new THREE.JSONLoader();

function meshloader(url,callback){

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
			if(renderer._microCache.contains(url)){ //check if model has been loaded before
				callback(renderer._microCache.get(url));  //return preloaded model from Map
			}else{
				loader = new THREE.JSONLoader();
				loader.load(url,function ( geometry, materials ) {  //load model from json /()
					console.log("LOADING JSON MODEL: " + url);
					//meshes.set(url, new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
					renderer._microCache.set(url, new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
					callback(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
				});
			}
}


function Soap()
{
	THREE.Object3D.call( this );

	this.name = 'soap_' + this.id;
	this.castShadow = true;
	this.scale.x = this.scale.y = this.scale.z = 0.1;
	this.userData.info = "Wirf mich runter mit Y!";
	this.userData.rotatable = true;
	this.userData.isDropable = true;
	
	var scope = this;
	meshloader( '../Prototypes/Seife/seife.json',function(model) {scope.add(model);});
}
Soap.prototype = Object.create(THREE.Object3D.prototype);
Soap.prototype.constructor = Soap;


function Toilet()
{
	THREE.Object3D.call( this );
	this.castShadow = true;
	this.receiveShadow = true;
	this.name = "Klo";
	this.userData.info = "Sehr schön";
	this.userData.rotatable = true;
	var scope = this;
	meshloader( '../Prototypes/Klo/klo.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Toilet.prototype =  Object.create(THREE.Object3D.prototype);
Toilet.prototype.constructor = Toilet;


function Sink()
{
	THREE.Object3D.call( this );

	this.scale.x = this.scale.y = this.scale.x = 1.2;
	this.castShadow = true;
	this.name = "Waschbecken";
	this.userData.info = "Waschbecken";
	this.userData.rotatable = true;

	var scope = this;
	meshloader('../Prototypes/Becken/becken.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Sink.prototype  =  Object.create(THREE.Object3D.prototype);
Sink.prototype.constructor = Sink;


function Book()
{
	THREE.Object3D.call( this );
	this.scale.x = this.scale.y = this.scale.z = 0.3;
	this.name = "Buch";
	this.userData.info = "Lies Faust";
	this.userData.rotatable = true;
	var scope = this;
	meshloader('../Prototypes/Buch/buch_neu_comb.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Book.prototype = Object.create(THREE.Object3D.prototype);
Book.prototype.constructor = Book;


function Table()
{
	THREE.Object3D.call( this );

    this.scale.x = this.scale.y = this.scale.z = 1.2;
    this.name = "tisch";
    this.castShadow = true;
    this.recieveShadow = true;
	var scope = this;
	meshloader('../Prototypes/Tisch/table.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Table.prototype = Object.create(THREE.Object3D.prototype);
Table.prototype.constructor = Table;

function Chair()
{
	THREE.Object3D.call( this );
   // this.rotation.y =  Math.PI/180*90;

    this.scale.x = this.scale.y = this.scale.z = 1.2;
    this.name = "chair";
	var scope = this;
	meshloader('../Prototypes/Stuhl/stuhl.json',function(model) {scope.add(model);});
	//collidableMeshList.push(this);
}
Chair.prototype = Object.create(THREE.Object3D.prototype);
Chair.prototype.constructor = Chair;


function Radiator()
{
	THREE.Object3D.call( this );
	this.scale.x = 1.2;
	this.scale.y = this.scale.z = 0.7;
	this.name = "Luefter";
	this.userData.info = "BRRRRRRRR";
	var scope = this;
	meshloader('../Prototypes/Luefter/luefter.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Radiator.prototype = Object.create(THREE.Object3D.prototype);
Radiator.prototype.constructor = Radiator;

function TableLamp()
{	
	THREE.Object3D.call( this );

	var light = new THREE.SpotLight(0xffff99, 5, 10 );
	//light.shadowCameraVisible = true;
	light.shadowDarkness = 0.95;
	light.castShadow = true;
	light.position.set(6.7,9.4,-1.7);
	//var pointLightHelper = new THREE.PointLightHelper(light, 10);
	//scene.add(pointLightHelper);
	
	this.scale.x = this.scale.y = this.scale.z = 0.1;
    this.name = "Table Lamp";
    this.userData.info = "";
   	this.userData.rotatable = true;
	this.add(light);

	var scope = this;
	meshloader('../Prototypes/TischLampe/TischLampeBottom.json',function(model) {scope.add(model);});
	meshloader('../Prototypes/TischLampe/TischLampeTop.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
TableLamp.prototype = Object.create(THREE.Object3D.prototype);
TableLamp.prototype.constructor = TableLamp;

function Bed()
{
   	THREE.Object3D.call( this );
		this.scale.x = this.scale.y = this.scale.z = 1;
		this.updateMatrix();
		this.name = "Bett";
		//this.userData.info = "Einsteigen!";
		this.castShadow = true;
		this.receiveShadow = true;
	var scope = this;
	meshloader('../Prototypes/Bett/bett2.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Bed.prototype = Object.create(THREE.Object3D.prototype);
Bed.prototype.constructor = Bed;

function Door1()
{
	THREE.Object3D.call( this );
    this.scale.y = 1.4;
   	this.castShadow = true;
	this.receiveShadow = true;
    this.updateMatrix();
    this.name = "Tuer1";
	//object.userData.info = "geschlossen!, öffne mit T";
	var scope = this;
	meshloader('../Prototypes/Tuer/tuer1.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}


Door1.prototype = Object.create(THREE.Object3D.prototype);
Door1.prototype.constructor = Door1;

function Door2() {
	THREE.Object3D.call( this );
		this.castShadow = true;
		this.receiveShadow = true;
		this.scale.y = 1.4;
		this.name = "Tuer2";
		this.userData.info = "geschlossen!<br/> öffne mit T";
		
		this.userData.isOpenable = true;
	var scope = this;
	meshloader('../Prototypes/Tuer/tuer2.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Door2.prototype = Object.create(THREE.Object3D.prototype);
Door2.prototype.constructor = Door2;


function Mirror()
{	
	THREE.Object3D.call( this );


	this.castShadow = true;
	this.scale.x = this.scale.y = this.scale.z = 1.1;
	
	var mmaterial = new THREE.WebGLRenderTarget( 500, 500, { format: THREE.RGBFormat } );
	mirror_materials.push(mmaterial);
	var mcam= new THREE.PerspectiveCamera(45, 1, 2.6,50);
	mcam.up = new THREE.Vector3(0,0,1);
	mcam.applyMatrix(new THREE.Matrix4().makeScale(1, 1, -1)); //flip view to create "mirrored" image
	mcam.position.z = -2.5; //set camera origin behind, (front plane set accordingly)
	mcam.updateProjectionMatrix();
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
}
Mirror.prototype = Object.create(THREE.Object3D.prototype);
Mirror.prototype.constructor = Mirror;


function Wall() {
	THREE.Object3D.call( this );

	   this.scale.x = this.scale.z = 4;
	   this.scale.y = 3.15;

	var scope = this;
	meshloader('../Prototypes/Gang/wall.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Wall.prototype = Object.create(THREE.Object3D.prototype);
Wall.prototype.constructor = Wall;


function Ceiling() {
	THREE.Object3D.call( this );

	this.scale.x = this.scale.z = 4;
	this.scale.y = 3.15;

	var scope = this;
	meshloader('../Prototypes/Gang/ceiling.json',function(model) {scope.add(model);});
}
Ceiling.prototype = Object.create(THREE.Object3D.prototype);
Ceiling.prototype.constructor = Ceiling;


function Floor()
{
	THREE.Object3D.call( this );
		this.castShadow = true;
		this.receiveShadow = true;
	   this.scale.x = this.scale.z = 4;

	var scope = this;
	meshloader('../Prototypes/Gang/gang.json',function(model) {scope.add(model);});
}
Floor.prototype = Object.create(THREE.Object3D.prototype);
Floor.prototype.constructor = Floor;

function Sand()
{
	THREE.Object3D.call( this );
	this.castShadow = true;
	this.receiveShadow = true;
	this.scale.x = this.scale.z = 2;
	//this.scale.y = 5;
	var scope = this;
	meshloader('../Prototypes/Sand/sand.json',function(model) {scope.add(model);});
}
Sand.prototype = Object.create(THREE.Object3D.prototype);
Sand.prototype.constructor = Sand;

function WallDoor() 
{
	THREE.Object3D.call( this );

		this.castShadow = true;
		this.receiveShadow = true;
	    this.scale.x = this.scale.z = 4;
	    this.scale.y = 3.15;
	    
	var scope = this;
	meshloader('../Prototypes/Gang/wallDoor.json',function(model) {scope.add(model);});

}
WallDoor.prototype = Object.create(THREE.Object3D.prototype);
WallDoor.prototype.constructor = WallDoor;

function WallCell1() 
{
	THREE.Object3D.call( this );
	this.castShadow = true;
	this.receiveShadow = true;
	this.scale.x = this.scale.y = 3.3;
	this.scale.z = 2;
	var scope = this;
	meshloader('../Prototypes/Zelle/wand2.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
WallCell1.prototype = Object.create(THREE.Object3D.prototype);
WallCell1.prototype.constructor = WallCell1;

function WallCell2() 
{
	THREE.Object3D.call( this );

	this.castShadow = true;
	this.receiveShadow = true;
	this.scale.x = this.scale.y = 3.3;
	this.scale.z = 2;
	var scope = this;
	meshloader('../Prototypes/Zelle/wand.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
WallCell2.prototype = Object.create(THREE.Object3D.prototype);
WallCell2.prototype.constructor = WallCell2;

function WallCellWindow() 
{
	THREE.Object3D.call( this );
	
	this.castShadow = true;
	this.receiveShadow = true;
	this.scale.x = this.scale.y = 3.3;
	this.scale.z = 3.3;
   
	var scope = this;
	meshloader('../Prototypes/Zelle/wandFenster.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
WallCellWindow.prototype = Object.create(THREE.Object3D.prototype);
WallCellWindow.prototype.constructor = WallCellWindow;


function WallCellDoor() 
{
	THREE.Object3D.call( this );

   	this.castShadow = true;
	this.receiveShadow = true;
	var scope = this;
	meshloader('../Prototypes/Zelle/wandFront.json',function(model) {scope.add(model);});
	
}
WallCellDoor.prototype = Object.create(THREE.Object3D.prototype);
WallCellDoor.prototype.constructor = WallCellDoor;

function WallCellDoorCol1() 
{
	THREE.Object3D.call( this );

	var scope = this;
	meshloader('../Prototypes/Zelle/wandFrontCol1.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
WallCellDoorCol1.prototype = Object.create(THREE.Object3D.prototype);
WallCellDoorCol1.prototype.constructor = WallCellDoorCol1;

function WallCellDoorCol2() 
{
	THREE.Object3D.call( this );

	var scope = this;
	meshloader('../Prototypes/Zelle/wandFrontCol2.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
WallCellDoorCol2.prototype = Object.create(THREE.Object3D.prototype);
WallCellDoorCol2.prototype.constructor = WallCellDoorCol2;



function CeilingCell() 
{
	THREE.Object3D.call( this );
	this.scale.x = this.scale.z = 3.35;
    //object.scale.y = 3.15;
    this.rotation.y = Math.PI/2;
	var scope = this;
	meshloader('../Prototypes/Zelle/dach.json',function(model) {scope.add(model);});
}
CeilingCell.prototype = Object.create(THREE.Object3D.prototype);
CeilingCell.prototype.constructor = CeilingCell;


function FloorCell() 
{
	THREE.Object3D.call( this );
	this.scale.x = 3.5;
	this.scale.z = 3.4;
    //object.rotation.y = Math.PI/2;
	var scope = this;
	meshloader('../Prototypes/Zelle/boden.json',function(model) {scope.add(model);});
}
FloorCell.prototype = Object.create(THREE.Object3D.prototype);
FloorCell.prototype.constructor = FloorCell;


function CeilingLamp() {
	
	THREE.Object3D.call( this );
	this.castShadow = true;
	this.receiveShadow = true;
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




function JailBotBody()
{
	THREE.Object3D.call( this );
		this.scale.x = this.scale.y = this.scale.z = 1.2;
		this.castShadow = true;
		this.name = "JailBotBody";
		this.userData.info = "Rapiiiing!";
		this.userData.rotatable = true;
	var scope = this;
	meshloader( '../Prototypes/Bot/bot_body.json',function(model) {scope.add(model);});
}
JailBotBody.prototype = Object.create(THREE.Object3D.prototype);
JailBotBody.prototype.constructor = JailBotBody;

function JailBotArms()
{
	THREE.Object3D.call( this );

		this.scale.x = this.scale.y = this.scale.z = 1.2;
		this.castShadow = true;
		this.name = "JailBotArms";
		this.userData.info = "Rapiiiing!";
		this.userData.rotatable = true;
	var scope = this;
	meshloader('../Prototypes/Bot/bot_arms.json',function(model) {scope.add(model);});
}
JailBotArms.prototype = Object.create(THREE.Object3D.prototype);
JailBotArms.prototype.constructor = JailBotArms;


