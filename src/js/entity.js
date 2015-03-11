var Entity = function(visual = {ch:"?", color:"#fff", name:""}) {
	this._visual = visual;
}

Entity.create = function(depth, element) {
	/* FIXME shopeepers, traps, chests, more?? */
	return Being.create(depth, element);
}

Entity.prototype = {
	getVisual() { return this._visual; },

	getAttacks() {},

	computeOutcome(attack) {

	},

	doAttack(attack) {
		var outcome = this.computeOutcome(attack);
		var stats = pc.getStats();
		
		for (var p in outcome) {
			stats[p] += outcome[p];
			/* FIXME xp */
		}
	}
}
