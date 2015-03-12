var Rules = {

	/* = Generating stuff = */

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
	},

	getEntityCount(depth) { /* FIXME */
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

	/* = Combat outcome = */

	getArrows() { /* how many arrows are consumed */
		return (ROT.RNG.getUniform() > 0.5 ? 2 : 1);
	},

	getSkillMultiplier(skill) { /* damage/mana reduction based on skill */
		/* 0 => 1, 100 => 0.5 */
		skill = Math.min(skill, 100);
		var frac = skill/200;
		return (1-frac);
	},

	getGoldGain(difficulty) {
		return Math.floor(difficulty/3);
	},

	isArrowFound() {
		return (ROT.RNG.getUniform() > 0.9);
	},

	isAttackGained() {
		return (ROT.RNG.getUniform() > 0.5);
	},

	getTrapDamage(depth) {
		return depth;
	},
	
	getChestDamage(depth) {
		return this.getTrapDamage(Math.round(depth/2));
	},

	getChestGold(depth) {
		return depth;
	},
	
	/* = Elemental stuff = */

	getResistanceGain() {
		return 5;
	},

	getElementalPenalty() {
		return 2;
	},
	
	getElementalBonus() {
		return 0.5;
	}
}
