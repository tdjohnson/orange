// Hall of fame: best kill/death ratios of single session rounds, shown on the start screen.
// Source is the server (GET <base>/api/Lobby/GetHallOfFame) when it offers one,
// otherwise the rounds this browser has seen, kept in localStorage.
//
// Entry: { name, kills, deaths, date (ISO string), session }
// K/D is kills divided by deaths, with zero deaths counted as one, so 3 kills and
// never busted ranks as 3.00.

const STORAGE_KEY = 'orange.hallOfFame';
const KEEP = 50;   // entries kept in storage
const SHOW = 10;   // rows shown

export function ratio(entry) {
	return (Number(entry.kills) || 0) / Math.max(1, Number(entry.deaths) || 0);
}

export function rank(entries) {
	return entries.slice().sort((a, b) =>
		(ratio(b) - ratio(a)) ||
		((Number(b.kills) || 0) - (Number(a.kills) || 0)) ||
		(String(b.date).localeCompare(String(a.date))));
}

function clean(entry) {
	if (!entry || typeof entry !== 'object') return null;
	const name = String(entry.name || '').slice(0, 100);
	const kills = Math.max(0, Math.floor(Number(entry.kills) || 0));
	const deaths = Math.max(0, Math.floor(Number(entry.deaths) || 0));
	const date = String(entry.date || '');
	if (!name || kills < 1 || isNaN(Date.parse(date))) return null;
	return { name: name, kills: kills, deaths: deaths, date: date, session: String(entry.session || '').slice(0, 100) };
}

export function loadLocal() {
	try {
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
		return Array.isArray(stored) ? stored.map(clean).filter(Boolean) : [];
	} catch (e) {
		return [];
	}
}

function saveLocal(entries) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(rank(entries).slice(0, KEEP)));
	} catch (e) {
		console.log("Could not save the hall of fame:", e);
	}
}

// Called at the end of a round with the result the server sent: {name, kills:{}, defeats:{}}
export function recordRound(detail) {
	if (!detail) return;
	const kills = detail.kills || {};
	const defeats = detail.defeats || {};
	const date = new Date().toISOString();
	const entries = loadLocal();
	Object.keys(kills).forEach(name => {
		const entry = clean({ name: name, kills: kills[name], deaths: defeats[name] || 0, date: date, session: detail.name });
		if (!entry) return;
		// the same round reported twice within a minute counts once
		const duplicate = entries.some(other => other.name === entry.name && other.session === entry.session &&
			other.kills === entry.kills && other.deaths === entry.deaths &&
			Math.abs(Date.parse(other.date) - Date.parse(entry.date)) < 60000);
		if (!duplicate) entries.push(entry);
	});
	saveLocal(entries);
}

export async function loadFromServer(baseUrl) {
	if (!baseUrl) return null;
	try {
		const response = await fetch(String(baseUrl).replace(/\/+$/, '') + '/api/Lobby/GetHallOfFame');
		if (!response.ok) return null;
		const data = await response.json();
		return Array.isArray(data) ? data.map(clean).filter(Boolean) : null;
	} catch (e) {
		return null;
	}
}

function formatDate(iso) {
	const d = new Date(iso);
	const two = (n) => String(n).padStart(2, '0');
	return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()) + ' ' + two(d.getHours()) + ':' + two(d.getMinutes());
}

// Fill the table container and the source line. Text only, names come from other players.
export function render(entries, sourceText) {
	const container = document.getElementById('hallOfFameTable');
	const source = document.getElementById('hallOfFameSource');
	if (!container) return;
	container.textContent = '';
	const best = rank(entries).slice(0, SHOW);
	if (best.length === 0) {
		const empty = document.createElement('p');
		empty.textContent = 'No entries yet. Win a round with at least one kill.';
		container.appendChild(empty);
	} else {
		const table = document.createElement('table');
		table.className = 'hallOfFameTable';
		const head = document.createElement('tr');
		['Rank', 'Player', 'K/D', 'Kills', 'Deaths', 'Date', 'Session'].forEach(text => {
			const th = document.createElement('th');
			th.textContent = text;
			head.appendChild(th);
		});
		const thead = document.createElement('thead');
		thead.appendChild(head);
		table.appendChild(thead);
		const tbody = document.createElement('tbody');
		best.forEach((entry, index) => {
			const row = document.createElement('tr');
			[(index + 1) + '.', entry.name, ratio(entry).toFixed(2), String(entry.kills), String(entry.deaths), formatDate(entry.date), entry.session].forEach(text => {
				const cell = document.createElement('td');
				cell.textContent = text;
				row.appendChild(cell);
			});
			tbody.appendChild(row);
		});
		table.appendChild(tbody);
		container.appendChild(table);
	}
	if (source) source.textContent = sourceText || '';
}

// Show the hall of fame: the server's list if it has one, else this browser's
export async function show(baseUrl, serverName) {
	const fromServer = await loadFromServer(baseUrl);
	if (fromServer) {
		render(fromServer, 'All players on ' + (serverName || 'the server'));
	} else {
		render(loadLocal(), 'Rounds played in this browser');
	}
}
