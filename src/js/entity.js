var Entity = function(visual = {ch:"?", color:"#fff", name:""}) {
	this._visual = visual;
}

Entity.create = function(depth, element, index) {
	/* FIXME shopkeepers, traps, chests, more?? */
	
	if (depth == 1) {
		return Being.create(depth, element);
	} else if (false) { /* FIXME shop */
	} else {
		var types = {
//			"Being": 1,
//			"Chest": 1
			"Trap": 1
		}
		var type = ROT.RNG.getWeightedValue(types);
		return window[type].create(depth, element);
	}
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
