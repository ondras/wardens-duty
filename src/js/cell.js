var Cell = function(level, position, minimap) {
	this._level = level;
	this._position = position;
	this._minimap = minimap;

	this._entities = [];
	this._current = 0;
	this._done = false;
	this._blocking = false;
	this._attacks = [];

	this._dom = {
		node: document.createElement("div"),
		entity: document.createElement("div"),
		info: document.createElement("div"),
		label: document.createElement("div"),
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
		this._minimap.focus(this._position[0], this._position[1]);
	},

	deactivate() {
		window.removeEventListener("keypress", this);
		window.removeEventListener("keydown", this);
		this._minimap.blur(this._position[0], this._position[1]);
	},

	isBlocking() {
		return this._blocking;
	},

	getNode() {
		return this._dom.node;
	},
	
	addEntity(entity) {
		this._entities.push(entity);
		this._buildEntity();
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

		this._attacks = this._entities[0].getAttacks();
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
				if (e.keyCode != 13 || this._done) { return; }

				if (this._blocking) {
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
		this._dom.node.classList.add("cell");
		this._dom.entity.classList.add("entity");
		this._dom.info.classList.add("info");
		this._dom.label.classList.add("label");
		this._dom.attacks.classList.add("attacks");
		this._dom.gauges.classList.add("gauges");
		this._dom.confirm.classList.add("confirm");

		this._dom.node.appendChild(this._dom.entity);
		this._dom.node.appendChild(this._dom.info);
	},

	_buildEntity() {
		var first = this._entities[0];
		this._dom.entity.innerHTML = "";

		/* char(s) */
		var ch = document.createElement("span");
		var visual = first.getVisual();
		ch.innerHTML = visual.ch;
		ch.style.color = ROT.Color.toRGB(visual.color);
		this._dom.entity.appendChild(ch);

		if (this._entities.length > 1) {
			var more = document.createElement("span");
			more.classList.add("more");
			ch.appendChild(more);
			this._entities.slice(1).forEach(entity => {
				var vis = entity.getVisual();
				var span = document.createElement("span");
				span.innerHTML = vis.ch;
				span.style.color = ROT.Color.toRGB(vis.color);
				more.appendChild(span);
			});
		}

		this._minimap.set(this._position[0], this._position[1], visual.ch, ch.style.color);

		/* label */
		this._dom.label.innerHTML = `<span>${visual.name}</span>`;

		/* info parts */
		this._dom.info.classList.remove("done");
		this._dom.info.innerHTML = "";
		this._dom.info.appendChild(this._dom.label);
		this._dom.info.appendChild(this._dom.attacks);
		this._dom.info.appendChild(this._dom.gauges);

		this._current = 0;
		this.syncAttacks();
	},

	_buildGauge(node, stats, outcome, type) {
		var def = Stats[type];
		var conf = {
			color: def.color,
			label: def.label,
			oldValue: stats[type],
			newValue: this._getNewValue(stats, outcome, type)
		};
		
		if (type == "hp") {
			conf.max = this._getNewValue(stats, outcome, "maxhp");
		} else if (type == "mana") {
			conf.max = this._getNewValue(stats, outcome, "maxmana");
		} else if (type == "ammo" || type == "gold") {
			var oldValue = stats[type];
			var newValue = this._getNewValue(stats, outcome, type);
			conf.max = Math.max(oldValue, newValue);
		} else if (type == "xp") {
			var range = Rules.getXpRange(stats[type]);
			var newValue = this._getNewValue(stats, outcome, type);
			conf.min = range[0];
			conf.max = Math.max(range[1], newValue);
		} else if (type in Elements) {
			conf.max = 100;
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
		var outcome = this._entities[0].computeOutcome(id);
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

		var outcome = this._entities[0].computeOutcome(attack.id);
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
		var id = this._attacks[this._current].id;
		var result = this._entities[0].doAttack(id);

		this._dom.info.classList.add("done");
		this._dom.entity.querySelector("span").style.color = "#000";
		this._minimap.set(this._position[0], this._position[1], "", "");

		this._level.syncCells();

		if (result) { /* we need to show this text and wait for a confirmation */
			this._dom.info.innerHTML = `${result}<p>Press <strong>Enter</strong> to continue.</p>`;
			this._blocking = true;
		} else { /* this entity is finally done */
			this._finalize();
		}
	},

	_finalize() {
		this._entities.shift();
		this._blocking = false;

		if (this._entities.length) { /* work, work */
			this._buildEntity();
		} else { /* pass control back to level */
			this._done = true;
			this._dom.info.innerHTML = "";
			this._level.checkLevelOver();
		}
	}
}
