var Being = function(difficulty, visual) {
	Entity.call(this, visual);
	this._difficulty = difficulty;
}
Being.prototype = Object.create(Entity.prototype);

Being.create = function(depth, element) {
	var visual = null;
	if (depth == 1) { 
		visual = this.ALL.goblin.visual;
	} else {
		var avail = [];
		for (var p in this.ALL) { /* filter all types and their variants */
			this._availableVariants(depth, p, avail);
		}
		
		var result = avail.random();
		var def = this.ALL[result.type];
		var visual = Object.create(def.visual);
		
		if (result.variant > 0) {
			visual.name = def.variants[result.variant-1].replace("{}", visual.name);
			visual.color = ROT.Color.interpolate(visual.color, [0,0,0], result.variant/10);
			if (result.variant >= def.variants.length/2) { visual.ch = visual.ch.toUpperCase(); }
		}
		
	}
	return new this(depth, visual);
}

Being._availableVariants = function(depth, type, available) {
	var def = this.ALL[type];

	var min = def.min || 0;
	var max = def.max || Infinity;
	if (depth >= min && depth <= max) { available.push({type:type, variant:0}); }

	max && def.variants && def.variants.forEach((variant, index) => {
		var range = max-min;
		var variantMin = min + range*(index+1)/2;
		var variantMax = variantMin + range;
		if (depth >= variantMin && depth <= variantMax) { available.push({type:type, variant: index+1}); }
	});
}


Being.prototype.getAttacks = function(pc) {
	var results = [];

	results.push({
		id: "melee",
		label: "Melee attack"
	});

	results.push({
		id: "ranged",
		label: "Shoot a bow"
	});

	results.push({
		id: "magic",
		label: "Magic missile"
	});

	return results;
}

Being.prototype.computeOutcome = function(attack) {
	var outcome = {};

	outcome["xp"] = +5;

	switch (attack) {
		case "melee":
			outcome["hp"] = -50;
		break;

		case "ranged":
			outcome["ammo"] = -1;
		break;

		case "magic":
			outcome["mana"] = -2;
		break;
	}

	return outcome;
}

Being.ALL = {
	"goblin": {
		visual: {
			name: "Goblin",
			ch: "g",
			color: [20, 250, 20]
		},
		variants: ["{} Chieftain", "Large {}", "{} King"],
		max: 10
	},
	
	"rat": {
		visual: {
			name: "Rat",
			ch: "g",
			color: [150, 100, 20]
		},
		variants: ["Giant {}"],
		max: 10
	},

	"bat": {
		visual: {
			name: "Bat",
			ch: "b",
			color: [180, 180, 180]
		},
		variants: ["Giant {}"],
		max: 10
	},
}
