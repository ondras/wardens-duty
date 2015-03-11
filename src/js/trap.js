var Trap = function(depth) {
	this._depth = depth;
	this._damage = Rules.getTrapDamage(depth);

	var hsl = [ROT.RNG.getUniform(), 1, 1];
	var rgb = ROT.Color.hsl2rgb(hsl);
	var name = "Trap";
	Entity.call(this, {ch:"%", color: rgb, name: name}); // FIXME char, FIXME types
}
Trap.prototype = Object.create(Entity.prototype);

Trap.create = function(depth, element) {
	return new this(depth);
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
