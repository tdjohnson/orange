export function checkForPointerLock() {
	return 'pointerLockElement' in document || 
		'mozPointerLockElement' in document || 
		'webkitPointerLockElement' in document;
}

export function initPointerLock(havePointerLock) {
	let controlsEnabled = false;
	const element = document.body;
	
	if (havePointerLock) {
		const pointerlockchange = function(event) {
			if (document.pointerLockElement === element || 
				document.mozPointerLockElement === element || 
				document.webkitPointerLockElement === element) {
				controlsEnabled = true;
				if (typeof controls !== 'undefined' && controls) {
					controls.enabled = true;
				}
			} else {
				if (typeof controls !== 'undefined' && controls) {
					controls.enabled = false;
				}
			}
		};

		const pointerlockerror = function(event) {
			console.error('PointerLock Error:', event);
		};

		document.addEventListener('pointerlockchange', pointerlockchange, false);
		document.addEventListener('mozpointerlockchange', pointerlockchange, false);
		document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
		
		document.addEventListener('pointerlockerror', pointerlockerror, false);
		document.addEventListener('mozpointerlockerror', pointerlockerror, false);
		document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

		const requestPointerLock = function(event) {
			element.requestPointerLock = element.requestPointerLock || 
				element.mozRequestPointerLock || 
				element.webkitRequestPointerLock;
			element.requestPointerLock();
		};

		element.addEventListener('click', requestPointerLock, false);
		
	} else {
		console.warn('Browser does not support pointer lock');
	}
}
