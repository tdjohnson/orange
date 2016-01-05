function loadCell() {
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Zelle/Zelle_hires.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    cell = new THREE.Mesh( geometry, material );
	    cell.scale.x = cell.scale.z = 3.5;
	    cell.scale.y = 3.5;
	    cell.rotation.y = Math.PI / -2;
	    scene.add(cell);
	});
}

function loadToilet()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Klo/klo.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		toilet = new THREE.Mesh( geometry, material );
		toilet.rotation.y =  Math.PI*0.5;
		toilet.position.z = 5;
		toilet.position.x = 2.5;
		toilet.castShadow = true;
		toilet.name = "Klo";
		toilet.userData.info = "Sehr schön";
		toilet.userData.rotatable = true;
		scene.add(toilet);
		var box = new THREE.BoundingBoxHelper(toilet, 0xffffff );
		box.update();
		collidableMeshList.push(box);
	});
}

function loadSink()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Becken/becken.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		sink = new THREE.Mesh( geometry, material );
		sink.rotation.y =  Math.PI*0.5;
		sink.position.z = 13;
		sink.position.x = 1.25;
		sink.position.y = 2.5;
		sink.scale.x = sink.scale.y = sink.scale.x = 1.2;
		sink.castShadow = true;
		sink.name = "Waschbecken";
		sink.userData.info = "Waschbecken";
		sink.userData.rotatable = true;
		scene.add(sink);
		var box = new THREE.BoundingBoxHelper(sink, 0xffffff );
		box.update();
		collidableMeshList.push(box);
	});
}

function loadBot()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Bot/bot_combined.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		bot = new THREE.Mesh( geometry, material );
		bot.rotation.y =  Math.PI*0.5;
		bot.position.z = 15;
		bot.position.x = 1.25;
		bot.position.y = 2.5;
		bot.scale.x = bot.scale.y = bot.scale.x = 1.2;
		bot.castShadow = true;
		bot.name = "JailBot";
		bot.userData.info = "Rapiiiing!";
		bot.userData.rotatable = true;
		scene.add(bot);
	});
}

function loadFloor()
{
    var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Gang/gang.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    floor = new THREE.Mesh( geometry, material );
	    floor.scale.x = floor.scale.z = 4;
	    floor.position.x = 24;
        floor.position.z = 21.3;
        floor.position.y = 0;
	    scene.add(floor);

	});
}

function loadWall() {
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Gang/wall.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    wall = new THREE.Mesh( geometry, material );
	    wall.scale.x = wall.scale.z = 4;
	    wall.scale.y = 3.15;
	    wall.position.x = 0;
	    wall.position.z = 21.4;
	    wall.position.y = 4.7;
	    scene.add(wall);
	});
}

function loadCeiling() {
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Gang/ceiling.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    ceiling = new THREE.Mesh( geometry, material );
	    ceiling.scale.x = ceiling.scale.z = 4;
	    ceiling.scale.y = 3.15;
	    ceiling.position.x = 12;
	    ceiling.position.z = 21.4;
	    ceiling.position.y = 9;
	    ceiling.rotation.x = Math.PI;
	    scene.add(ceiling);
	});
}

function loadBook()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Buch/buch_neu_comb.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		book = new THREE.Mesh( geometry, material );
		book.position.y = 0;
		book.position.x = 10;
		book.position.z = 12;
		book.rotation.y =  Math.PI*1.5;
		book.scale.x = book.scale.y = book.scale.z = 0.3;
		book.name = "Buch";
		book.userData.info = "Lies Faust";
		book.userData.rotatable = true;
		scene.add(book);
		var bbox = new THREE.BoundingBoxHelper( book, 0xffffff );
		bbox.update();
		//scene.add( bbox );
	});
}

function loadSoap()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Seife/seife.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		soap = new THREE.Mesh( geometry, material );
		soap.position.y = 2.5;
		soap.position.x = 0.85;
		soap.position.z = 12.2;
		soap.castShadow = true;
		soap.scale.x = soap.scale.y = soap.scale.z = 0.1;
		soap.name = "Seife";
		soap.userData.info = "Wirf mich runter mit Y!";
		soap.userData.rotatable = true;
		soap.userData.isDropable = true;
		
		
		scene.add(soap);
		var bbox = new THREE.BoundingBoxHelper( soap, 0xffffff );
		bbox.update();
		//scene.add( bbox );
	});
}

function loadTable()
{

    var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Tisch/table.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    table = new THREE.Mesh( geometry, material );
        //tisch.rotation.y =  Math.PI *2;
      	table.rotation.y =  Math.PI/180*90;
        table.position.z = 13;
        table.position.x = 10;
        table.position.y = 0;
        table.scale.x = table.scale.y = table.scale.z = 1;
        table.updateMatrix();
        table.name = "tisch";
	    scene.add(table);

	});
}

function loadChair()
{

    var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Stuhl/stuhl.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    chair = new THREE.Mesh( geometry, material );
        //tisch.rotation.y =  Math.PI *2;
      	chair.rotation.y =  Math.PI/180*90;
        chair.position.z = 14;
        chair.position.x = 2;
        chair.position.y = 1;
        chair.scale.x = chair.scale.y = chair.scale.z = 1;
        chair.updateMatrix();
        chair.name = "chair";
	    scene.add(chair);

	});
}


function loadRadiator()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Luefter/luefter.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		radiator = new THREE.Mesh( geometry, material );
		radiator.position.y = 6;
		radiator.position.x = 1;
		radiator.position.z = 9.9;
		radiator.rotation.y =  Math.PI*0.5;
		radiator.scale.y = radiator.scale.z = 0.7;
		radiator.scale.x = 1.2;
		radiator.name = "Luefter";
		radiator.userData.info = "BRRRRRRRR";
		scene.add(radiator);
		var box = new THREE.BoundingBoxHelper(radiator, 0xffffff );
		box.update();
		collidableMeshList.push(box);
		scene.add( bbox );
	});
}

function loadLamp()
{	
	//position
	var px = 10.3;
	var py = 0;
	var pz = 10.9;
	//scale
	var sx = sy = sz =  0.1;
	//light position (locally)
	var lx = 6.7;
	var ly = 9.4;
	var lz = -1.7;
	
	var light = new THREE.PointLight(0xffff99, 5, 10 );
	light.shadowCameraVisible = true;
	light.shadowDarkness = 0.95;
	light.castShadow = true;
	light.position.set(lx,ly,lz);
	//var pointLightHelper = new THREE.PointLightHelper(light, 10);
	//scene.add(pointLightHelper);
	
	loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/TischLampe/TischLampeBottom.json', function ( geometry, materials ) {
		var lampeB = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
	    lampeB.position.set(px,py,pz);
		lampeB.scale.set(sx,sy,sz);
		scene.add(lampeB);
	});
	
	loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/TischLampe/TischLampeTop.json', function ( geometry, materials ) {
		lampe = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
		lampe.position.set(px,py,pz);
    	lampe.scale.set(sx,sy,sz);
    	lampe.name = "Lampe";
    	lampe.userData.info = "";
    	lampe.userData.rotatable = true;
		lampe.add(light);
		scene.add(lampe);
	});
}

function loadBed()
{

    var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Bett/bett.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		bed = new THREE.Mesh( geometry, material );
		bed.rotation.y =  Math.PI;
		bed.position.z = 5;
		bed.position.x = 9;
		bed.scale.x = bed.scale.y = bed.scale.z = 1;
		bed.updateMatrix();
		bed.name = "Bett";
		bed.userData.info = "Einsteigen!";
		scene.add(bed);
		var box = new THREE.BoundingBoxHelper(sink, 0xffffff );
		box.update();
		collidableMeshList.push(box);
	});
}

function loadDoor1()
{
	loader = new THREE.JSONLoader();
	loader.load( "../Prototypes/Tuer/tuer1.json", function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		door1 = new THREE.Mesh( geometry, material );
	    door1.position.z = 15.3;
	    door1.position.x = 4.8;
	    door1.position.y = 3.8;
	    door1.scale.y = 1.4;
	    door1.castShadow = true;
	    door1.updateMatrix();
	    door1.name = "Tuer1";
		//tuer1.userData.info = "geschlossen!, öffne mit T";
		scene.add(door1);
		var bbox = new THREE.BoundingBoxHelper( door1, 0xffffff );
		bbox.update();
		scene.add( bbox );
	});
}
function loadDoor2() {

    var loader = new THREE.JSONLoader();
	loader.load( "../Prototypes/Tuer/tuer2.json", function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		door2 = new THREE.Mesh( geometry, material );
		door2.position.x = 8;
		door2.position.z = 14.9;
		door2.position.y = 3.8;
		door2.castShadow = true;
		door2.scale.y = 1.4;
		door2.updateMatrix();
		door2.name = "Tuer2";
		door2.userData.info = "geschlossen!<br/> öffne mit T";
		door2.userData.isOpenable = true;
		scene.add(door2);
		var bbox = new THREE.BoundingBoxHelper( door2, 0xffffff );
		bbox.update();
		//scene.add( bbox );
	});
}


function loadMirror(){

			
	verticalMirror = new THREE.Mirror( renderer, camera, { clipBias: 0.003, textureWidth: window.innerWidth, textureHeight: window.innerHeight, color:0x858585} );
	spiegel = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2,2), verticalMirror.material );
	spiegel.add( verticalMirror );
	spiegel.position.x = 0.9;
	spiegel.position.y = 4;
	spiegel.position.z = 13;
	spiegel.rotation.y = Math.PI / 180 * 90;
	scene.add(spiegel);

				mirror = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2,2), verticalMirror.material );
				mirror.add( verticalMirror );
				mirror.position.x = 0.9;
				mirror.position.y = 4;
				mirror.position.z = 13;
				mirror.rotation.y = Math.PI / 180 * 90;
				mirror.name = "Spiegel";
				scene.add(mirror);
}
