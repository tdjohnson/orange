function PrisonCell()
{
	THREE.Object3D.call( this );

	
	this.name = 'PrisonCell_' + this.id;
	
	var wallCell1 = new WallCell1();
	wallCell1.position.set(0.3,0,0.6);
	wallCell1.rotation.y = Math.PI*-0.5;
	this.add(wallCell1);
	
	var floorCell = new FloorCell();
	floorCell.position.set(0,0,0);
	floorCell.rotation.y = Math.PI/-2;
	this.add(floorCell);
	
	var wallCell2 = new WallCell2();
	wallCell2.position.set(4.8,0,0.6);
	wallCell2.rotation.y = Math.PI*-0.5;
	this.add(wallCell2);
	
	var wallCellWindow = new WallCellWindow();
	wallCellWindow.position.set(0.1,0,0.6);
	wallCellWindow.rotation.y = Math.PI*-0.5;
	this.add(wallCellWindow);
	
	var wallCellDoor = new WallCellDoor();
	wallCellDoor.position.set(0,0,6.4);
	wallCellDoor.scale.z = 3.7;
	wallCellDoor.scale.y = 3.4;
	wallCellDoor.scale.x = 2;
	wallCellDoor.rotation.y = Math.PI*-0.5;;
	this.add(wallCellDoor);
	
	var wallCellDoorCol1 = new WallCellDoorCol1();
	wallCellDoorCol1.position.set(0,0,6.4);
	wallCellDoorCol1.scale.z = 3.7;
	wallCellDoorCol1.scale.y = 3.4;
	wallCellDoorCol1.scale.x = 2;
	wallCellDoorCol1.rotation.y = Math.PI*-0.5;
	wallCellDoorCol1.visible = false;
	this.add(wallCellDoorCol1);
	
	var wallCellDoorCol2 = new WallCellDoorCol2();
	wallCellDoorCol2.position.set(0,0,6.4);
	wallCellDoorCol2.scale.z = 3.7;
	wallCellDoorCol2.scale.y = 3.4;
	wallCellDoorCol2.scale.x = 2;
	wallCellDoorCol2.rotation.y = Math.PI*-0.5;;
	wallCellDoorCol2.visible = false;
	this.add(wallCellDoorCol2);
	
	var ceilingCell = new CeilingCell();
	ceilingCell.position.set(11.5,5.5,16);
	this.add(ceilingCell);

	
	var soap = new Soap();
	soap.position.set(0.85,2.5,12.2);
	this.add(soap);
	
	var toilet = new Toilet();
	toilet.position.set(2.5,0,5);
	toilet.rotation.y =  Math.PI*0.5;
	this.add(toilet);
	
	var sink = new Sink();
	sink.position.set(1.25,2.5,13);
	sink.rotation.y = Math.PI*0.5;
	this.add(sink);
	
	var book = new Book();
	book.position.set(10,2.2,11.5);
	book.rotation.y =  Math.PI/180*90;
	this.add(book);
	
	var table = new Table();
	table.position.set(10,0,13.5);
	table.rotation.y =  Math.PI/180*90;
	this.add(table);
	
	var chair = new Chair();
	chair.position.set(8.5,-0.5, 10);
	chair.rotation.y =  Math.PI/180*-90;
	this.add(chair);
	
	var radiator = new Radiator();
	radiator.position.set(1,5.6,9.9);
	radiator.rotation.y =  Math.PI/180*90;
	this.add(radiator);
	
	var tablelamp = new TableLamp();
	tablelamp.position.set(10.3,2.2,9.7);
	tablelamp.rotation.y =  Math.PI;
	this.add(tablelamp);
	
	
	var bed = new Bed();
	bed.position.set(9,0,5);
	bed.rotation.y =  Math.PI;
	this.add(bed);
	
	var door1 = new Door1();
	door1.position.set(4.8,3.8,15.3);
	this.add(door1);
	
	var door2 = new Door2();
	door2.position.set(8.5,3.8,14.9);
	door2.userData.startPosition = door2.position.x; 
	this.add(door2);
	
	var mirror = new Mirror();
	mirror.position.set(0.8,4,13);
	mirror.rotation.y =  Math.PI/180*90;
	this.add(mirror);


}
PrisonCell.prototype = new THREE.Object3D();