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
	
	isChestTrapped(depth) {
		return ROT.RNG.getUniform() > 0.5;
	}
}
