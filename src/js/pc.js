var PC = function() {
	this._stats = {};
	this._attacks = {};

	for (var p in Stats) { this._stats[p] = Stats[p].def; }
	for (var p in Elements) { this._attacks[p] = 1; }
}

PC.prototype = {
	getStats() { return this._stats; },
	getAttacks() { return this._attacks; },
	setStat(stat, value) {
		this._stats[stat] = value; 
	}
}
