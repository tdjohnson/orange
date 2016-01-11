function PrisonWall()
{
	THREE.Object3D.call( this );
	var object = new THREE.Object3D();
	loader = new THREE.JSONLoader();
	
	
	this.add(object);
}
PrisonWall.prototype = new THREE.Object3D();
HallPrisonWallway.prototype.constructor = PrisonWall;