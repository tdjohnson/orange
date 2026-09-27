/**
 * Orange Game Loader
 * This script MUST be loaded BEFORE main.js in your HTML.
 * 
 * Required HTML setup:
 * <script src="loader.js"></script>
 * <script type="module" src="main.js"></script>
 * 
 * This ensures all game functions are available immediately,
 * even before main.js finishes loading.
 */

// Track if main.js has been loaded
window._orangeMainLoaded = false;

// Queue of pending calls to be executed once main.js is loaded
window._orangePendingCalls = [];

// Function to execute pending calls
function _executePendingCalls() {
    if (window._orangeMainLoaded && window._orangePendingCalls.length > 0) {
        const calls = window._orangePendingCalls.splice(0);
        calls.forEach(call => {
            const func = window[call.funcName];
            if (func && func._real) {
                func._real(...call.args);
            } else if (func) {
                func(...call.args);
            }
        });
    }
}

// Create a stub generator that queues calls
function _createStub(funcName) {
    return function() {
        // Queue this call
        window._orangePendingCalls.push({
            funcName: funcName,
            args: arguments
        });
        
        // Try to execute immediately if main.js has already loaded
        setTimeout(_executePendingCalls, 0);
    };
}

// Define all game functions as stubs in global scope
window.startSingleplayer = _createStub('startSingleplayer');
window.startMultiplayer = _createStub('startMultiplayer');
window.startMultiplayerWithName = _createStub('startMultiplayerWithName');
window.init = _createStub('init');
window.showBustedMessage = _createStub('showBustedMessage');
window.takeDamage = _createStub('takeDamage');
window.handleDefeated = _createStub('handleDefeated');
window.handleServerScores = _createStub('handleServerScores');
window.handleScores = _createStub('handleScores');
window.handleScoresRequest = _createStub('handleScoresRequest');
window.chooseSession = _createStub('chooseSession');
window.setQualityMode = _createStub('setQualityMode');
window.events2main = _createStub('events2main');
window.handleSessionDefeat = _createStub('handleSessionDefeat');
window.handleKillFeed = _createStub('handleKillFeed');

// Check periodically if main.js has loaded by testing for _real properties
const replaceStubInterval = setInterval(() => {
    const realFunctions = [
        'startSingleplayer', 'startMultiplayer', 'startMultiplayerWithName',
        'init', 'showBustedMessage', 'takeDamage', 'handleDefeated',
        'handleServerScores', 'handleScores', 'handleScoresRequest',
        'chooseSession', 'setQualityMode', 'events2main',
        'handleSessionDefeat', 'handleKillFeed'
    ];
    
    const allLoaded = realFunctions.every(funcName => {
        const func = window[funcName];
        return func && func._real;
    });
    
    if (allLoaded) {
        window._orangeMainLoaded = true;
        clearInterval(replaceStubInterval);
        _executePendingCalls();
    }
}, 100);

// Clean up after a reasonable time (10 seconds)
setTimeout(() => {
    clearInterval(replaceStubInterval);
}, 10000);
