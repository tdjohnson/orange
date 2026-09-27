/**
 * Micro Cache
 * - a micro library to handle an in-memory cache
 * - works in node and browser.
 *
 * @tags inmemory, keyvalue, cache, node, browser
 */

export const MicroCache = function() {
	const values = new Map();

	return {
		get: function(key) { return values.get(key); },
		contains: function(key) { return values.has(key); },
		remove: function(key) { values.delete(key); },
		set: function(key, value) { values.set(key, value); },
		values: function() { return Object.fromEntries(values); },
		getSet: function(key, value) {
			if (!this.contains(key)) {
				this.set(key, typeof value === 'function' ? value() : value);
			}
			return this.get(key);
		},
		clear: function() { values.clear(); },
		size: function() { return values.size; },
		keys: function() { return Array.from(values.keys()); },
		forEach: function(callback) { values.forEach(callback); }
	};
};
