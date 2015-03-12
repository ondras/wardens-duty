var Entity = function(visual = {ch:"?", color:"#fff", name:""}) {
	this._visual = visual;
}

Entity.create = function(depth, element) {
	/* FIXME shopkeepers, more features?? */
	
	if (depth <= 4) {
		return Being.create(depth, element);
	} else if (Rules.isLevelShop(depth)) {
		return Shopkeeper.create(depth);
	} else {
		var types = {
//			"Being": 15,
//			"Chest": 1,
//			"Trap": 1,
			"Shopkeeper": 1
		}
		var type = ROT.RNG.getWeightedValue(types);
		return window[type].create(depth, element);
	}
}

Entity.prototype = {
	getVisual() { return this._visual; },
	getAttacks() {},
	computeOutcome(attack) {},
	doAttack(attack) {
		var result = "";
		var outcome = this.computeOutcome(attack);
		var stats = pc.getStats();
		
		for (var p in outcome) {
			stats[p] += outcome[p];
			/* FIXME xp level */
		}

		return result;
	}
}
