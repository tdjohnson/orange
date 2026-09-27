/**
 * Loading Screen Module
 * Handles the loading screen display and progress bar
 */

import * as THREE from 'three';

// Track loading state
let loadDone = false;
let loadingOverlay = null;

/**
 * Shows the loading screen with progress bar
 */
export function showLoadingScreen() {
	// Remove existing loading screen if any
	hideLoadingScreen();
	
	loadingOverlay = document.createElement('div');
	loadingOverlay.id = 'loadingOverlay';
	loadingOverlay.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		z-index: 10000;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: white;
		font-family: Arial, sans-serif;
		padding: 0;
		margin: 0;
	`;
	
	const loadingTitle = document.createElement('h2');
	loadingTitle.textContent = 'Loading game...';
	loadingTitle.style.position = 'relative';
	loadingTitle.style.padding = '0';
	loadingTitle.style.margin = '0 0 20px 0';
	
	const loadingContainer = document.createElement('div');
	loadingContainer.style.position = 'relative';
	loadingContainer.style.padding = '0';
	loadingContainer.style.margin = '0';
	loadingContainer.style.width = '90%';
	loadingContainer.style.maxWidth = '800px';
	loadingContainer.style.textAlign = 'center';
	
	// Progress bar container - using same dimensions as health bar (180px width, 12px height)
	const progressBarContainer = document.createElement('div');
	progressBarContainer.id = 'loadingProgressBarContainer';
	progressBarContainer.style.position = 'relative';
	progressBarContainer.style.padding = '0';
	progressBarContainer.style.margin = '0';
	progressBarContainer.style.width = '180px';
	progressBarContainer.style.height = '12px';
	progressBarContainer.style.background = 'rgba(0, 0, 0, 0.55)';
	progressBarContainer.style.border = '1px solid rgba(255, 255, 255, 0.35)';
	progressBarContainer.style.borderRadius = '2px';
	progressBarContainer.style.margin = '0 auto 10px';
	progressBarContainer.style.overflow = 'hidden';
	
	const progressBarFill = document.createElement('div');
	progressBarFill.id = 'loadingProgressBar';
	progressBarFill.style.position = 'relative';
	progressBarFill.style.padding = '0';
	progressBarFill.style.margin = '0';
	progressBarFill.style.width = '0%';
	progressBarFill.style.height = '100%';
	progressBarFill.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
	progressBarFill.style.borderRadius = '2px';
	progressBarFill.style.transition = 'width 0.3s ease';
	
	const loadedItemText = document.createElement('div');
	loadedItemText.id = 'loadingItemText';
	loadedItemText.textContent = 'Preparing...';
	loadedItemText.style.position = 'relative';
	loadedItemText.style.padding = '0';
	loadedItemText.style.margin = '0';
	loadedItemText.style.fontSize = '14px';
	loadedItemText.style.color = '#ccc';
	
	const progressText = document.createElement('div');
	progressText.id = 'loadingProgressText';
	progressText.textContent = '0%';
	progressText.style.position = 'relative';
	progressText.style.padding = '0';
	progressText.style.margin = '0';
	progressText.style.fontSize = '12px';
	progressText.style.color = '#aaa';
	
	progressBarContainer.appendChild(progressBarFill);
	loadingContainer.appendChild(loadingTitle);
	loadingContainer.appendChild(progressBarContainer);
	loadingContainer.appendChild(loadedItemText);
	loadingContainer.appendChild(progressText);
	loadingOverlay.appendChild(loadingContainer);
	
	document.body.appendChild(loadingOverlay);
	
	// Center the loading overlay
	loadingOverlay.style.display = 'flex';
}

/**
 * Hides the loading screen
 */
export function hideLoadingScreen() {
	if (loadingOverlay) {
		loadingOverlay.remove();
		loadingOverlay = null;
	}
	// Also remove by ID in case reference was lost
	const existing = document.getElementById('loadingOverlay');
	if (existing) {
		existing.remove();
	}
}

/**
 * Sets up the THREE.js loading manager to update progress
 */
export function setupLoadingManager() {
	// Only set up once
	if (THREE && THREE.DefaultLoadingManager) {
		const manager = THREE.DefaultLoadingManager;
		
		// Check if already set up by checking for our custom onProgress handler
		if (manager._loadingScreenSetup) {
			return;
		}
		manager._loadingScreenSetup = true;
		
		manager.onStart = function(url, loaded, total) {
			console.log('Loading started: ' + url);
			updateLoadingProgress(loaded, total, url.split('/').pop().split('?')[0]);
		};
		
		manager.onProgress = function(url, loaded, total) {
			updateLoadingProgress(loaded, total, url.split('/').pop().split('?')[0]);
		};
		
		manager.onLoad = function() {
			loadDone = true;
			// Slight delay to ensure everything is ready
			setTimeout(() => {
				hideLoadingScreen();
				console.log('All assets loaded');
			}, 300);
		};
		
		manager.onError = function(url) {
			console.error('Error loading: ' + url);
			updateLoadingProgress(0, 0, 'Error loading: ' + url.split('/').pop());
		};
	}
}

/**
 * Updates the loading progress bar and text
 * @param {number} loaded - Number of items loaded
 * @param {number} total - Total number of items to load
 * @param {string} itemName - Name of the current item being loaded
 */
export function updateLoadingProgress(loaded, total, itemName) {
	const progressBar = document.getElementById('loadingProgressBar');
	const progressText = document.getElementById('loadingProgressText');
	const itemText = document.getElementById('loadingItemText');
	
	if (progressBar && total > 0) {
		const percent = Math.floor((loaded / total) * 100);
		progressBar.style.width = percent + '%';
		if (progressText) {
			progressText.textContent = percent + '%';
		}
	}
	
	if (itemText && itemName) {
		itemText.textContent = 'Loading: ' + itemName;
	}
}

/**
 * Gets the current loading state
 * @returns {boolean} True if loading is done
 */
export function isLoadDone() {
	return loadDone;
}

/**
 * Resets the loading state
 */
export function resetLoadingState() {
	loadDone = false;
}
