var Being = function(difficulty, visual, element) {
	Entity.call(this, visual);
	this._difficulty = difficulty;
	this._element = element;
	
	this._arrows = Rules.getArrows();
	this._gold = Rules.getGoldGain(difficulty);
	if (this._element) { this._resistance = Rules.getResistanceGain(); }

}
Being.prototype = Object.create(Entity.prototype);

Being.create = function(depth, element) {
	var visual = null;
	var difficulty = 0;

	if (depth == 1) { 
		visual = Bestiary[0].visual;
		difficulty = Bestiary[0].diff;
	} else {
		var avail = [];
		Bestiary.forEach(def => this._availableVariants(avail, depth, def, element));
		
		var result = avail.random();
		difficulty = result.difficulty;
		var def = result.def;
		visual = Object.create(def.visual);
		
		if (!visual.color) { /* apply element */
			element = element || Object.keys(Elements).random();
			visual.color = Elements[element].color;
			visual.name = `${Elements[element].label} ${visual.name}`;
		}
		
		if (result.variant > 0) {
			visual.name = def.variants[result.variant-1].replace("{}", visual.name);
			visual.color = ROT.Color.interpolate(visual.color, [0,0,0], result.variant/10);
			if (result.variant >= def.variants.length/2) { visual.ch = visual.ch.toUpperCase(); }
			difficulty = result.difficulty;
		}
	}
	
	difficulty = Rules.getBeingDifficulty(difficulty, depth);
	return new this(difficulty, visual, element);
}

Being._availableVariants = function(available, depth, def, element) {
	if (element && def.visual.color) { return; } // elemental beings do not have colors

	var min = def.min || 0;
	if (depth < min) { return; }

	if (def.variants) { /* pick available variants */
		var range = def.diff - min;

		if (depth <= min+2*range) { /* add base version */
			available.push({
				def: def,
				variant: 0,
				difficulty: def.diff
			});
		}

		def.variants.forEach((variant, index) => {
			var variantIndex = index+1;
			var variantMin = min + (variantIndex) * range;
			var variantMax = (variantIndex == def.variants.length ? Infinity : variantMin + 2*range);
			if (depth < variantMin || depth > variantMax) { return; }

			available.push({
				def: def,
				variant: variantIndex,
				difficulty: variantMin+range
			});
		});

	} else { /* pick just the starting one */
		available.push({
			def: def,
			variant: 0,
			difficulty: def.diff
		});
 	}
}


Being.prototype.getAttacks = function() {
	var results = [];

	results.push({
		id: "melee",
		label: "Melee attack"
	});
	
	if (this._difficulty == 1) { return results; } // first goblin

	results.push({
		id: "magic",
		label: "Magic missile"
	});

	results.push({
		id: "ranged",
		label: "Shoot a bow"
	});

	var attacks = pc.getAttacks();
	for (var p in attacks) {
		var count = attacks[p];
		if (!count) { continue; }

		results.push({
			id: p,
			label: `${Elements[p].label} Breath (${count})`
		});
	}

	return results;
}

Being.prototype.computeOutcome = function(attack) {
	var stats = pc.getStats();
	var attacks = pc.getAttacks();
	var outcome = {};

	outcome["xp"] = this._difficulty;
	outcome["gold"] = this._gold;
	
	if (this._element) {
		outcome[this._element] = this._resistance;
	}

	switch (attack) {
		case "melee":
			var modifier = Rules.getSkillMultiplier(stats["strength"]);
			if (this._element) {
				modifier *= Rules.getSkillMultiplier(stats[this._element]);
			}
			outcome["hp"] = - Math.round(this._difficulty*modifier);
		break;

		case "magic":
			var modifier = Rules.getSkillMultiplier(stats["magic"]);
			outcome["mana"] = -Math.round(this._difficulty*modifier);
		break;

		case "ranged":
			outcome["ammo"] = -this._arrows;
		break;

		default: /* elemental */
			if (attack == this._element) { /* bad luck => we are resistant */
				var modifier = Rules.getElementalPenalty();
			} else if (!this._element) { /* good luck => elemental attack on a non-elemental creature */
				var modifier = Rules.getElementalBonus();
			} else { /* best luck => we have different element */
				var modifier = Rules.getElementalBonus();
				modifier *= modifier;
			}
			outcome["hp"] = -Math.round(this._difficulty*modifier);
		break;
	}

	return outcome;
}

Being.prototype.doAttack = function(attack) {
	var result = Entity.prototype.doAttack.call(this, attack);
	var stats = pc.getStats();
	var attacks = pc.getAttacks();

	if (attack in Elements) { attacks[attack]--; }

	if (this._element && Rules.isAttackGained()) {
		attacks[this._element]++;
		result = `${result}<p>Killing the ${this._visual.name} granted you a one-time <strong>elemental attack</strong>!</p>`;
	}

	if (Rules.isArrowFound()) {
		stats["ammo"]++;
		result = `${result}<p>You found an <strong>arrow</strong> while searching the corpse!</p>`;
	}

	return result;
}

