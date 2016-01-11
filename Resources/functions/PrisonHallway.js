function Hallway()
{
	THREE.Object3D.call( this );

	var wall = new Wall();
	wall.position.set(0.4,4.7,21);
	this.add(wall);
	
	var ceiling = new Ceiling();
	ceiling.position.set(24,8.5,21.4);
	this.add(ceiling);
	
	var floor = new Floor();
	floor.position.set(24,0.1,21.3);
	this.add(floor);

        
    var wallDoor = new WallDoor();
	wallDoor.position.set(46,0,27.3);
	this.add(wallDoor);
	
	var ceilingLamp = new CeilingLamp();
	ceilingLamp.position.set(10,8.5,21);
	ceilingLamp.rotation.x = Math.PI;
	this.add(ceilingLamp);
	
	var ceilingLamp2 = ceilingLamp.clone();
	ceilingLamp2.position.set(25,8.5,21);
	this.add(ceilingLamp2);
	
	var ceilingLamp3 = ceilingLamp.clone();
	ceilingLamp3.position.set(35,8.5,21);
	this.add(ceilingLamp3);
	generateLamps();	
	
}
Hallway.prototype = Object.create(THREE.Object3D.prototype);
Hallway.prototype.constructor = Hallway;