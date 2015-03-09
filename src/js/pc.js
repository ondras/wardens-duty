var PC = function() {
	this._stats = {};
	this._attacks = {};

	for (var p in Stats) { this._stats[p] = Stats[p].def; }
}

PC.prototype = {
	getStats() { return this._stats; },
	getAttacks() { return this._attacks; },
	setStat(stat, value) {
		this._stats[stat] = value; 
	}
}
