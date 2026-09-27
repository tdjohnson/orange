export function checkForPointerLock() {
	return 'pointerLockElement' in document || 
		'mozPointerLockElement' in document || 
		'webkitPointerLockElement' in document;
}

// Store references to clean up event listeners
let currentControls = null;
let pointerlockchangeHandler = null;
let pointerlockerrorHandler = null;
let clickHandler = null;

export function cleanupPointerLock() {
	if (pointerlockchangeHandler) {
		document.removeEventListener('pointerlockchange', pointerlockchangeHandler, false);
		document.removeEventListener('mozpointerlockchange', pointerlockchangeHandler, false);
		document.removeEventListener('webkitpointerlockchange', pointerlockchangeHandler, false);
		pointerlockchangeHandler = null;
	}
	if (pointerlockerrorHandler) {
		document.removeEventListener('pointerlockerror', pointerlockerrorHandler, false);
		document.removeEventListener('mozpointerlockerror', pointerlockerrorHandler, false);
		document.removeEventListener('webkitpointerlockerror', pointerlockerrorHandler, false);
		pointerlockerrorHandler = null;
	}
	if (clickHandler) {
		document.body.removeEventListener('click', clickHandler, false);
		clickHandler = null;
	}
	currentControls = null;
}

export function initPointerLock(havePointerLock, controls) {
	// Clean up any existing listeners
	cleanupPointerLock();
	
	currentControls = controls;
	const element = document.body;
	
	if (havePointerLock) {
		pointerlockchangeHandler = function(event) {
			if (document.pointerLockElement === element || 
				document.mozPointerLockElement === element || 
				document.webkitPointerLockElement === element) {
				if (currentControls) {
					currentControls.enabled = true;
				}
			} else {
				if (currentControls) {
					currentControls.enabled = false;
				}
			}
		};

		pointerlockerrorHandler = function(event) {
			console.error('PointerLock Error:', event);
		};

		document.addEventListener('pointerlockchange', pointerlockchangeHandler, false);
		document.addEventListener('mozpointerlockchange', pointerlockchangeHandler, false);
		document.addEventListener('webkitpointerlockchange', pointerlockchangeHandler, false);
		
		document.addEventListener('pointerlockerror', pointerlockerrorHandler, false);
		document.addEventListener('mozpointerlockerror', pointerlockerrorHandler, false);
		document.addEventListener('webkitpointerlockerror', pointerlockerrorHandler, false);

		clickHandler = function(event) {
			element.requestPointerLock = element.requestPointerLock || 
				element.mozRequestPointerLock || 
				element.webkitRequestPointerLock;
			element.requestPointerLock();
		};

		element.addEventListener('click', clickHandler, false);
		
	} else {
		console.warn('Browser does not support pointer lock');
	}
}
