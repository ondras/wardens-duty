var Trap = function(depth, color, name) {
	this._damage = Rules.getTrapDamage(depth);

	Entity.call(this, {ch:"^", color: color, name: name});
}
Trap.prototype = Object.create(Entity.prototype);

Trap.create = function(depth, element) {
	if (element) {
		var def = this.ALL.filter(def => def.element == element)[0];
	} else {
		var def = this.ALL.random();
	}
	
	var color = (def.element ? Elements[def.element].color : def.color);
	
	return new this(depth, color, def.name);
}

Trap.prototype.getAttacks = function() {
	var results = [];

	results.push({
		id: "setoff",
		label: "Set off the trap"
	});

	return results;
}

Trap.prototype.computeOutcome = function(id) {
	var result = {};
	result["hp"] = -this._damage;

	return result;
}

Trap.ALL = [
	{
		name: "Fireball trap",
		element: "fire"
	}, {
		name: "Splash trap",
		element: "water"
	}, {
		name: "Poison dart",
		element: "poison",
	}, {
		name: "Hidden spikes",
		color: [150, 150, 150]
	}, {
		name: "Falling rock trap",
		color: [80, 80, 80],
	}, {
		name: "Bear trap",
		color: [100, 80, 40]
	}
]
