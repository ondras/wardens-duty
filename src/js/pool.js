var Pool = function(depth) {
	var hue = ROT.RNG.getUniform();
	var color = ROT.Color.hsl2rgb([hue, 0.8, 0.8]);
	Entity.call(this, {ch:"≈", color: color, name: "Magic pool"});

	this._outcome = [
		{"hp": -10},
		{"hp": +10},
		{"mana": -10},
		{"mana": +10},
		{"strength": -5},
		{"strength": +5},
		{"magic": -5},
		{"magic": +5}
	].random();
}
Pool.prototype = Object.create(Entity.prototype);

Pool.create = function(depth, element) {
	return new this(depth);
}

Pool.prototype.getAttacks = function() {
	var results = [];

	results.push({
		id: "drink",
		label: "Drink from the pool"
	});
	
	results.push({
		id: "ignore",
		label: "Ignore the pool"
	});
	
	return results;
}

Pool.prototype.computeOutcome = function(id) {
	if (id == "ignore") {
		return {};
	} else {
		return this._outcome;
	}
}
