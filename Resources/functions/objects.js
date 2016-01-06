var loader = new THREE.JSONLoader();


function Hallway()
{
	THREE.Object3D.call( this );
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
		
	var wall = new Wall();
	wall.position.set(0,4.7,21.4);
	this.add(wall);
	
	var ceiling = new Ceiling();
	ceiling.position.set(24,9,21.4);
	this.add(ceiling);
	
	var floor = new Floor();
	floor.position.set(24,0,21.3);
	this.add(floor);

        
    var wallDoor = new WallDoor();
	wallDoor.position.set(48,0,27.3);
	this.add(wallDoor);


	var ceilingLamp = new CeilingLamp();
	ceilingLamp.position.set(30,9,22);
	ceilingLamp.rotation.x = Math.PI;
	this.add(ceilingLamp);

        
	var bot = new JailBot();
	bot.position.set(1.25,2.5,18);
	bot.rotation.y =  Math.PI*0.5;
	this.add(bot);
	
	
	this.add(object);
}
Hallway.prototype = new THREE.Object3D();
Hallway.prototype.constructor = Hallway;

function PrisonCell()
{
	THREE.Object3D.call( this );
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Zelle/Zelle_hires.json', 
	
	function ( geometry, materials ) {
		object.add(new THREE.Mesh( geometry,new THREE.MeshFaceMaterial(materials)));
	});

	object.name = 'PrisonCell_' + this.id;
	object.castShadow = true;
	object.scale.x =  object.scale.y = object.scale.z = 3.5;
	object.rotation.y = Math.PI / -2;

	
	var soap = new Soap();
	soap.position.set(0.85,2.5,12.2);
	this.add(soap);
	
	var toilet = new Toilet();
	toilet.position.set(2.5,0,5);
	toilet.rotation.y =  Math.PI*0.5;
	this.add(toilet);
	
	var sink = new Sink();
	sink.position.set(1.25,2.5,13);
	sink.rotation.y = Math.PI*0.5;
	this.add(sink);
	
	
	var book = new Book();
	book.position.set(10,2,11.2);
	book.rotation.y =  Math.PI/180*90;
	this.add(book);
	
	var table = new Table();
	table.position.set(10,0,13);
	table.rotation.y =  Math.PI/180*90;
	this.add(table);
	
	var radiator = new Radiator();
	radiator.position.set(1,6,9.9);
	radiator.rotation.y =  Math.PI/180*90;
	this.add(radiator);
	
	var tablelamp = new TableLamp();
	tablelamp.position.set(10.3,2,10.9);
	this.add(tablelamp);
	
	var bed = new Bed();
	bed.position.set(9,0,5);
	bed.rotation.y =  Math.PI;
	this.add(bed);
	
	var door1 = new Door1();
	door1.position.set(4.8,3.8,15.3);
	this.add(door1);
	
	var door2 = new Door2();
	door2.position.set(8,3.8,14.9);
	this.add(door2);
	
	var mirror = new Mirror();
	mirror.position.set(0.8,4,13);
	mirror.rotation.y =  Math.PI/180*90;
	this.add(mirror);

	this.add(object);
}
PrisonCell.prototype = new THREE.Object3D();
PrisonCell.prototype.constructor = PrisonCell;


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
	light.shadowCameraVisible = true;
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