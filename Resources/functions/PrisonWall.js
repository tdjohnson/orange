function PrisonWall()
{
	THREE.Object3D.call( this );
		this.scale.x  = this.scale.z = 100;
		this.scale.y = 12;
		this.castShadow = false;
		this.name = "JailBotBody";
		this.userData.info = "you shall not pass!";
		this.userData.rotatable = false;
		
		var scope = this;
		meshloader( '../Prototypes/Schutzmauer/wall.json',function(model) {scope.add(model);});
}

PrisonWall.prototype = Object.create(THREE.Object3D.prototype);
PrisonWall.prototype.constructor = PrisonWall;