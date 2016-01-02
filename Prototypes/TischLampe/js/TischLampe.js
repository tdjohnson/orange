  var lampeT, lampeB, lampeS, lampeH;
  var spotlight;
  var TLloader;
  var px,py,pz;
  var sx,sy,sz;
var axis = new THREE.Vector3(0,1,0);

function rotate(object,angle) {
var xAxis = new THREE.Vector3(0,1,0);
object.rotateOnAxis( xAxis, angle);
 spotlight.position = object.position;
}

function addLightSource(){
	
	//local offset for adding lightsource to object
	var lx = 6.7;
	var ly = 9.4;
	var lz = -1.7;
	
	//spotlight = new THREE.SpotLight( 0xffffff );
	spotlight = new THREE.PointLight(0xffff99, 5, 10 );
	spotlight.shadowCameraVisible = true;
	spotlight.shadowDarkness = 0.95;
	
	spotlight.castShadow = true;
	spotlight.position.set(lx,ly,lz);

	var pointLightHelper = new THREE.PointLightHelper( spotlight , 1);
	scene.add( pointLightHelper );
	
}

function addObject(){
	
TLloader = new THREE.JSONLoader();


TLloader.load( '../Prototypes/TischLampe/TischLampeBottom.json', function ( geometry, materials ) {
    lampeB= new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
    lampeB.position.set(px,py,pz);
	lampeB.scale.set(sx,sy,sz);
	scene.add(lampeB);
});



TLloader.load( '../Prototypes/TischLampe/TischLampeTop.json', function ( geometry, materials ) {
	
    lampeT= new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
    lampeT.position.set(px,py,pz);
    lampeT.scale.set(sx,sy,sz);
	lampeT.add(spotlight);
	scene.add(lampeT);
});

}

function addTischLampe(ax,ay,az,bx,by,bz){
	px = ax;
	py = ay;
	pz = az;
	//scale
	sx = bx;
	sy = by;
	sz = bz;

	addObject();
	addLightSource();
}




