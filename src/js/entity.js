var Entity = function() {
	this._visual = {
		ch: Math.random() > 0.5 ? "g" : "r",
		color: "#2a2"
	};
	this._name = "Goblin";
}

Entity.prototype = {
	getVisual() { return this._visual; },
	getName() { return this._name; },

	getAttacks() {},

	computeOutcome(attack) {

	},

	doAttack(attack) {
		var outcome = this.computeOutcome(attack);
	}
}
