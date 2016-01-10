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
	var object = new THREE.Object3D();
	//loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Seife/seife.json',function ( geometry, materials ) {
		materialsNew = renderer._microCache.getSet(materials[0].name, new THREE.MeshFaceMaterial(materials));
		object.add(new THREE.Mesh( geometry, materialsNew));
	});

	object.name = 'soap_' + this.id;
	object.castShadow = true;
	object.scale.x = object.scale.y = object.scale.z = 0.1;
	object.userData.info = "Wirf mich runter mit Y!";
	object.userData.rotatable = true;
	object.userData.isDropable = true;
	
	this.add(object);
}
Soap.prototype = new THREE.Object3D();
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
Sink.prototype = new THREE.Object3D();
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
Book.prototype = new THREE.Object3D();
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
Table.prototype = new THREE.Object3D();
Table.prototype.constructor = Table;

function Chair()
{
	THREE.Object3D.call( this );
    this.rotation.y =  Math.PI/180*90;

    this.scale.x = this.scale.y = this.scale.z = 1.2;
    this.name = "chair";
	var scope = this;
	meshloader('../Prototypes/Stuhl/stuhl.json',function(model) {scope.add(model);});
	//collidableMeshList.push(this);
}
Chair.prototype = new THREE.Object3D();
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
Radiator.prototype = new THREE.Object3D();
Radiator.prototype.constructor = Radiator;

function TableLamp()
{	
	THREE.Object3D.call( this );

	var light = new THREE.PointLight(0xffff99, 5, 10 );
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
TableLamp.prototype = new THREE.Object3D();
TableLamp.prototype.constructor = TableLamp;

function Bed()
{
   	THREE.Object3D.call( this );
		this.scale.x = this.scale.y = this.scale.z = 1;
		this.updateMatrix();
		this.name = "Bett";
		this.userData.info = "Einsteigen!";
		this.castShadow = true;
		this.receiveShadow = true;
	var scope = this;
	meshloader('../Prototypes/Bett/bett.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Bed.prototype = new THREE.Object3D();
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


Door1.prototype = new THREE.Object3D();
Door1.prototype.constructor = Door1;

function Door2() {
	THREE.Object3D.call( this );
		this.castShadow = true;
		this.receiveShadow = true;
		this.scale.y = 1.4;
		//this.updateMatrix();
		this.name = "Tuer2";
		this.userData.info = "geschlossen!<br/> öffne mit T";
		this.userData.startPosition = this.position.x;
		this.userData.isOpenable = true;
	var scope = this;
	meshloader('../Prototypes/Tuer/tuer2.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Door2.prototype = new THREE.Object3D();
Door2.prototype.constructor = Door2;


function Mirror()
{	
	THREE.Object3D.call( this );

	this.rotation.y = Math.PI*0.5; 
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
	meshloader('../Prototypes/Spiegel/SpiegelRahmen.json',function(model) {scope.add(model);});
}
Mirror.prototype = new THREE.Object3D();
Mirror.prototype.constructor = Mirror;


function Wall() {
	THREE.Object3D.call( this );

	   this.scale.x = this.scale.z = 4;
	   this.scale.y = 3.15;

	var scope = this;
	meshloader('../Prototypes/Gang/wall.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
Wall.prototype = new THREE.Object3D();
Wall.prototype.constructor = Wall;


function Ceiling() {
	THREE.Object3D.call( this );

	this.scale.x = this.scale.z = 4;
	this.scale.y = 3.15;

	var scope = this;
	meshloader('../Prototypes/Gang/ceiling.json',function(model) {scope.add(model);});
}
Ceiling.prototype = new THREE.Object3D();
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
Floor.prototype = new THREE.Object3D();
Floor.prototype.constructor = Floor;

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
WallDoor.prototype = new THREE.Object3D();
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
WallCell1.prototype = new THREE.Object3D();
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
WallCell2.prototype = new THREE.Object3D();
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
WallCellWindow.prototype = new THREE.Object3D();
WallCellWindow.prototype.constructor = WallCellWindow;


function WallCellDoor() 
{
	THREE.Object3D.call( this );

   	this.castShadow = true;
	this.receiveShadow = true;
	var scope = this;
	meshloader('../Prototypes/Zelle/wandFront.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
WallCellDoor.prototype = new THREE.Object3D();
WallCellDoor.prototype.constructor = WallCellDoor;

function WallCellDoorCol1() 
{
	THREE.Object3D.call( this );

	var scope = this;
	meshloader('../Prototypes/Zelle/wandFrontCol1.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
WallCellDoorCol1.prototype = new THREE.Object3D();
WallCellDoorCol1.prototype.constructor = WallCellDoorCol1;

function WallCellDoorCol2() 
{
	THREE.Object3D.call( this );

	var scope = this;
	meshloader('../Prototypes/Zelle/wandFrontCol2.json',function(model) {scope.add(model);});
	collidableMeshList.push(this);
}
WallCellDoorCol2.prototype = new THREE.Object3D();
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
CeilingCell.prototype = new THREE.Object3D();
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
FloorCell.prototype = new THREE.Object3D();
FloorCell.prototype.constructor = FloorCell;


function CeilingLamp() {
	
	THREE.Object3D.call( this );
	this.castShadow = true;
	this.receiveShadow = true;
	this.name = "CeilingLamp";
	var scope = this;
	meshloader( '../Prototypes/DeckenLampe/lampe.json',function(model) {scope.add(model);});
	
	this.scale.x = this.scale.z = this.scale.y = 0.5;
	this.rotation.x = Math.PI;
	
	var light = new THREE.PointLight(0xffff99, 1, 10);
	light.castShadow = true;
	light.position.set(9, 8.7, 21);
	var light2 = new THREE.PointLight(0xffff99, 1, 10);
	light2.castShadow = true;
	light2.position.set(10, 8.7, 21);
	var light3 = new THREE.PointLight(0xffff99, 1, 10);
	light3.castShadow = true;
	light3.position.set(11, 8.7, 21);
	var lightHelper = new THREE.PointLightHelper(light, 0.05);
	var lightHelper2 = new THREE.PointLightHelper(light2, 0.05);
	var lightHelper3 = new THREE.PointLightHelper(light3, 0.05);
	scene.add(lightHelper);
	scene.add(lightHelper2);
	scene.add(lightHelper3);
	scene.add(light);
	scene.add(light2);
	scene.add(light3);

}

CeilingLamp.prototype = new THREE.Object3D();
CeilingLamp.prototype.constructor = CeilingLamp;

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
JailBotBody.prototype = new THREE.Object3D();
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
JailBotArms.prototype = new THREE.Object3D();
JailBotArms.prototype.constructor = JailBotArms;

