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
	ceilingLamp.position.set(10,9,22);
	ceilingLamp.rotation.x = Math.PI;
	this.add(ceilingLamp);
	
	this.add(object);
}
Hallway.prototype = new THREE.Object3D();
Hallway.prototype.constructor = Hallway;