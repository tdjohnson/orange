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

// Track when pointer lock was last exited to prevent immediate re-lock
let lastPointerLockExitTime = 0;
const POINTER_LOCK_COOLDOWN_MS = 200;

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
	lastPointerLockExitTime = 0;
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
				// Reset cooldown when pointer lock is successfully acquired
				lastPointerLockExitTime = 0;
			} else {
				if (currentControls) {
					currentControls.enabled = false;
				}
				// Record when pointer lock was exited
				lastPointerLockExitTime = Date.now();
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
			// Don't request pointer lock if menu is blocking it
			if (window.menuBlockingPointerLock) {
				return;
			}
			
			// Don't request pointer lock immediately after exiting it (browser blocks this)
			const now = Date.now();
			if (now - lastPointerLockExitTime < POINTER_LOCK_COOLDOWN_MS) {
				return;
			}
			
			element.requestPointerLock = element.requestPointerLock || 
				element.mozRequestPointerLock || 
				element.webkitRequestPointerLock;
			
			// Wrap in try-catch to handle any security errors gracefully
			try {
				element.requestPointerLock();
			} catch (e) {
				console.log('Pointer lock request failed (will retry on next click):', e.message);
			}
		};

		element.addEventListener('click', clickHandler, false);
		
	} else {
		console.warn('Browser does not support pointer lock');
	}
}
