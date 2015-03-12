var Being = function(difficulty, visual, element) {
	Entity.call(this, visual);
	this._difficulty = difficulty;
	this._element = element;
	this._arrows = Rules.getArrows();
	this._gold = Rules.getGoldGain(difficulty);
}
Being.prototype = Object.create(Entity.prototype);

Being.create = function(depth, element) {
	var visual = null;
	if (depth == 1) { 
		visual = this.ALL[0].visual;
	} else {
		var avail = [];
		this.ALL.forEach(def => this._availableVariants(avail, depth, def, element));
		
		var result = avail.random();
		var def = result.def;
		var visual = Object.create(def.visual);
		
		if (!visual.color) { /* apply element */
			element = element || Object.keys(Elements).random();
			visual.color = Elements[element].color;
			visual.name = `${Elements[element].label} ${visual.name}`;
		}
		
		if (result.variant > 0) {
			visual.name = def.variants[result.variant-1].replace("{}", visual.name);
			visual.color = ROT.Color.interpolate(visual.color, [0,0,0], result.variant/10);
			if (result.variant >= def.variants.length/2) { visual.ch = visual.ch.toUpperCase(); }
		}
	}
	
	var difficulty = Rules.getBeingDifficulty(depth);
	return new this(difficulty, visual, element);
}

Being._availableVariants = function(available, depth, def, element) {
	if (element && def.visual.color) { return; } // elemental do not have colors

	var min = def.min || 0;
	var max = def.max || Infinity;
	if (depth >= min && depth <= max) { available.push({def:def, variant:0}); }

	max && def.variants && def.variants.forEach((variant, index) => {
		var range = max-min;
		var num = index+1;
		var variantMin = min + range*num/2;
		var variantMax = variantMin + range;
		if (depth >= variantMin && depth <= variantMax) { /* variant within range */
			available.push({def:def, variant: num}); 
		}
		if (depth > variantMax && index+1 == def.variants.length) { /* past max variant range */
			available.push({def:def, variant: num});
		}
	});
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
		outcome[`res-${this._element}`] = Rules.getResistanceGain();
	}

	switch (attack) {
		case "melee":
			var modifier = Rules.getSkillMultiplier(stats["strength"]);
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

Being.ALL = [
	{
		visual: {
			name: "Goblin",
			ch: "g",
			color: [20, 250, 20]
		},
		variants: ["{} Chieftain", "Large {}", "{} King"],
		max: 6
	}, {
		visual: {
			name: "Rat",
			ch: "r",
			color: [150, 100, 20]
		},
		variants: ["Giant {}"],
		max: 6
	}, {
		visual: {
			name: "Bat",
			ch: "b",
			color: [180, 180, 180]
		},
		variants: ["Giant {}"],
		max: 6
	}, {
		visual: {
			name: "Dog",
			ch: "d",
			color: [180, 160, 100]
		},
		variants: ["Large {}"],
		max: 6
	}, {
		visual: {
			name: "Pangolin",
			ch: "p",
			color: [150, 100, 20]
		},
		variants: ["Giant {}"],
		min: 3,
		max: 10
	}, {
		visual: {
			name: "Orc",
			ch: "o",
			color: [20, 150, 20]
		},
		variants: ["Large {}", "{} Leader"],
		min: 5,
		max: 12
	}, {
		visual: {
			name: "Ogre",
			ch: "O",
			color: [20, 20, 200]
		},
		variants: ["{} Magus", "{} King"],
		min: 6,
		max: 14
	}, {
		visual: {
			name: "Carnivorous gelatine",
			ch: "j",
			color: [240, 20, 240]
		},
		min: 5,
		max: 20
	}, {
		visual: {
			name: "Beetle",
			ch: "i"
		},
		variants: ["Large {}"],
		min: 5,
		max: 15 
	}, {
		visual: {
			name: "Lizard",
			ch: "l"
		},
		variants: ["Large {}"],
		min: 5,
		max: 15
	}, {
		visual: {
			name: "Elemental",
			ch: "e"
		},
		variants: ["Large {}"],
		min: 10,
		max: 20
	}, {
		visual: {
			name: "Dragon",
			ch: "D",
			color: [250, 230, 20]
		},
		min: 12
	}, {
		visual: {
			name: "Dragon",
			ch: "D"
		},
		min: 12
	}, {
		visual: {
			name: "Hydra",
			ch: "H",
			color: [200, 150, 20]
		},
		min: 15
	}
];
