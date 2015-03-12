var Cell = function(level, entity) {
	this._level = level;
	this._entity = entity;
	this._current = 0;
	this._done = false;
	this._attacks = [];

	this._dom = {
		node: document.createElement("div"),
		entity: document.createElement("div"),
		info: document.createElement("div"),
		attacks: document.createElement("div"),
		gauges: document.createElement("div"),
		confirm: document.createElement("div")
	}

	this._build();
}

Cell.prototype = {
	activate() {
		window.addEventListener("keypress", this);
		window.addEventListener("keydown", this);
	},

	deactivate() {
		window.removeEventListener("keypress", this);
		window.removeEventListener("keydown", this);
	},

	getNode() {
		return this._dom.node;
	},

	resize(w, h) {
		this._dom.node.style.width = w+"px";
		this._dom.node.style.height = h+"px";
	},

	isDone() {
		return this._done;
	},

	isDoable() {
		return this._attacks.some(attack => !attack.disabled);
	},

	syncAttacks() {
		if (this._done) { return; }

		this._attacks = this._entity.getAttacks();
		this._buildAttacks();

		if (this._current >= this._attacks.length) { 
			/* current attack disappeared due to interaction in other cell */
			this._current = 0;
		}
		this._switchAttack(this._current);
	},

	handleEvent(e) {
		switch (e.type) {
			case "keydown":
				if (e.keyCode != 13) { return; }

				if (this._done) { /* done confirmation */
					this._finalize();
					return;
				}

				if (this._attacks[this._current].disabled) { return; }
				this._doAttack();
			break;
			
			case "keypress":
				var index = e.charCode - "1".charCodeAt(0);
				if (index < 0 || index >= this._attacks.length) { return; }
				
				this._switchAttack(index);
			break;
		}
	},

	_build() {
		var entity = this._entity;

		this._dom.node.classList.add("cell");
		this._dom.entity.classList.add("entity");
		this._dom.info.classList.add("info");
		this._dom.attacks.classList.add("attacks");
		this._dom.gauges.classList.add("gauges");
		this._dom.confirm.classList.add("confirm");

		/* entity */
		var ch = document.createElement("span");
		var visual = entity.getVisual();
		ch.innerHTML = visual.ch;
		ch.style.color = ROT.Color.toRGB(visual.color);
		this._dom.entity.appendChild(ch);
		this._dom.node.appendChild(this._dom.entity);

		/* label */
		var label = document.createElement("div");
		label.classList.add("label");
		label.innerHTML = `<span>${visual.name}</span>`;
		this._dom.info.appendChild(label);

		/* main control UI */
		this._dom.info.appendChild(this._dom.attacks);
		this._dom.info.appendChild(this._dom.gauges);
		this._dom.node.appendChild(this._dom.info);
	},

	_buildGauge(node, stats, outcome, type) {
		var def = Stats[type];
		var conf = {
			color: def.color,
			label: def.label,
			oldValue: stats[type],
			newValue: this._getNewValue(stats, outcome, type)
		};
		
		/* FIXME xp threshold */
		if (type == "hp") {
			conf.max = this._getNewValue(stats, outcome, "maxhp");
		} else if (type == "mana") {
			conf.max = this._getNewValue(stats, outcome, "maxmana");
		} else if (type == "ammo" || type == "gold" || type in Elements) {
			var oldValue = stats[type];
			var newValue = this._getNewValue(stats, outcome, type);
			conf.max = Math.max(oldValue, newValue);
		}
		
		var gauge = new Gauge(conf);
		node.appendChild(gauge.getNode());
	},
	
	_getNewValue(stats, outcome, type) {
		return stats[type] + (type in outcome ? outcome[type] : 0);
	},

	_buildAttacks() {
		var ul = document.createElement("ul");

		this._attacks.forEach((attack, index) => {
			attack.disabled = this._isAttackDisabled(attack.id);
			attack.node = document.createElement("li");
			if (attack.disabled) { attack.node.classList.add("disabled"); }
			attack.node.innerHTML = attack.label;
			ul.appendChild(attack.node);
		});

		this._dom.attacks.innerHTML = "";
		this._dom.attacks.appendChild(ul);
		this._dom.attacks.appendChild(this._dom.confirm);
	},

	_isAttackDisabled(id) {
		var outcome = this._entity.computeOutcome(id);
		var stats = pc.getStats();
		
		if (this._getNewValue(stats, outcome, "hp") <= 0) { return true; }
		if (this._getNewValue(stats, outcome, "mana") < 0) { return true; }
		if (this._getNewValue(stats, outcome, "ammo") < 0) { return true; }
		if (this._getNewValue(stats, outcome, "gold") < 0) { return true; }
		
		return false;
	},

	_switchAttack(attackIndex) {
		this._attacks[this._current].node.classList.remove("active");
		
		this._current = attackIndex;
		this._dom.gauges.innerHTML = "";

		var attack = this._attacks[this._current];
		attack.node.classList.add("active");
		attack.node.appendChild(this._dom.confirm);

		var outcome = this._entity.computeOutcome(attack.id);
		var stats = pc.getStats();

		var box1 = document.createElement("div");
		box1.classList.add("group");

		this._buildGauge(box1, stats, outcome, "hp");
		this._buildGauge(box1, stats, outcome, "mana");
		this._buildGauge(box1, stats, outcome, "ammo");
		this._buildGauge(box1, stats, outcome, "strength");
		this._buildGauge(box1, stats, outcome, "magic");

		var box2 = document.createElement("div");
		box2.classList.add("group");

		this._buildGauge(box2, stats, outcome, "fire");
		this._buildGauge(box2, stats, outcome, "water");
		this._buildGauge(box2, stats, outcome, "poison");
		this._buildGauge(box2, stats, outcome, "gold");
		this._buildGauge(box2, stats, outcome, "xp");

		this._dom.gauges.appendChild(box1);
		this._dom.gauges.appendChild(box2);
	
		this._syncConfirm();
	},
		
	_syncConfirm() {
		var attack = this._attacks[this._current];
		var node = this._dom.confirm;

		if (attack.disabled) {
			node.classList.add("disabled");
			node.innerHTML = "Impossible";
		} else {
			node.classList.remove("disabled");
			node.innerHTML = "<strong>Enter</strong> to confirm";
		}
	},
	
	_doAttack() {
		this._dom.info.classList.add("done");
		this._dom.entity.querySelector("span").style.color = "#000";

		var id = this._attacks[this._current].id;
		var result = this._entity.doAttack(id);

		this._done = true;
		if (result) { /* we need to show this text and wait for a confirmation */
			this._dom.info.innerHTML = `${result}<p>Press <strong>Enter</strong> to dismiss this message.</p>`;
		} else { /* pass control back to level */
			this._finalize();
		}
	},

	_finalize() {
		this._dom.info.innerHTML = "";
		this.deactivate();
		this._level.checkCells();
	}
}
