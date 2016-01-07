function Soap()
{
	THREE.Object3D.call( this );
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Seife/seife.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
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
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Klo/klo.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});


		object.castShadow = true;
		object.name = "Klo";
		object.userData.info = "Sehr schön";
		object.userData.rotatable = true;
		collidableMeshList.push(object);
		this.add(object);
}
Toilet.prototype = new THREE.Object3D();
Toilet.prototype.constructor = Toilet;


function Sink()
{
	THREE.Object3D.call( this );
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Becken/becken.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});

		object.scale.x = object.scale.y = object.scale.x = 1.2;
		objectcastShadow = true;
		object.name = "Waschbecken";
		object.userData.info = "Waschbecken";
		object.userData.rotatable = true;
		this.add(object);
}
Sink.prototype = new THREE.Object3D();
Sink.prototype.constructor = Sink;


function Book()
{
	THREE.Object3D.call( this );
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Buch/buch_neu_comb.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});

		object.scale.x = object.scale.y = object.scale.z = 0.3;
		object.name = "Buch";
		object.userData.info = "Lies Faust";
		object.userData.rotatable = true;
		this.add(object);
}
Book.prototype = new THREE.Object3D();
Book.prototype.constructor = Book;


function Table()
{
	THREE.Object3D.call( this );
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Tisch/table.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});

        object.scale.x = object.scale.y = object.scale.z = 1;
        object.updateMatrix();
        object.name = "tisch";
	    collidableMeshList.push(object);
		this.add(object);
}
Table.prototype = new THREE.Object3D();
Table.prototype.constructor = Table;

function loadChair()
{

    var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Stuhl/stuhl.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    chair = new THREE.Mesh( geometry, material );
        //tisch.rotation.y =  Math.PI *2;
      	chair.rotation.y =  Math.PI/180*90;
        chair.position.z = 11;
        chair.position.x = 9;
        chair.position.y = -0.5;
        chair.scale.x = chair.scale.y = chair.scale.z = 1;
        chair.updateMatrix();
        chair.name = "chair";
	    scene.add(chair);
	    collidableMeshList.push(chair);

	});
}


function Radiator()
{
	THREE.Object3D.call( this );
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Luefter/luefter.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});
		object.scale.x = 1.2;
		object.scale.y = object.scale.z = 0.7;
		object.name = "Luefter";
		object.userData.info = "BRRRRRRRR";
		this.add(object);
}
Radiator.prototype = new THREE.Object3D();
Radiator.prototype.constructor = Radiator;

function TableLamp()
{	
	THREE.Object3D.call( this );
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load('../Prototypes/TischLampe/TischLampeBottom.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});
	loader.load('../Prototypes/TischLampe/TischLampeTop.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});
	
	var light = new THREE.PointLight(0xffff99, 5, 10 );
	//light.shadowCameraVisible = true;
	light.shadowDarkness = 0.95;
	light.castShadow = true;
	light.position.set(6.7,9.4,-1.7);
	//var pointLightHelper = new THREE.PointLightHelper(light, 10);
	//scene.add(pointLightHelper);

	object.scale.x = object.scale.y = object.scale.z = 0.1;
    object.name = "Table Lamp";
    object.userData.info = "";
    object.userData.rotatable = true;
	object.add(light);

	this.add(object);
}
TableLamp.prototype = new THREE.Object3D();
TableLamp.prototype.constructor = TableLamp;

function Bed()
{
   	THREE.Object3D.call( this );
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load('../Prototypes/Bett/bett.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});

		object.scale.x = object.scale.y = object.scale.z = 1;
		object.updateMatrix();
		object.name = "Bett";
		object.userData.info = "Einsteigen!";
		object.castShadow = true;
		collidableMeshList.push(object);
	this.add(object);
}
Bed.prototype = new THREE.Object3D();
Bed.prototype.constructor = Bed;

function Door1()
{
	THREE.Object3D.call( this );
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load('../Prototypes/Tuer/tuer1.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});
	    object.scale.y = 1.4;
	    object.castShadow = true;
	    object.updateMatrix();
	    object.name = "Tuer1";
		//object.userData.info = "geschlossen!, öffne mit T";
		collidableMeshList.push(object);
		this.add(object);
}
Door1.prototype = new THREE.Object3D();
Door1.prototype.constructor = Door1;

function Door2() {
	THREE.Object3D.call( this );
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load('../Prototypes/Tuer/tuer2.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});

		object.castShadow = true;
		object.scale.y = 1.4;
		object.updateMatrix();
		object.name = "Tuer2";
		object.userData.info = "geschlossen!<br/> öffne mit T";
		object.userData.startPosition = object.position.x;
		object.userData.isOpenable = true;
		collidableMeshList.push(object);
		this.add(object);
}
Door2.prototype = new THREE.Object3D();
Door2.prototype.constructor = Door2;


function Mirror()
{	
	THREE.Object3D.call( this );
	var object= new THREE.Object3D();
	var mirrorFrame = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load('../Prototypes/Spiegel/SpiegelRahmen.json',function ( geometry, materials ) {
		mirrorFrame.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});
	mirrorFrame.rotation.y = Math.PI*0.5; 
	mirrorFrame.castShadow = true;
	mirrorFrame.scale.x = mirrorFrame.scale.y = mirrorFrame.scale.z = 1;
	
	//load third-party mirror (by author Slayvin )
	mirrorMaterial = new THREE.Mirror( renderer, camera, { textureWidth: window.innerWidth, textureHeight: window.innerHeight, color:0x858585} );
	object = new THREE.Mesh( new THREE.PlaneBufferGeometry(2,2), mirrorMaterial.material );
	object.add(mirrorMaterial);
	object.add(mirrorFrame);
	this.add(object);
}
Mirror.prototype = new THREE.Object3D();
Mirror.prototype.constructor = Mirror;


function Wall() {
	THREE.Object3D.call( this );
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load('../Prototypes/Gang/wall.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});
	   object.scale.x = object.scale.z = 4;
	   object.scale.y = 3.15;

	this.add(object);
}
Wall.prototype = new THREE.Object3D();
Wall.prototype.constructor = Wall;


function Ceiling() {
		var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load('../Prototypes/Gang/ceiling.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});

	    object.scale.x = object.scale.z = 4;
	    object.scale.y = 3.15;

	this.add(object);
}
Ceiling.prototype = new THREE.Object3D();
Ceiling.prototype.constructor = Ceiling;


function Floor()
{
   	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load('../Prototypes/Gang/gang.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});

	    object.scale.x = object.scale.z = 4;

	this.add(object);
}
Floor.prototype = new THREE.Object3D();
Floor.prototype.constructor = Floor;

function WallDoor() 
{
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load('../Prototypes/Gang/wallDoor.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});

	    object.scale.x = object.scale.z = 4;
	    object.scale.y = 3.15;

	this.add(object);
}
WallDoor.prototype = new THREE.Object3D();
WallDoor.prototype.constructor = WallDoor;

function CeilingLamp() {
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load('../Prototypes/DeckenLampe/lampe.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});
	
	    object.scale.x = object.scale.z = object.scale.y = 0.5;

	    
	this.add(object);
}
CeilingLamp.prototype = new THREE.Object3D();
CeilingLamp.prototype.constructor = CeilingLamp;

function JailBot()
{
	THREE.Object3D.call( this );
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Bot/bot_combined.json',function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});
	
		object.scale.x = object.scale.y = object.scale.x = 1.2;
		object.castShadow = true;
		object.name = "JailBot";
		object.userData.info = "Rapiiiing!";
		object.userData.rotatable = true;
		this.add(object);
}
JailBot.prototype = new THREE.Object3D();
JailBot.prototype.constructor = JailBot;