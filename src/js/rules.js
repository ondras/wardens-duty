var Rules = {
	getTrapDamage(depth) {
		return depth;
	},
	
	getChestDamage(depth) {
		return this.getTrapDamage(Math.round(depth/2));
	},

	getChestGold(depth) {
		return depth;
	},
	
	getEntityCount(depth) {
		if (this.isLevelShop(depth)) {
			return 3;
		} else if (depth <= 2) { 
			return depth;
		} else if (depth <= 5) {
			return 3;
		} else if (depth <= 10) {
			return 6;
		} else {
			return 9;
		}
	},
	
	getBeingDifficulty(depth) {
		return depth;
	},
	
	isChestTrapped(depth) {
		return ROT.RNG.getUniform() > 0.5;
	},
	
	isLevelShop(depth) {
		return ((depth % 7) == 5);
	},
	
	isLevelElemental(depth) {
		return ((depth % 5) == 4);
	}
}
