var Being = function() {
	Entity.call(this);
}

Being.prototype = Object.create(Entity.prototype);

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
