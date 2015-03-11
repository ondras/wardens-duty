var Chest = function(depth) {
	this._depth = depth;
	this._trapped = Rules.isChestTrapped(depth);
	this._gold = Rules.getChestGold(depth);
	this._damage = Rules.getChestDamage(depth);

	var name = `T${this._trapped ? "rapped t" : ""}reasure chest`;
	Entity.call(this, {ch:"$", color: [250, 230, 20], name: name});
}
Chest.prototype = Object.create(Entity.prototype);

Chest.create = function(depth, element) {
	return new this(depth);
}

Chest.prototype.getAttacks = function() {
	var results = [];

	results.push({
		id: "open",
		label: "Open the chest"
	});
	
	results.push({
		id: "ignore",
		label: "Ignore the chest"
	});
	
	return results;
}

Chest.prototype.computeOutcome = function(id) {
	var result = {};
	switch (id) {
		case "ignore":
		break;
		
		case "open":
			result["gold"] = this._gold;
			if (this._trapped) { result["hp"] = -this._damage; }
		break;
	}
	
	return result;
}
