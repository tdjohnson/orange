function PrisonWall()
{
	THREE.Object3D.call( this );
	//this.castShadow = true;
	this.name = "JailBotBody";
	this.userData.info = "you shall not pass!";
	this.scale.x = this.scale.y = 4;
	var scope = this;
	meshloader( '../Prototypes/Schutzmauer/wall.json',function(model) {scope.add(model);});
}

PrisonWall.prototype = Object.create(THREE.Object3D.prototype);