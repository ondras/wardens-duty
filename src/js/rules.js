var Rules = {

	/* = Generating stuff = */

	getBeingDifficulty(difficulty, depth) {
		if (depth <= 2) { return depth; }
		return Math.round((difficulty+depth)/2);
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
	
	getEntityCount(depth) {
		if (this.isLevelShop(depth)) {
			return 3;
		} else if (depth <= 2) { 
			return depth;
		} else if (depth <= 8) {
			return 3;
		} else if (depth <= 12) {
			return 6;
		} else {
			var depthBonus = Math.max(0, depth-16);
			return 9 + depthBonus;
		}
	},

	/* = Combat outcome = */

	getArrows() { /* how many arrows are consumed */
		return (ROT.RNG.getUniform() > 0.8 ? 2 : 1);
	},

	getSkillMultiplier(skill) { /* damage/mana reduction based on skill */
		/* 0 => 1, 100 ~> 0.3 */
		skill = Math.min(skill, 100);
		var frac = skill/140;
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
		return ROT.RNG.getUniformInt(0, 3);
	},

	getElementalPenalty() {
		return 2;
	},
	
	getElementalBonus() {
		return 0.5;
	},

	/* = Shopping stuff = */

	getPotionCost() {
		return 4;
	},

	getPotionStrength() {
		return 5;
	},

	getTrainingCost() {
		return 8;
	},

	getTrainingStrength() {
		return 5;
	},

	getAmmoCost() {
		return 12;
	},

	getResistanceCost() {
		return 4;
	},
	
	getResistanceStrength() {
		return 5;
	},

	/* = Leveling up = */

	getXpRange(xp) {
		/* XP ranges are 10, 20, 40, ... */
		var c = 10;
		
		var base = Math.log(1 + xp/c)/Math.LN2;
		base = Math.floor(base);
		return [
			c*(Math.pow(2, base) - 1),
			c*(Math.pow(2, base+1) - 1)
		];
	},

	getLevelResistance() {
		return 7;
	},

	getLevelSkill() {
		return 7;
	},

	getLevelStat() {
		return 1.3;
	}

}
