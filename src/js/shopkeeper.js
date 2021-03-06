var Shopkeeper = function(name, items) {
	this._items = items;

	var hue = ROT.RNG.getUniform();
	var color = ROT.Color.hsl2rgb([hue, 1, 0.5]);
	Entity.call(this, {ch:"@", color: color, name: name});
}
Shopkeeper.prototype = Object.create(Entity.prototype);

Shopkeeper.create = function(depth) {
	if (ROT.RNG.getUniform() > 0.9) {
		var all = [];
		this.ALL.forEach(def => {
			def.items.forEach(item => all.push(item));
		});
		all = all.randomize();
		return new this("C.M.O.T. Dibbler", all.slice(0, 3));
	} else {
		var def = this.ALL.random();
		return new this(def.name, def.items);
	}
}

Shopkeeper.prototype.getAttacks = function() {
	return this._items.map((item, index) => ({
		id: index,
		label: `Buy ${item.name}`
	})).concat({
		id: "leave",
		label: "Leave the shop"
	});
}

Shopkeeper.prototype.computeOutcome = function(id) {
	var result = {};

	if (id in this._items) {
		return this._items[id].outcome;
	} else {
		return {};
	}
}

Shopkeeper.ALL = [
	{
		name: "Potion vendor",
		items: [
			{
				name: "Small HP potion",
				outcome: {
					hp: Rules.getPotionStrength(),
					gold: -Rules.getPotionCost()
				}
			}, {
				name: "Medium HP potion",
				outcome: {
					hp: 2*Rules.getPotionStrength(),
					gold: -2*Rules.getPotionCost()
				}
			}, {
				name: "Large HP potion",
				outcome: {
					hp: 3*Rules.getPotionStrength(),
					gold: -3*Rules.getPotionCost()
				}
			}
		]
	}, {
		name: "Mana dealer",
		items: [
			{
				name: "Mana scroll",
				outcome: {
					mana: Rules.getPotionStrength(),
					gold: -Rules.getPotionCost()
				}
			}, {
				name: "Mana book",
				outcome: {
					mana: 2*Rules.getPotionStrength(),
					gold: -2*Rules.getPotionCost()
				}
			}, {
				name: "Lutefisk",
				outcome: {
					mana: 3*Rules.getPotionStrength(),
					hp: -Rules.getPotionStrength(),
					gold: -3*Rules.getPotionCost()
				}
			}
		]
	}, {
		name: "Skill trainer",
		items: [
			{
				name: "strength training",
				outcome: {
					strength: Rules.getTrainingStrength(),
					gold: -Rules.getTrainingCost()
				}
			}, {
				name: "magic training",
				outcome: {
					magic: Rules.getTrainingStrength(),
					gold: -Rules.getTrainingCost()
				}
			}
		]
	}, {
		name: "Ammunitioner",
		items: [
			{
				name: "1 arrow",
				outcome: {
					ammo: 1,
					gold: -Rules.getAmmoCost()
				}
			}, {
				name: "2 arrows",
				outcome: {
					ammo: 2,
					gold: -2*Rules.getAmmoCost()
				}
			}, {
				name: "3 arrows",
				outcome: {
					ammo: 3,
					gold: -3*Rules.getAmmoCost()
				}
			}
		]
	}, {
		name: "Elemental scholar",
		items: [
			{
				name: "fire training",
				outcome: {
					gold: -Rules.getResistanceCost(),
					fire: Rules.getResistanceStrength()
				}
			}, {
				name: "water training",
				outcome: {
					gold: -Rules.getResistanceCost(),
					water: Rules.getResistanceStrength()
				}
			}, {
				name: "poison training",
				outcome: {
					gold: -Rules.getResistanceCost(),
					poison: Rules.getResistanceStrength()
				}
			}
		]
	}
];
