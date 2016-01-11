function checkForPointerLock() {
    return 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
}
var cloned = false;
  
function initPointerLock() {
	var element = document.body;
    if (havePointerLock) {
    	var pointerlockchange = function (event) {
        if (document.pointerLockElement === element || 
            document.mozPointerLockElement === element || 
            document.webkitPointerLockElement === element) {
		          controlsEnabled = true;
		          controls.enabled = true;
		          if (!cloned) {
		          	cloning(4);
		          	cloned = true;
		          	toWakeUp = true;
		          }
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