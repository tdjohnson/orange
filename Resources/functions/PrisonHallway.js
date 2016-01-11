function Hallway()
{
	THREE.Object3D.call( this );

	var wall = new Wall();
	wall.position.set(0.4,4.3,-0.2);
	this.add(wall);	
	
	var ceiling = new Ceiling();
	ceiling.position.set(23.2,8.5,0);
	this.add(ceiling);
	
	var floor = new Floor();
	floor.position.set(23.1,0,-0.2);
	this.add(floor);

        
    var wallDoor = new WallDoor();
	wallDoor.position.set(46,0,6);
	this.add(wallDoor);
	
	var ceilingLamp = new CeilingLamp();
	ceilingLamp.position.set(10,8.5,0);
	ceilingLamp.rotation.x = Math.PI;
	this.add(ceilingLamp);
	
	var ceilingLamp2 = ceilingLamp.clone();
	ceilingLamp2.position.set(25,8.5,0);
	this.add(ceilingLamp2);
	
	var ceilingLamp3 = ceilingLamp.clone();
	ceilingLamp3.position.set(35,8.5,0);
	this.add(ceilingLamp3);
	generateLamps();	
	
}
Hallway.prototype = Object.create(THREE.Object3D.prototype);
Hallway.prototype.constructor = Hallway;