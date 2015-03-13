var Rules = {

	/* = Generating stuff = */

	getBeingDifficulty(difficulty, depth) {
		return Math.round(difficulty + depth/4);
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
			return 9*3;
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
		return 3;
	},

	getElementalPenalty() {
		return 2;
	},
	
	getElementalBonus() {
		return 0.5;
	},

	/* = Shopping stuff = */

	getPotionCost() {
		return 5;
	},

	getPotionStrength() {
		return 5;
	},

	getTrainingCost() {
		return 10;
	},

	getTrainingStrength() {
		return 5;
	},

	getAmmoCost() {
		return 15;
	},

	getResistanceCost() {
		return 5;
	},
	
	getResistanceStrength() {
		return 3;
	},

	/* = Leveling up = */

	getXpRange(xp) {
		if (xp < 10) { return [0, 10]; }

		/* 10, 20, 40, 80, ... */
		
		var base = Math.log(xp/10)/Math.LN2;
		base = Math.floor(base);
		return [
			10*Math.pow(2, base),
			10*Math.pow(2, base+1)
		];
	},

	getLevelResistance() {
		return 2;
	},

	getLevelSkill() {
		return 2;
	},

	getLevelStat() {
		return 1.1;
	}

}
