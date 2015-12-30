
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
  var klo, tuer1, tuer2, boden, bett, zelle, buch, lampe;

  //animate();

  function init() {
    initControls();
    initPointerLock();

    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xb2e1f2, 0, 750);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 0;

    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());

    //objects
    var light = new THREE.PointLight(0xffffff);
	light.position.y = 3;
	light.position.z = 4;
	scene.add(light);
	
	var light2 = new THREE.HemisphereLight(0xffffff, 0.6);
	light.position.x = 5;
	light.position.y = 3;
	light.position.z = 4;
	scene.add(light2);
   	
	loadKlo();
	loadDoor1();
	loadDoor2();
	loadFloor();
	loadBett();
	loadBuch();
	loadLampe();
	//loadZelle();

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xb2e1f2);

    document.body.appendChild(renderer.domElement);
    animate();
  }

  function animate() {
    requestAnimationFrame(animate);
    updateControls();
    renderer.render(scene, camera);
  }
  
   
function loadZelle()
{
	loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
	var path = "../../Resources/Models/zelle_wandtextur.dae";
    loader.load(path, function(geometry) {
        zelle = geometry.scene;
        zelle.castShadow = true;
        zelle.updateMatrix();
        scene.add(zelle);
    });
}

function loadKlo()
{
	/*
	loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
	var path = "../../Resources/Models/klo.dae";
    loader.load(path, function(geometry) {
        klo = geometry.scene;
        klo.position.z = -15;
        klo.position.x = -10;
        klo.castShadow = true;
        klo.updateMatrix();
        scene.add(klo);
    });*/
   try {
   var loader = new THREE.JSONLoader();
	loader.load( '../../Resources/Models/klo.json', function ( geometry, materials ) {
		var material = new THREE.MeshPhongMaterial( materials );
	    klo = new THREE.Mesh( geometry, material );
	    klo.position.z = -15;
        klo.position.x = -10;
	    scene.add(klo);
	});
	
	} catch (e) {
		alert(e);
	}
}

function loadFloor()
{
	/*
	loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
	var path = "../../Resources/Models/boden.dae";
    loader.load(path, function(geometry) {
        boden = geometry.scene;
        boden.receiveShadow = true;
        boden.position.x = -6;
        boden.position.z = -8;
        boden.position.y = -0.3;
        scene.add(boden);
    });*/
    var loader = new THREE.JSONLoader();
	loader.load( '../../Resources/Models/boden.json', function ( geometry, materials ) {
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
	loader.load( '../../Resources/Models/buch_neu_comb.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    buch = new THREE.Mesh( geometry, material );
        buch.position.y = 2;
        buch.scale.x = buch.scale.y = buch.scale.z = 0.3;
	    scene.add(buch);
	});
}

function loadLampe()
{
	var loader = new THREE.JSONLoader();
	loader.load( '../../Resources/Models/TischLampe.json', function ( geometry, materials ) {
		var material = new THREE.MeshFaceMaterial( materials );
	    lampe = new THREE.Mesh( geometry, material );
        lampe.position.x = 2;
        lampe.scale.x = lampe.scale.y = lampe.scale.z = 0.3;
	    scene.add(lampe);
	});
}

function loadBett()
{
	loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
	var path = "../../Resources/Models/bett.dae";
    loader.load(path, function(geometry) {
        bett = geometry.scene;
        bett.castShadow = true;
        bett.rotation.y = 5;
        bett.position.z = -15;
        bett.scale.x = bett.scale.y = bett.scale.z = 1.5;
        bett.updateMatrix();
        scene.add(bett);
    });
}

function loadDoor1()
{
	loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
	var path = "../../Resources/Models/tuer1.dae";
    loader.load(path, function(geometry) {
        tuer1 = geometry.scene;
        tuer1.position.z = 5;
        tuer1.position.x = 3;
        tuer1.position.y = 3.8;
        tuer1.scale.y = 1.5;
        tuer1.castShadow = true;
        tuer1.updateMatrix();
        scene.add(tuer1);
    });
}
function loadDoor2() {
	loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
    var path = "../../Resources/Models/tuer2.dae";
    loader.load(path, function(geometry) {
        tuer2 = geometry.scene;
        tuer2.position.x = -3;
        tuer2.position.z = 5;
        tuer2.position.y = 3.8;
        tuer2.castShadow = true;
        tuer2.scale.y = 1.5;
        tuer2.updateMatrix();
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