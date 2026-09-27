// Session plumbing for orange (UMPS branch "sessions"). No DOM in here.
// The UI uses window.orangeSessions and listens to the window events listed below.
//
//   await window.orangeSessions.list(baseUrl)   -> [{id, name, startedAt, endsAt, secondsRemaining, playerCount, maxPlayers}]
//                                                   (empty list if the server has no session support)
//   window.orangeSessions.choose(idOrNew)        -> 'new', a session id, or null for the lobby (default).
//                                                   Applied once the game has connected to the server.
//   window.orangeSessions.supported              -> true once list() got a valid answer
//   window.orangeSessions.current                -> {id, name} while in a session, else null
//   await window.orangeSessions.leave()          -> back to the lobby, also during the pause after a round
//
//   window events (CustomEvent, data in event.detail):
//   'orange:sessionJoined'     {id, name, secondsLeft}    also fired when the server starts the next round
//   'orange:sessionTime'       {secondsLeft}              once per second while in a session
//   'orange:sessionEnded'      {id, name, kills:{name:n}, defeats:{name:n}}
//   'orange:sessionJoinFailed' {reason}

const state = { baseUrl: null, supported: false, choice: null, current: null, leave: null };

function normalizeBase(url) {
	return String(url || '').replace(/\/controlhub\/?$/, '').replace(/\/+$/, '');
}

async function list(baseUrl) {
	if (baseUrl) state.baseUrl = normalizeBase(baseUrl);
	if (!state.baseUrl) return [];
	try {
		const response = await fetch(state.baseUrl + '/api/Lobby/GetSessions');
		if (!response.ok) { state.supported = false; return []; }
		const data = await response.json();
		state.supported = Array.isArray(data);
		return state.supported ? data : [];
	} catch (e) {
		state.supported = false;
		return [];
	}
}

async function create(baseUrl) {
	if (baseUrl) state.baseUrl = normalizeBase(baseUrl);
	if (!state.baseUrl) return null;
	try {
		const response = await fetch(state.baseUrl + '/api/Lobby/CreateSession', { method: 'POST' });
		if (!response.ok) return null;
		const session = await response.json();
		state.supported = true;
		return session && session.id !== undefined ? session : null;
	} catch (e) {
		return null;
	}
}

function choose(choice) {
	state.choice = (choice === 'new' || (choice !== null && choice !== undefined && String(choice) !== '')) ? String(choice) : null;
}

function emit(name, detail) {
	window.dispatchEvent(new CustomEvent(name, { detail: detail }));
}

export const orangeSessions = {
	list: list,
	create: create,
	choose: choose,
	// leave the current session (or the pause between two rounds) and go back to the lobby
	leave: async function () { return state.leave ? state.leave() : undefined; },
	get choice() { return state.choice; },
	get supported() { return state.supported; },
	get current() { return state.current; },
	_state: state,
	_emit: emit
};

window.orangeSessions = orangeSessions;
