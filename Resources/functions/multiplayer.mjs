import * as THREE from 'three';
import * as signalR from 'signalR';
import * as UMPS from 'umps';
import * as objectsModule from './objects.mjs';
import * as bulletControl from './bulletControl.mjs';
import { orangeSessions } from './sessions.mjs';

const serverTickinMS = 20; //Only every x Milliseconds will the client report its position to server, so server is not flooded with messages
var lastServerSync = 0;
const idleCheckInterval = 1000;
const idleThreshold = 1;
const idleTimeout = 5000;
var lastMovementTime = 0;
var lastPosition = new THREE.Vector3();
var lastDirection = new THREE.Vector3();


const roundVector = (v) => new THREE.Vector3(
    Math.round(v.x * 1000) / 1000,
    Math.round(v.y * 1000) / 1000,
    Math.round(v.z * 1000) / 1000
);

export class Multiplayer extends THREE.Mesh {
     constructor(renderer, collidableMeshList, scene, player_name, selected_server) {
        super();
        this.umps = new UMPS.UMPS(selected_server);
		this.name = player_name;
        this.renderer = renderer;
        this.collidableMeshList = collidableMeshList;
        this.scene = scene;
        this.playerBody = new objectsModule.JailBotBody(renderer);
        this.playerId = this.umps.GetPlayerId();
        this.playerName = this.umps.SetPlayerName(this.playerId, player_name);
        this.players = [];
        this.pendingPlayers = new Set();
        this.session = null;        // {id, name, endsAtLocal} while in a session
        this.sessionTimer = null;
        this.lastHitBy = null;      // player id of the last hit we took, for kill credit
        this.lastHitAt = 0;
        // REST base of the selected server, e.g. https://umps.tdj23.com (hub url minus /controlhub)
        this.serverBaseUrl = String(selected_server || '').replace(/\/controlhub\/?$/, '');

    }
    
    init() {

        // handle player position messages
        this.umps.hub.on("ReceiveData", (player) => {
            if (player.id === this.playerId) return;

            const existingPlayer = this.players.find(p => p.id === player.id);
            if (existingPlayer) {
                this.updatePlayer(existingPlayer, player);
            } else if (!this.pendingPlayers.has(player.id)) {
                // addNewPlayer is asynchronous (name lookup); without this guard every position
                // update that arrives meanwhile creates another body for the same player
                this.pendingPlayers.add(player.id);
                this.addNewPlayer(player);
            }
        });

        // handle event messages
        this.umps.hub.on("ReceiveEvent", (event) => {
            if (event.type === "hit"){
                if (event.destination === this.playerId){
                    console.log("You got hit!");
                    this.lastHitBy = event.source;
                    this.lastHitAt = performance.now();
                    if (typeof window.takeDamage === 'function') {
                        window.takeDamage(10);
                    }
                } else {
                    // Remote player was hit, update their health
                    const player = this.players.find(p => p.id === event.destination);
                    if (player) {
                        player.health = Math.max(0, (player.health ?? 100) - 10);
                        this.updateHealthBar(player);
                        
                        // If health reaches zero, flip the player
                        if (player.health <= 0) {
                            player.body.rotation.x = Math.PI;
                        }
                    }
                }
            } else if (event.type === "bullet") {
                // Remote player fired a bullet
                if (event.source !== this.playerId) {
                    // Parse bullet data from JSON string
                    try {
                        const bulletData = JSON.parse(event.destination);
                        bulletControl.addRemoteBullet(this.renderer, bulletData);
                    } catch (e) {
                        console.error("Failed to parse bullet data:", e);
                    }
                }
            } else if (event.type === "defeated") {
                // A player was defeated
                if (event.source !== this.playerId) {
                    if (typeof window.handleDefeated === 'function') {
                        // event.destination is the player name, or JSON {name, by} on servers with sessions
                        window.handleDefeated(this.parseDefeated(event.destination).name);
                    }
                }
				} else if (event.type === "healthReset") {
					// A player was respawning, reset their health and rotation
					const player = this.players.find(p => p.name === event.destination);
					if (player) {
						player.health = 100;
						player.body.rotation.x = 0;
						this.updateHealthBar(player);
					}
				
            } else if (event.type === "sessionEnded") {
                this.endSession(event);
            } else if (event.type === "left") {
                // Server says this player disconnected (UMPS >= player_left_scores_type)
                this.removePlayerById(event.source);
            } else if (event.type === "scores?") {
                // Request for scores from another player
                if (typeof window.handleScoresRequest === 'function') {
                    window.handleScoresRequest(event.source);
                }
            } else if (event.type === "scores") {
                // Receive scores from another player
                if (typeof window.handleScores === 'function') {
                    window.handleScores(event.destination, event.source);
                }
            }
        });

        // Server-side scoreboard (UMPS >= player_left_scores_type). Old servers never send this.
        this.umps.hub.on("ScoresUpdated", (scores) => {
            if (typeof window.handleServerScores === 'function') window.handleServerScores(scores);
        });
        fetch(this.serverBaseUrl + '/api/Lobby/GetScores')
            .then(r => (r.ok ? r.json() : null))
            .then(scores => { if (scores && typeof window.handleServerScores === 'function') window.handleServerScores(scores); })
            .catch(() => { /* old server without scores, peer sync stays active */ });

        this.playerLastUpdate = {};
        this.applySessionChoice();
        setInterval(() => this.checkIdle(), idleCheckInterval);
        
        // Request scores from other players once after connection
        setTimeout(() => {
            if (this.umps.hub.connection.q === "Connected") {
                this.sendEvent("scores?", "");
            }
        }, 1000);
    }

    getPlayerId() {
        return this.playerId;
    }

    getCurrentPlayerBody() {
        this.playerBody;
    }

 
    sendData(pos, dir, forceSend = false) {
       
        var currentTime = performance.now();
        if (lastServerSync === 0) {
            lastServerSync = currentTime;
        } else {
            if ((currentTime - lastServerSync) > serverTickinMS) {
               
                const rPos = roundVector(pos);
                const rDir = roundVector(dir);

                if (forceSend || !rPos.equals(lastPosition) || !rDir.equals(lastDirection)) {

                    const player = {
                        id: this.playerId,
                        x: rPos.x,
                        y: rPos.y,
                        z: rPos.z,
                        xd: rDir.x,
                        yd: rDir.y,
                        zd: rDir.z,
                        type: window.orangePlayerType === 'bot' ? 'bot' : 'human'
                    };
                    if (this.umps.hub.connection.q === "Connected") {
                        this.umps.hub.invoke("SendData", player).catch(err => {
                            console.error("Error sending data: ", err);
                        });
                    }

                    lastServerSync = currentTime;
                    lastPosition.copy(rPos);
                    lastDirection.copy(rDir);
                }
            }
        }

        lastMovementTime = performance.now();
        this.playerLastUpdate[this.playerId] = lastMovementTime;
    }

    sendEvent(type, destination){
        const event = {
            type: type,
            source: this.playerId,
            destination: destination
        };
        if (this.umps.hub.connection.q === "Connected") {
            this.umps.hub.invoke("SendEvent", event).catch(err => {
                console.error("Error sending event: ", err);
            });
        }
    }

    addNewPlayer(player) {
        var requested_player_name = ""
        this.umps.GetPlayerName(player.id).then( (result) => {
            requested_player_name = result;
            const newPlayer = {
                id: player.id,
                name: requested_player_name,
                body: this.playerBody.clone(),
                type: player.type === 'bot' ? 'bot' : 'human',
            };
            newPlayer.body.playerid = player.id;

				newPlayer.health = 100; // Track health for this player

            console.log(newPlayer)
            newPlayer.nameTag = this.addPlayerIdText(newPlayer.body, newPlayer.id, (newPlayer.type === 'bot' ? '\u{1F916} ' : '') + newPlayer.name);
				this.addHealthBar(newPlayer.body, newPlayer);

            this.updatePlayer(newPlayer, player);
            this.players.push(newPlayer);
            this.collidableMeshList.push(newPlayer.body);
            this.scene.add(newPlayer.body);
            this.playerLastUpdate[player.id] = performance.now();
            this.pendingPlayers.delete(player.id);
        }).catch(err => {
            this.pendingPlayers.delete(player.id);
            console.error("Could not add player " + player.id + ": ", err);
        });
        
    }

    updatePlayer(player, playerData) {
        //dirty player height hack, might break in the future
        player.body.position.set(playerData.x, playerData.y - this.scene.children[0].playerHeight, playerData.z);

        // Skip lookAt when player is defeated (health <= 0)
        if ((player.health ?? 100) > 0) {
            const newDir = new THREE.Vector3(playerData.xd, playerData.yd, playerData.zd);
            const pos = new THREE.Vector3().addVectors(newDir, player.body.position);
            player.body.lookAt(pos);
        }
        this.playerLastUpdate[player.id] = performance.now();
    }

    addPlayerIdText(body, playerId, playerName) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = 'Bold 60px Arial';
        context.fillStyle = 'white';
        var nameString = playerName;
        context.fillText(nameString, 0, 60);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const planeGeometry = new THREE.PlaneGeometry(1, 0.5);
        const plane = new THREE.Mesh(planeGeometry, material);
        plane.position.set(1, 1.2, 0);
        body.add(plane);
        return plane;
    }

    checkIdle() {
        const currentTime = performance.now();
        if ((performance.now() - lastMovementTime) >= idleThreshold) {
            this.sendData(lastPosition, lastDirection, true);
        }

        this.players = this.players.filter(player => {
            if ((currentTime - this.playerLastUpdate[player.id]) > idleTimeout) {
                this.removePlayer(player);
                return false;
            }
            return true;
        });
    }

    // Remove one remote player from scene, collision list and bookkeeping.
    // Only the name tag and the health bar belong to this player alone; the robot
    // body is a clone that shares geometry and materials with all other robots.
    removePlayer(player) {
        for (const own of [player.nameTag, player.healthBarBg, player.healthBarFill]) {
            if (!own) continue;
            if (own.geometry) own.geometry.dispose();
            if (own.material) {
                if (own.material.map) own.material.map.dispose();
                own.material.dispose();
            }
        }
        this.scene.remove(player.body);
        const idx = this.collidableMeshList.indexOf(player.body);
        if (idx !== -1) this.collidableMeshList.splice(idx, 1);
        delete this.playerLastUpdate[player.id];
    }

    removeAllPlayers() {
        for (const player of this.players) this.removePlayer(player);
        this.players = [];
        this.pendingPlayers.clear();
    }

    parseDefeated(destination) {
        const text = String(destination || '');
        if (text.charAt(0) === '{') {
            try {
                const parsed = JSON.parse(text);
                return { name: String(parsed.name || ''), by: parsed.by ? String(parsed.by) : null };
            } catch (e) { /* fall through: treat as plain name */ }
        }
        return { name: text, by: null };
    }

    // Name of the player whose hit we took last, if it was within the last 10 seconds
    getLastHitterName() {
        if (!this.lastHitBy || (performance.now() - this.lastHitAt) > 10000) return null;
        const hitter = this.players.find(p => p.id === this.lastHitBy);
        return hitter && hitter.name ? hitter.name : null;
    }

    // Join or create the session the player picked in the dialog (window.orangeSessions.choose)
    async applySessionChoice() {
        const choice = orangeSessions.choice;
        if (!choice) return; // lobby, behaves like before sessions existed
        try {
            for (let i = 0; i < 40 && this.umps.hub.connection.q !== "Connected"; i++) {
                await new Promise(resolve => setTimeout(resolve, 250));
            }
            let sessionId = choice;
            if (choice === 'new') {
                const created = await orangeSessions.create(this.serverBaseUrl);
                if (!created) throw new Error('could not create a session');
                sessionId = created.id;
            }
            const session = await this.umps.hub.invoke("JoinSession", sessionId);
            if (!session) throw new Error('session is full, over, or about to end');
            this.enterSession(session);
        } catch (err) {
            console.error("Could not join session: ", err);
            orangeSessions._emit('orange:sessionJoinFailed', { reason: String((err && err.message) || err) });
        }
    }

    enterSession(session) {
        // bodies we have so far belong to the lobby, the session has its own players
        this.removeAllPlayers();
        const secondsLeft = Math.max(0, Number(session.secondsRemaining) || 0);
        const endsAtLocal = performance.now() + secondsLeft * 1000;
        this.session = { id: session.id, name: session.name, endsAtLocal: endsAtLocal };
        orangeSessions._state.current = { id: session.id, name: session.name };
        orangeSessions._emit('orange:sessionJoined', { id: session.id, name: session.name, secondsLeft: secondsLeft });
        clearInterval(this.sessionTimer);
        this.sessionTimer = setInterval(() => {
            const left = Math.max(0, Math.ceil((endsAtLocal - performance.now()) / 1000));
            orangeSessions._emit('orange:sessionTime', { secondsLeft: left });
        }, 1000);
    }

    endSession(event) {
        let result = {};
        try { result = JSON.parse(event.destination) || {}; } catch (e) { result = {}; }
        const finished = this.session;
        clearInterval(this.sessionTimer);
        this.sessionTimer = null;
        this.session = null;
        orangeSessions._state.current = null;
        orangeSessions.choose(null);
        // the server has put us back into the lobby; lobby players reappear with their next update
        this.removeAllPlayers();
        orangeSessions._emit('orange:sessionEnded', {
            id: event.source,
            name: finished ? finished.name : null,
            kills: result.kills || {},
            defeats: result.defeats || {}
        });
    }

    removePlayerById(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;
        this.removePlayer(player);
        this.players = this.players.filter(p => p !== player);
    }

		addHealthBar(body, player) {
			// Create health bar background
			const barWidth = 2;
			const barHeight = 0.2;
			const barDepth = 0.1;
			
			const barGeometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
			const barMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
			const healthBarBg = new THREE.Mesh(barGeometry, barMaterial);
			healthBarBg.position.set(0, 2.5, 0); // Position above player's head
			body.add(healthBarBg);
			
			// Create health bar fill
			const fillGeometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
			const fillMaterial = new THREE.MeshBasicMaterial({ color: 0x3ddc5a }); // Green
			const healthBarFill = new THREE.Mesh(fillGeometry, fillMaterial);
			healthBarFill.position.set(0, 2.5, 0.05); // Slightly in front of background
			body.add(healthBarFill);
			
			// Store references
			player.healthBarBg = healthBarBg;
			player.healthBarFill = healthBarFill;
		}

		updateHealthBar(player) {
			if (player.healthBarFill && player.healthBarBg) {
				// Update health bar color based on health
				const percentage = Math.max(0, Math.min(100, player.health ?? 0));
				let color = 0x3ddc5a; // Green
				if (percentage < 34) {
					color = 0xff3b3b; // Red
				} else if (percentage < 67) {
					color = 0xffb020; // Orange
				}
				player.healthBarFill.material.color.setHex(color);
				
				// Scale the fill
				player.healthBarFill.scale.x = percentage / 100;
			}
		}
}
