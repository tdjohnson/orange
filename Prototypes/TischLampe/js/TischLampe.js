  var lampeT, lampeB, lampeS, lampeH, shape;
  var spotlight, shape;
  var TLloader;
  var px,py,pz;

function rotate(object,radians) {
	var axis = new THREE.Vector3(0,1,0);
    var rotation_matrix = new THREE.Matrix4();
    rotation_matrix.makeRotationAxis(axis.normalize(), radians);
    object.matrix.multiply(rotation_matrix);
    object.rotation.setFromRotationMatrix(object.matrix);
    shape.position = object.position;
    spotlight.position = object.position;
}

function addLightSource(){
	
	//local offset for adding lightsource to object
	var lx = 6;
	var ly = 9;
	var lz = -5;
	
	//spotlight
	spotlight = new THREE.SpotLight(0xffff00);
	spotlight.shadowCameraVisible = true;
	spotlight.shadowDarkness = 0.95;
	spotlight.intensity = 2;
	spotlight.target.position = new THREE.Object3D( 0, 0, 0 );
	spotlight.castShadow = true;
	spotlight.position.set(lx,ly,lz);

	var spotTarget = new THREE.Object3D();
	spotTarget.position.set(0, 0, 10);

	spotlight.target.position = spotTarget;
	
	
	     //visible light
	var sphereGeometry = new THREE.SphereGeometry( 1, 1, 1 );
	var darkMaterial = new THREE.MeshBasicMaterial( { color: 0xFFFF00 } );
	var wireframeMaterial = new THREE.MeshBasicMaterial( 
		{ color: 0xffff00, wireframe: true, transparent: true } ); 
	shape = THREE.SceneUtils.createMultiMaterialObject( 
	sphereGeometry, [ darkMaterial, wireframeMaterial ] );
	shape.position.x = lx;
	shape.position.y = ly;
	shape.position.z = lz;
	
}

function addObject(){
	
TLloader = new THREE.JSONLoader();

TLloader.load( 'models/TischLampeBottom.json', function ( geometry, materials ) {
    lampeB= new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
    lampeB.position.set(px,py,pz);
    scene.add( lampeB );
});

TLloader.load( 'models/TischLampeStand.json', function ( geometry, materials ) {
    lampeS= new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
    lampeS.position.set(px,py,pz);
    scene.add( lampeS );
});


TLloader.load( 'models/TischLampeHead.json', function ( geometry, materials ) {
    lampeH = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
	lampeH.add(shape);
	lampeH.add(spotlight);
});


TLloader.load( 'models/TischLampeTop.json', function ( geometry, materials ) {
	
    lampeT= new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
    lampeT.position.set(px,py,pz);
    lampeT.add(lampeH);
    scene.add(lampeT);
});

}

function addTischLampe(x,y,z){
	px = x;
	py = y;
	pz = z;
	addObject();
	addLightSource();
}
