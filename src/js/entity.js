var Entity = function(visual = {ch:"?", color:"#fff", name:""}) {
	this._visual = visual;
}

Entity.create = function(depth, element) {
	if (depth <= 4) {
		return Being.create(depth, element);
	} else if (Rules.isLevelShop(depth)) {
		return Shopkeeper.create(depth);
	} else {
		var types = {
			"Being": 15,
			"Chest": 1,
			"Trap": 1,
			"Shopkeeper": 1,
			"Pool": 1
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
		var xpRange = Rules.getXpRange(stats.xp);
		
		for (var p in outcome) {
			stats[p] += outcome[p];
		}
		
		if (stats.xp >= xpRange[1]) { /* level up */

			var modifier = Rules.getLevelStat();
			stats.maxhp = Math.round(stats.maxhp * modifier);
			stats.maxmana = Math.round(stats.maxmana * modifier);
			
			for (var p in Elements) {
				stats[p] += Rules.getLevelResistance();
			}
			
			stats.strength += Rules.getLevelSkill();
			stats.magic += Rules.getLevelSkill();

			stats.hp = stats.maxhp;
			stats.mana = stats.maxmana;
			
			result = `${result}<p>You have reached another experience level!
			You are now stronger, completely healed and your mana reserves
			are restored.</p>`
		}

		return result;
	}
}
