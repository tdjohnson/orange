
  var clock;
  var scene, camera, renderer;
  var geometry, material, mesh;
  var havePointerLock = checkForPointerLock();
  var controls, controlsEnabled;
  var moveForward,
      moveBackward,
      moveLeft,
      moveRight,
      canJump;
  var velocity = new THREE.Vector3();
  var loader;
  var klo, tuer1, tuer2, boden, bett, zelle, buch, lampe, luefter, seife;
  var raycaster = new THREE.Raycaster();
  var arrow;

  //animate();

  function init() {
    initControls();
    initPointerLock();

    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xb2e1f2, 0, 750);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

	//camera.position.x = 5;
	//camera.position.y = -2;
	//camera.position.z = 40;
    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());


    //objects
    var light = new THREE.PointLight(0xffffff);
	light.position.y = 3;
	light.position.z = 4;
	scene.add(light);
	
	var light2 = new THREE.HemisphereLight(0xffffff, 0.1);
	light.position.x = 5;
	light.position.y = 3;
	light.position.z = 4;
	//scene.add(light2);
   	
	loadKlo();
	loadDoor1();
	loadDoor2();
	//loadFloor();
	loadBett();
	loadBuch();
	loadLampe();
	loadZelle();
	loadLuefter();
	loadSeife();

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xb2e1f2);

    document.body.appendChild(renderer.domElement);
    animate();
  }




	function raycast() {
		raycaster.set(camera.getWorldPosition(),camera.getWorldDirection());	
		
		//Raycaster helper - displays raycaster as vector
		//scene.remove (arrow);
		//arrow = new THREE.ArrowHelper( camera.getWorldDirection(), camera.getWorldPosition(), 100, 0x00ffff );
		//scene.add( arrow );

		var intersects = raycaster.intersectObjects( scene.children );

			for ( var i = 0; i < intersects.length; i++ ) {
				try{
					if(intersects[i].object.name.length >= 1 && intersects[i].distance <= 5){
						console.log( intersects[i].object.name + ": distance:" + intersects[i].distance );
						if(intersects[i].object.userData.info.length >=1){
						  $( "#dialog" ).innerHTML = intersects[i].object.userData.info;
						  $( "#dialog" ).dialog();
						}
					}
					}catch(err){
					}
				}
		}

  function animate() {
  	
	raycast();
			
    requestAnimationFrame(animate);
    updateControls();
    renderer.render(scene, camera);
        camera.updateProjectionMatrix();
 
  }
  
function loadZelle()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Zelle/Zelle.json', function ( geometry, materials ) {
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
   try {
   var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Klo/klo.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    klo = new THREE.Mesh( geometry, material );
	    klo.rotation.y =  Math.PI*0.5;
	    klo.position.z = 5;
        klo.position.x = 2.5;
        klo.castShadow = true;
        klo.name = "klo";
	    scene.add(klo);

	});
	
	} catch (e) {
		alert(e);
	}
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
        buch.name = "buch";
	    scene.add(buch);

	});
}

function loadSeife()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../Prototypes/Seife/seife.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    seife = new THREE.Mesh( geometry, material );
        seife.position.y = 2;
        seife.position.x = 2;
        seife.position.z = 10;
        seife.castShadow = true;
        seife.scale.x = seife.scale.y = seife.scale.z = 0.3;
        seife.name = "seife";
	    scene.add(seife);
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
        luefter.name = "luefter";
	    scene.add(luefter);

	});
}

function loadLampe()
{
 	addTischLampe(10.3,0,10.9,0.1,0.1,0.1);
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
        bett.name = "bett";
	    scene.add(bett);

	});
}

function loadDoor1()
{
	loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
	var path = "../Prototypes/Tuer/tuer1.dae";
    loader.load(path, function(geometry) {
        tuer1 = geometry.scene;
        tuer1.position.z = 14.8;
        tuer1.position.x = 4;
        tuer1.position.y = 3.8;
        tuer1.scale.y = 1.4;
        tuer1.castShadow = true;
        tuer1.updateMatrix();
        tuer1.name = "tuer1";
        scene.add(tuer1);

    });
}
function loadDoor2() {

    var loader = new THREE.JSONLoader();
	loader.load( "../Prototypes/Tuer/tuer2.json", function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    tuer2 = new THREE.Mesh( geometry, material );
        tuer2.position.x = 8;
        tuer2.position.z = 14.8;
        tuer2.position.y = 3.8;
        tuer2.castShadow = true;
        tuer2.scale.y = 1.4;
        tuer2.updateMatrix();
        tuer2.name = "tuer2";
        scene.add(tuer2);

	});
}

  function checkForPointerLock() {
    return 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
  }
  
  function initPointerLock() {
    var element = document.body;
    if (havePointerLock) {
      var pointerlockchange = function (event) {
        if (document.pointerLockElement === element || 
            document.mozPointerLockElement === element || 
            document.webkitPointerLockElement === element) {
          controlsEnabled = true;
          controls.enabled = true;
        } else {
          controls.enabled = false;
        }
      };

      var pointerlockerror = function (event) {
        element.innerHTML = 'PointerLock Error';
      };

      document.addEventListener('pointerlockchange', pointerlockchange, false);
      document.addEventListener('mozpointerlockchange', pointerlockchange, false);
      document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

      document.addEventListener('pointerlockerror', pointerlockerror, false);
      document.addEventListener('mozpointerlockerror', pointerlockerror, false);
      document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

      var requestPointerLock = function(event) {
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        element.requestPointerLock();
      };

      element.addEventListener('click', requestPointerLock, false);
    } else {
      element.innerHTML = 'Bad browser; No pointer lock';
    }
  }
  
  function onKeyDown(e) {
    switch (e.keyCode) {
      case 38: // up
      case 87: // w
        moveForward = true;
        break;
      case 37: // left
      case 65: // a
        moveLeft = true; 
        break;
         case 81: // q
   		rotate(lampeT,Math.PI/90 ); 
        break;
      case 69: // e
		 rotate(lampeT,Math.PI/90 * -1  ); 
        break;
      case 40: // down
      case 83: // s
        moveBackward = true;
        break;
      case 39: // right
      case 68: // d
        moveRight = true;
        break;
      case 32: // space
        if (canJump === true) velocity.y += 50;
        canJump = false;
        break;
    }
  }

  function onKeyUp(e) {
    switch(e.keyCode) {
      case 38: // up
      case 87: // w
        moveForward = false;
        break;
      case 37: // left
      case 65: // a
        moveLeft = false;
        break;
      case 40: // down
      case 83: // s
        moveBackward = false;
        break;
      case 39: // right
      case 68: // d
        moveRight = false;
        break;
    }
  }

  function initControls() {
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
  }

  function updateControls() {
    if (controlsEnabled) {
      var delta = clock.getDelta();
      var walkingSpeed = 100.0;

      velocity.x -= velocity.x * 10.0 * delta;
      velocity.z -= velocity.z * 10.0 * delta;
      velocity.y -= 9.8 * 30.0 * delta;

      if (moveForward) velocity.z -= walkingSpeed * delta;
      if (moveBackward) velocity.z += walkingSpeed * delta;

      if (moveLeft) velocity.x -= walkingSpeed * delta;
      if (moveRight) velocity.x += walkingSpeed * delta;


      controls.getObject().translateX(velocity.x * delta);
      controls.getObject().translateY(velocity.y * delta);
      controls.getObject().translateZ(velocity.z * delta);

      if (controls.getObject().position.y < 4) {
        velocity.y = 0;
        controls.getObject().position.y = 4;
        canJump = true;
      }
    }
  }