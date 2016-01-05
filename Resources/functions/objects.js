 function loadZelle() {
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Zelle/Zelle_hires.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    zelle = new THREE.Mesh( geometry, material );
	    zelle.scale.x = zelle.scale.z = 3.5;
	    zelle.scale.y = 3.5;
	    zelle.rotation.y = Math.PI / -2;
	    scene.add(zelle);
	});
}

function loadKlo()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Klo/klo.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		klo = new THREE.Mesh( geometry, material );
		klo.rotation.y =  Math.PI*0.5;
		klo.position.z = 5;
		klo.position.x = 2.5;
		klo.castShadow = true;
		klo.name = "Klo";
		klo.userData.info = "Sehr schön";
		klo.userData.rotatable = true;
		scene.add(klo);
		var bbox = new THREE.BoundingBoxHelper( klo, 0xffffff );
		bbox.update();
		collidableMeshList.push(klo);
		scene.add( bbox );
	});
}

function loadBecken()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Becken/becken.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		becken = new THREE.Mesh( geometry, material );
		becken.rotation.y =  Math.PI*0.5;
		becken.position.z = 10;
		becken.position.x = 1.2;
		becken.position.y = 2.5;
		becken.scale.x = becken.scale.y = becken.scale.x = 1.2;
		becken.castShadow = true;
		becken.name = "Klo";
		becken.userData.info = "Waschbücken";
		becken.userData.rotatable = true;
		scene.add(becken);
		var bbox = new THREE.BoundingBoxHelper( becken, 0xffffff );
		bbox.update();
		collidableMeshList.push(becken);
		scene.add( bbox );
	});
}

function loadFloor()
{
    var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Boden/boden.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    boden = new THREE.Mesh( geometry, material );
	    boden.position.x = -6;
        boden.position.z = -8;
        boden.position.y = -0.3;
	    scene.add(boden);

	});
}

function loadBuch()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Buch/buch_neu_comb.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		buch = new THREE.Mesh( geometry, material );
		buch.position.y = 0;
		buch.position.x = 10;
		buch.position.z = 12;
		buch.rotation.y =  Math.PI*1.5;
		buch.scale.x = buch.scale.y = buch.scale.z = 0.3;
		buch.name = "Buch";
		buch.userData.info = "Lies Faust";
		buch.userData.rotatable = true;
		scene.add(buch);
		var bbox = new THREE.BoundingBoxHelper( buch, 0xffffff );
		bbox.update();
		//scene.add( bbox );
	});
}

function loadSeife()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Seife/seife.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		seife = new THREE.Mesh( geometry, material );
		seife.position.y = 2.0;
		seife.position.x = 2.0;
		seife.position.z = 10.0;
		seife.castShadow = true;
		seife.scale.x = seife.scale.y = seife.scale.z = 0.3;
		seife.name = "Seife";
		seife.userData.info = "geschlossen!, öffne mit T";
		seife.userData.rotatable = true;
		seife.userData.isDropable = true;
		scene.add(seife);
		var bbox = new THREE.BoundingBoxHelper( seife, 0xffffff );
		bbox.update();
		//scene.add( bbox );
	});
}

function loadLuefter()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Luefter/luefter.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		luefter = new THREE.Mesh( geometry, material );
		luefter.position.y = 6;
		luefter.position.x = 1;
		luefter.position.z = 9.9;
		luefter.rotation.y =  Math.PI*0.5;
		luefter.scale.y = luefter.scale.z = 0.7;
		luefter.scale.x = 1.2;
		luefter.name = "Luefter";
		luefter.userData.info = "BRRRRRRRR";
		scene.add(luefter);
		var bbox = new THREE.BoundingBoxHelper( luefter, 0xffffff );
		bbox.update();
		scene.add( bbox );
	});
}

function loadLampe()
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

function loadBett()
{

    var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Bett/bett.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		bett = new THREE.Mesh( geometry, material );
		bett.rotation.y =  Math.PI;
		bett.position.z = 5;
		bett.position.x = 9;
		bett.scale.x = bett.scale.y = bett.scale.z = 1;
		bett.updateMatrix();
		bett.name = "Bett";
		bett.userData.info = "Einsteigen!";
		scene.add(bett);
		var bbox = new THREE.BoundingBoxHelper( bett, 0xffffff );
		bbox.update();
		scene.add( bbox );
	});
}

function loadDoor1()
{
	loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
	var path = "../Prototypes/Tuer/tuer1.dae";
	loader.load(path, function(geometry) {
	    tuer1 = geometry.scene;
	    tuer1.position.z = 15.3;
	    tuer1.position.x = 4.8;
	    tuer1.position.y = 3.8;
	    tuer1.scale.y = 1.4;
	    tuer1.castShadow = true;
	    tuer1.updateMatrix();
	    tuer1.name = "Tuer1";
		tuer1.userData.info = "geschlossen!, öffne mit T";
		scene.add(tuer1);
		var bbox = new THREE.BoundingBoxHelper( tuer1, 0xffffff );
		bbox.update();
		scene.add( bbox );
	});
}
function loadDoor2() {

    var loader = new THREE.JSONLoader();
	loader.load( "../Prototypes/Tuer/tuer2.json", function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
		tuer2 = new THREE.Mesh( geometry, material );
		tuer2.position.x = 8;
		tuer2.position.z = 14.9;
		tuer2.position.y = 3.8;
		tuer2.castShadow = true;
		tuer2.scale.y = 1.4;
		tuer2.updateMatrix();
		tuer2.name = "Tuer2";
		tuer2.userData.info = "geschlossen!<br/> öffne mit T";
		scene.add(tuer2);
		var bbox = new THREE.BoundingBoxHelper( tuer2, 0xffffff );
		bbox.update();
		//scene.add( bbox );
	});
}


function loadMirror(){
	var verticalMirror = new THREE.Mirror( renderer, camera, { clipBias: 0.003, textureWidth: 100, textureHeight: 100, color:0x889999 } );

				var spiegel = new THREE.Mesh( new THREE.PlaneBufferGeometry( 3, 5 ), verticalMirror.material );
				spiegel.add( verticalMirror );
				spiegel.position.x = 1;
				spiegel.position.y = 1;
				spiegel.position.z = 10;
				spiegel.rotation.y =  Math.PI /90;
				scene.add(spiegel);
				rotate(spiegel,new THREE.Vector3(0,1,0),90);
	
}
