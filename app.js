"use strict";

var Stats = {
	hp: {
		label: "Health",
		color: [50, 220, 50],
		def: 20
	},
	maxhp: {
		def: 20
	},
	mana: {
		label: "Mana",
		color: [50, 50, 220],
		def: 20
	},
	maxmana: {
		def: 20
	},
	strength: {
		label: "Strength",
		color: [50, 180, 100],
		def: 10 // max 100 reduces damage by half
	},
	magic: {
		label: "Magic affinity",
		color: [100, 50, 180],
		def: 10 // max 100 reduces mana consumption by half
	},
	gold: {
		label: "Gold",
		color: [230, 200, 20],
		def: 0
	},
	ammo: {
		label: "Arrows",
		color: [200, 120, 30],
		def: 3
	},
	xp: {
		label: "Experience",
		color: [200, 50, 200],
		def: 0
	}
};

var Elements = {
	poison: {
		label: "Poison",
		color: [100, 160, 20],
		def: 0 // max 100 reduces damage by half
	},

	fire: {
		label: "Fire",
		color: [180, 20, 20],
		def: 0
	},

	water: {
		label: "Water",
		color: [20, 20, 180],
		def: 0
	}
};

Object.keys(Elements).forEach(function (key) {
	Stats[key] = {
		label: "" + Elements[key].label + " resistance",
		color: Elements[key].color,
		def: 0
	};
});
"use strict";

var Cell = function Cell(level, position, minimap) {
	this._level = level;
	this._position = position;
	this._minimap = minimap;

	this._entities = [];
	this._current = 0;
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
	};
	this._build();
};

Cell.prototype = {
	activate: function activate() {
		window.addEventListener("keypress", this);
		window.addEventListener("keydown", this);
		this._minimap.focus(this._position[0], this._position[1]);
	},

	deactivate: function deactivate() {
		window.removeEventListener("keypress", this);
		window.removeEventListener("keydown", this);
		this._minimap.blur(this._position[0], this._position[1]);
	},

	isBlocking: function isBlocking() {
		return this._blocking;
	},

	getNode: function getNode() {
		return this._dom.node;
	},

	addEntity: function addEntity(entity) {
		this._entities.push(entity);
		this._buildEntity();
	},

	resize: function resize(w, h) {
		this._dom.node.style.width = w + "px";
		this._dom.node.style.height = h + "px";
	},

	isDone: function isDone() {
		return !this._entities.length;
	},

	isDoable: function isDoable() {
		return this._attacks.some(function (attack) {
			return !attack.disabled;
		});
	},

	syncAttacks: function syncAttacks() {
		if (this.isDone()) {
			return;
		}

		this._attacks = this._entities[0].getAttacks();
		this._buildAttacks();

		if (this._current >= this._attacks.length) {
			/* current attack disappeared due to interaction in other cell */
			this._current = 0;
		}
		this._switchAttack(this._current);
	},

	handleEvent: function handleEvent(e) {
		switch (e.type) {
			case "keydown":
				if (e.keyCode != 13 || this.isDone()) {
					return;
				}

				if (this._blocking) {
					this._finalize();
					return;
				}

				if (this._attacks[this._current].disabled) {
					return;
				}
				this._doAttack();
				break;

			case "keypress":
				var index = e.charCode - "1".charCodeAt(0);
				if (index < 0 || index >= this._attacks.length) {
					return;
				}

				this._switchAttack(index);
				break;
		}
	},

	_build: function _build() {
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

	_buildEntity: function _buildEntity() {
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
			this._entities.slice(1).forEach(function (entity) {
				var vis = entity.getVisual();
				var span = document.createElement("span");
				span.innerHTML = vis.ch;
				span.style.color = ROT.Color.toRGB(vis.color);
				more.appendChild(span);
			});
		}

		this._minimap.set(this._position[0], this._position[1], visual.ch, ch.style.color);

		/* label */
		this._dom.label.innerHTML = "<span>" + visual.name + "</span>";

		/* info parts */
		this._dom.info.classList.remove("done");
		this._dom.info.innerHTML = "";
		this._dom.info.appendChild(this._dom.label);
		this._dom.info.appendChild(this._dom.attacks);
		this._dom.info.appendChild(this._dom.gauges);

		this._current = 0;
		this.syncAttacks();
	},

	_buildGauge: function _buildGauge(node, stats, outcome, type) {
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

	_getNewValue: function _getNewValue(stats, outcome, type) {
		return stats[type] + (type in outcome ? outcome[type] : 0);
	},

	_buildAttacks: function _buildAttacks() {
		var _this = this;

		var ul = document.createElement("ul");

		this._attacks.forEach(function (attack, index) {
			attack.disabled = _this._isAttackDisabled(attack.id);
			attack.node = document.createElement("li");
			if (attack.disabled) {
				attack.node.classList.add("disabled");
			}
			attack.node.innerHTML = attack.label;
			ul.appendChild(attack.node);
		});

		this._dom.attacks.innerHTML = "";
		this._dom.attacks.appendChild(ul);
		this._dom.attacks.appendChild(this._dom.confirm);
	},

	_isAttackDisabled: function _isAttackDisabled(id) {
		var outcome = this._entities[0].computeOutcome(id);
		var stats = pc.getStats();

		if (this._getNewValue(stats, outcome, "hp") <= 0) {
			return true;
		}
		if (this._getNewValue(stats, outcome, "mana") < 0) {
			return true;
		}
		if (this._getNewValue(stats, outcome, "ammo") < 0) {
			return true;
		}
		if (this._getNewValue(stats, outcome, "gold") < 0) {
			return true;
		}

		return false;
	},

	_switchAttack: function _switchAttack(attackIndex) {
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

	_syncConfirm: function _syncConfirm() {
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

	_doAttack: function _doAttack() {
		var id = this._attacks[this._current].id;
		var result = this._entities[0].doAttack(id);

		this._dom.info.classList.add("done");
		this._dom.entity.querySelector("span").style.color = "#000";
		this._minimap.set(this._position[0], this._position[1], "", "");

		this._level.syncCells();

		if (result) {
			/* we need to show this text and wait for a confirmation */
			this._dom.info.innerHTML = "" + result + "<p>Press <strong>Enter</strong> to continue.</p>";
			this._blocking = true;
		} else {
			/* this entity is finally done */
			this._finalize();
		}
	},

	_finalize: function _finalize() {
		this._entities.shift();
		this._blocking = false;

		if (this._entities.length) {
			/* work, work */
			this._buildEntity();
		} else {
			/* pass control back to level */
			this._dom.info.innerHTML = "";
			this._level.checkLevelOver();
		}
	}
};
"use strict";

var Entity = function Entity() {
	var visual = arguments[0] === undefined ? { ch: "?", color: "#fff", name: "" } : arguments[0];

	this._visual = visual;
};

Entity.create = function (depth, element) {
	if (depth <= 4) {
		return Being.create(depth, element);
	} else if (Rules.isLevelShop(depth)) {
		return Shopkeeper.create(depth);
	} else {
		var types = {
			Being: 15,
			Chest: 1,
			Trap: 1,
			Shopkeeper: 1,
			Pool: 1
		};
		var type = ROT.RNG.getWeightedValue(types);
		return window[type].create(depth, element);
	}
};

Entity.prototype = {
	getVisual: function getVisual() {
		return this._visual;
	},
	getAttacks: function getAttacks() {},
	computeOutcome: function computeOutcome(attack) {},
	doAttack: function doAttack(attack) {
		var result = "";
		var outcome = this.computeOutcome(attack);
		var stats = pc.getStats();
		var xpRange = Rules.getXpRange(stats.xp);

		for (var p in outcome) {
			stats[p] += outcome[p];
		}

		if (stats.xp >= xpRange[1]) {
			/* level up */

			var modifier = Rules.getLevelStat();
			stats.maxhp = Math.round(stats.maxhp * modifier);
			stats.maxmana = Math.round(stats.maxmana * modifier);

			for (var p in Elements) {
				stats[p] += Rules.getLevelResistance();
			}

			stats.strength += Rules.getLevelSkill();
			stats.magic += Rules.getLevelSkill();

			stats.hp = stats.maxhp;
			stats.mana = stats.maxmana;

			result = "" + result + "<p>You have reached another experience level!\n\t\t\tYou are now stronger, completely healed and your mana reserves\n\t\t\tare restored.</p>";
		}

		return result;
	}
};
"use strict";

var Being = function Being(difficulty, visual, element) {
	Entity.call(this, visual);
	this._difficulty = difficulty;
	this._element = element;

	this._arrows = Rules.getArrows();
	this._gold = Rules.getGoldGain(difficulty);
	if (this._element) {
		this._resistance = Rules.getResistanceGain();
	}
};
Being.prototype = Object.create(Entity.prototype);

Being.create = function (depth, element) {
	var _this = this;

	var visual = null;
	var difficulty = 0;

	if (depth == 1) {
		visual = Bestiary[0].visual;
		difficulty = Bestiary[0].diff;
	} else {
		var avail = [];
		Bestiary.forEach(function (def) {
			return _this._availableVariants(avail, depth, def, element);
		});

		var result = avail.random();
		difficulty = result.difficulty;
		var def = result.def;
		visual = Object.create(def.visual);

		if (!visual.color) {
			/* apply element */
			element = element || Object.keys(Elements).random();
			visual.color = Elements[element].color;
			visual.name = "" + Elements[element].label + " " + visual.name;
		}

		if (result.variant > 0) {
			visual.name = def.variants[result.variant - 1].replace("{}", visual.name);
			visual.color = ROT.Color.interpolate(visual.color, [0, 0, 0], result.variant / 10);
			if (result.variant >= def.variants.length / 2) {
				visual.ch = visual.ch.toUpperCase();
			}
			difficulty = result.difficulty;
		}
	}

	difficulty = Rules.getBeingDifficulty(difficulty, depth);
	return new this(difficulty, visual, element);
};

Being._availableVariants = function (available, depth, def, element) {
	if (element && def.visual.color) {
		return;
	} // elemental beings do not have colors

	var min = def.min || 0;
	if (depth < min) {
		return;
	}

	if (def.variants) {
		/* pick available variants */
		var range = def.diff - min;

		if (depth <= min + 2 * range) {
			/* add base version */
			available.push({
				def: def,
				variant: 0,
				difficulty: def.diff
			});
		}

		def.variants.forEach(function (variant, index) {
			var variantIndex = index + 1;
			var variantMin = min + variantIndex * range;
			var variantMax = variantIndex == def.variants.length ? Infinity : variantMin + 2 * range;
			if (depth < variantMin || depth > variantMax) {
				return;
			}

			available.push({
				def: def,
				variant: variantIndex,
				difficulty: variantMin + range
			});
		});
	} else {
		/* pick just the starting one */
		available.push({
			def: def,
			variant: 0,
			difficulty: def.diff
		});
	}
};

Being.prototype.getAttacks = function () {
	var results = [];

	results.push({
		id: "melee",
		label: "Melee attack"
	});

	if (this._difficulty == 1) {
		return results;
	} // first goblin

	results.push({
		id: "magic",
		label: "Magic missile"
	});

	results.push({
		id: "ranged",
		label: "Shoot a bow"
	});

	var attacks = pc.getAttacks();
	for (var p in attacks) {
		var count = attacks[p];
		if (!count) {
			continue;
		}

		results.push({
			id: p,
			label: "" + Elements[p].label + " Breath (" + count + ")"
		});
	}

	return results;
};

Being.prototype.computeOutcome = function (attack) {
	var stats = pc.getStats();
	var attacks = pc.getAttacks();
	var outcome = {};

	outcome.xp = this._difficulty;
	outcome.gold = this._gold;

	if (this._element) {
		outcome[this._element] = this._resistance;
	}

	switch (attack) {
		case "melee":
			var modifier = Rules.getSkillMultiplier(stats.strength);
			if (this._element) {
				modifier *= Rules.getSkillMultiplier(stats[this._element]);
			}
			outcome.hp = -Math.round(this._difficulty * modifier);
			break;

		case "magic":
			var modifier = Rules.getSkillMultiplier(stats.magic);
			outcome.mana = -Math.round(this._difficulty * modifier);
			break;

		case "ranged":
			outcome.ammo = -this._arrows;
			break;

		default:
			/* elemental */
			if (attack == this._element) {
				/* bad luck => we are resistant */
				var modifier = Rules.getElementalPenalty();
			} else if (!this._element) {
				/* good luck => elemental attack on a non-elemental creature */
				var modifier = Rules.getElementalBonus();
			} else {
				/* best luck => we have different element */
				var modifier = Rules.getElementalBonus();
				modifier *= modifier;
			}
			outcome.hp = -Math.round(this._difficulty * modifier);
			break;
	}

	return outcome;
};

Being.prototype.doAttack = function (attack) {
	var result = Entity.prototype.doAttack.call(this, attack);
	var stats = pc.getStats();
	var attacks = pc.getAttacks();

	if (attack in Elements) {
		attacks[attack]--;
	}

	if (this._element && Rules.isAttackGained()) {
		attacks[this._element]++;
		result = "" + result + "<p>Killing the " + this._visual.name + " granted you a one-time <strong>elemental attack</strong>!</p>";
	}

	if (Rules.isArrowFound()) {
		stats.ammo++;
		result = "" + result + "<p>You found an <strong>arrow</strong> while searching the corpse!</p>";
	}

	return result;
};
"use strict";

/**
 * @param {int} depth
 * @param {int} count
 * @param {string} intro Introduction HTML
 * @param {string} [element] For element-specific levels
 */
var Level = function Level(depth, count, intro, element) {
	this._depth = depth;
	this._cells = [];
	this._current = null;
	this._texture = [];

	this._dom = {
		node: document.createElement("div"),
		intro: document.createElement("div")
	};

	if (count <= 3) {
		this._size = [count, 1];
	} else if (count <= 6) {
		this._size = [count / 2, 2];
	} else {
		this._size = [3, 3];
	}

	this._buildCells(count, element);

	this._size[1]++; // room for the intro cell
	this._build(intro, element);
	this.syncCells();
};

Level.create = function (depth) {
	/**
  * General level contents:
  *     1. one goblin
  *     2: two monsters with attack types
  *     3: two monsters, leveling up
  *     4: elemental level
  *  7n-2: shops
  *  5n-1: elemental
  *    3+: with "P.S." in intro
  */

	var intro = this._createIntro(depth);
	var count = Rules.getEntityCount(depth);
	var element = null;

	if (Rules.isLevelElemental(depth)) {
		element = Object.keys(Elements).random();
	}
	var ctor = location.hash == "#debug" ? Debug : this;
	return new ctor(depth, count, intro, element);
};

Level.data = {
	fontSize: 24,
	lineHeight: 1,
	fontFamily: "deja vu serif, verdana",
	elementalAnnounced: false,
	shopAnnounced: false
};

Level.prototype = {
	activate: function activate(w, h) {
		window.addEventListener("keypress", this);
		window.addEventListener("keydown", this);

		this._activateCell(0, 0);
		this.resize(w, h);
		document.body.insertBefore(this._dom.node, document.body.firstChild);
	},

	deactivate: function deactivate() {
		var _this = this;

		window.removeEventListener("keypress", this);
		window.removeEventListener("keydown", this);

		this._dom.node.classList.add("done");
		this._cells.forEach(function (cell) {
			return cell.deactivate();
		});

		setTimeout(function () {
			return _this._dom.node.parentElement.removeChild(_this._dom.node);
		}, 1500);
	},

	getDepth: function getDepth() {
		return this._depth;
	},

	syncCells: function syncCells() {
		this._cells.forEach(function (cell) {
			return cell.syncAttacks();
		});
	},

	checkLevelOver: function checkLevelOver() {
		var doable = this._cells.some(function (cell) {
			return cell.isDoable() && !cell.isDone();
		});
		var done = this._cells.every(function (cell) {
			return cell.isDone();
		});

		if (done) {
			/* level done, switch to another */
			game.nextLevel();
		} else if (!doable) {
			/* game over */
			game.over();
		}
	},

	resize: function resize(w, h) {
		var _this = this;

		var node = this._dom.node;
		node.style.width = this._size[0] * w + "px";
		node.style.height = this._size[1] * h + "px";

		this._dom.intro.style.width = w + "px";
		this._dom.intro.style.height = h + "px";

		this._renderTexture();

		this._cells.forEach(function (cell, index) {
			var x = index % _this._size[0];
			var y = Math.floor(index / _this._size[0]) + 1;

			cell.resize(w, h);
			var node = cell.getNode();
			node.style.left = x * w + "px";
			node.style.top = y * h + "px";
		});

		this._positionPort();
	},

	handleEvent: function handleEvent(e) {
		if (e.ctrlKey || e.altKey || e.metaKey) {
			return;
		}
		var what = e.type == "keydown" ? e.keyCode : String.fromCharCode(e.charCode);

		switch (what) {
			case ROT.VK_LEFT:
			case "a":
			case "h":
				this._activateCell(this._current[0] - 1, this._current[1]);
				break;
			case ROT.VK_UP:
			case "w":
			case "k":
				this._activateCell(this._current[0], this._current[1] - 1);
				break;
			case ROT.VK_RIGHT:
			case "d":
			case "l":
				this._activateCell(this._current[0] + 1, this._current[1]);
				break;
			case ROT.VK_DOWN:
			case "s":
			case "j":
				this._activateCell(this._current[0], this._current[1] + 1);
				break;

			default:
				return;
				break;
		}
		e.preventDefault();
	},

	_activateCell: function _activateCell(x, y) {
		if (!this._isValid(x, y)) {
			return;
		}

		if (this._current) {
			/* consider currently selected cell */
			var index = this._current[0] + (this._current[1] - 1) * this._size[0];
			if (index >= 0) {
				var cell = this._cells[index];
				if (cell.isBlocking()) {
					return;
				}
				cell.deactivate();
			}
		}

		this._current = [x, y];
		this._positionPort();

		var index = x + (y - 1) * this._size[0];
		if (index >= 0) {
			this._cells[index].activate();
		}
	},

	_isValid: function _isValid(x, y) {
		if (x < 0 || y < 0 || x >= this._size[0] || y >= this._size[1]) {
			return false;
		}
		if (y == 0 && x > 0) {
			return false;
		}
		return true;
	},

	_buildCells: function _buildCells(count, element) {
		this._minimap = new Minimap(this._size[0], this._size[1]);

		for (var j = 0; j < this._size[1]; j++) {
			for (var i = 0; i < this._size[0]; i++) {
				var cell = new Cell(this, [i, j], this._minimap);
				this._cells.push(cell);
			}
		}

		for (var i = 0; i < count; i++) {
			var cell = this._cells[i % this._cells.length];
			var entity = Entity.create(this._depth, element);
			cell.addEntity(entity);
		}
	},

	_build: function _build(introHTML, element) {
		var _this = this;

		this._createTextureData(element);

		this._dom.node.classList.add("level");

		this._dom.intro.classList.add("cell");
		this._dom.node.appendChild(this._dom.intro);

		var intro = document.createElement("div");
		intro.classList.add("intro");
		intro.innerHTML = introHTML;
		this._dom.intro.appendChild(intro);

		this._cells.forEach(function (cell) {
			return _this._dom.node.appendChild(cell.getNode());
		});

		if (this._depth >= 2) {
			this._dom.node.appendChild(this._minimap.getNode());
		}
	},

	_createTextureData: function _createTextureData(element) {
		var texture = this._texture;
		var base = [40, 40, 40];
		if (element) {
			base = ROT.Color.interpolate(base, Elements[element].color, 0.5);
			base = base.map(function (channel) {
				return Math.round(channel / 4);
			});
		}

		var width = 13;
		var height = 6;
		for (var i = 0; i < width; i++) {
			texture.push([]);
			for (var j = 0; j < height; j++) {
				var color = ROT.Color.randomize(base, 5);
				var r = ROT.RNG.getUniform();
				if (r > 0.8) {
					color[2] += ROT.RNG.getUniformInt(3, 10);
				} else if (r > 0.5) {
					color[0] *= 0.2;
					color[1] *= 0.2;
					color[2] *= 0.2;
				}
				texture[i].push(color);
			}
		}
	},

	_renderTexture: function _renderTexture() {
		var data = Level.data;
		var ch = "#";
		var fontSize = data.fontSize * 2;

		var canvas = document.createElement("canvas");
		var ctx = canvas.getContext("2d");
		var font = "bold " + fontSize + "px " + data.fontFamily;
		ctx.font = font;

		var w = ctx.measureText(ch).width;
		var h = fontSize * data.lineHeight;

		canvas.width = this._texture.length * w;
		canvas.height = this._texture[0].length * h;
		ctx.font = font;
		ctx.textBaseline = "top";

		this._texture.forEach(function (value, col) {
			value.forEach(function (value, row) {
				var x = col * w;
				var y = fontSize * (row * data.lineHeight + data.lineHeight / 2 - 0.4);
				ctx.fillStyle = ROT.Color.toRGB(value);
				ctx.fillText(ch, x, y);
			});
		});

		this._dom.node.style.backgroundImage = "url(" + canvas.toDataURL("text/png") + ")";
	},

	_positionPort: function _positionPort() {
		var node = this._dom.node;

		var left = -window.innerWidth * this._current[0];
		var top = -window.innerHeight * this._current[1];
		node.style.left = left + "px";
		node.style.top = top + "px";
	}
};

Level._createIntro = function (depth) {
	var intro = "";

	if (depth == 1) {
		intro = "<p>welcome to the prison. As you might have already noticed, \n\t\tall our cells are full. You really need to fix that.</p>\n\t\t<p>This first level has just one cell. Taking care of that goblin\n\t\tthere shall be an easy task. Just press the <strong>↓</strong> \n\t\t(or <strong>s</strong>) key to move around and do what you must.</p>\n\t\t<p>By the way: you will see your own stats below each enemy.</p>\n\t\t";
	} else if (depth == 2) {
		intro = "<p>good job! Welcome to prison level " + depth + ". The cells \n\t\there are full as well. \n\t\t<p>You can now pick from multiple ways to deal with your enemies.\n\t\tAlso, this level has two cells and both need to be cleared. \n\t\tTo move around, use <strong>←→↑↓</strong> or \n\t\t<strong>WASD</strong> or <strong>HJKL</strong> keys.</p>\n\t\t";
	} else {
		intro = "<p>welcome to prison level " + depth + ". All the cells are full.</p>";
	}

	if (depth == 3) {
		intro = "" + intro + "<p>Keep an eye on your Experience bar. \n\t\tWhen it fills up, you gain an experience level, improving your stats and \n\t\t-- do I really need to explain that in more detail?</p>";
	} else if (Rules.isLevelElemental(depth) && !this.data.elementalAnnounced) {
		this.data.elementalAnnounced = true;
		intro = "" + intro + "<p>A few levels have strong elemental attunement. \n\t\tKeep an eye on these prisoners and try to approach them wisely.</p>";
	} else if (Rules.isLevelShop(depth) && !this.data.shopAnnounced) {
		this.data.shopAnnounced = true;
		intro = "" + intro + "<p>You would not believe this! A few cells are \n\t\toccupied by regular shopkeepers who decided to start their \n\t\tbusiness here. Well, laissez-faire, as they say.</p>";
	}

	if (depth == 6) {
		intro = "" + intro + "<p>As you descend deeper, the number of cells will increase. \n\t\tThey can be also located in multiple rows.</p>";
	}

	if (Rules.getEntityCount(depth) == 10) {
		intro = "" + intro + "<p>These deep prison levels are so crowded that a cell \n\t\tmight even contain multiple monsters! Fortunately, you can deal with them\n\t\tone at a time.</p>";
	}

	intro = "" + intro + "<p class=\"sign\">Yours,<br/>O.</p>";

	if (depth >= 3) {
		var ps = Level._ps;
		intro = "" + intro + "<p class=\"ps\">P.S. They say that " + ps[depth % ps.length] + ".</p>";
	}

	return "<p>Warden,</p>" + intro;
};

Level._ps = ["trapped chests are dangerous", "trapped chests are cool", "eating lutefisk is risky", "elemental resistance is important", "elemental resistance is useless", "fire fox is stronger than goo gel", "goo gel is stronger than fire fox", "you should not trust people", "you should not trust goblins", "deeper prison levels have tougher enemies", "deeper prison levels have more cells", "there is no way out of this prison", "being a warden is cool", "being a warden is risky", "wardens are well paid", "wardens are poorly paid", "captured goldfish may give you a wish", "coffee is hard to beat", "dragons are dangerous", "pangolins are dangerous", "you should keep an eye on your health", "you should keep an eye on your mana", "you should have some ammunition ready", "you shall not fight fire with fire", "you shall not fight water with water", "you shall fight water with fire", "you shall fight fire with water", "arrows are rare", "unicorns are rare", "roses are red, but not in prison", "resistance is futile", "this game is a roguelike", "this game is a roguelite", "there is no save/load in a prison", "levelling up is better than sex", "some shopkeepers are selling stolen goods", "ranged attacks can save your life", "some treasure chests are trapped", "there is a golden treasure hidden somewhere in the prison", "He created this game in seven days"].randomize();
"use strict";

var Debug = function Debug() {
	Level.apply(this, arguments);
	this._dom.node.appendChild(this._minimap.getNode());
};

Debug.prototype = Object.create(Level.prototype);

Debug.prototype._buildCells = function (count, element) {
	var _this = this;

	var beings = [];

	Bestiary.forEach(function (def) {
		var diff = def.diff;

		if (!def.visual.color) {
			for (var p in Elements) {
				var vis = Object.create(def.visual);
				vis.color = Elements[p].color;
				var being = new Being(diff, vis, element);
				beings.push(being);
			}
		} else {
			var being = new Being(diff, def.visual, element);
			beings.push(being);
		}
	});

	var size = Math.ceil(Math.sqrt(beings.length));
	this._size = [size, size];

	this._minimap = new Minimap(this._size[0], this._size[1]);

	for (var j = 0; j < this._size[1]; j++) {
		for (var i = 0; i < this._size[0]; i++) {
			var cell = new Cell(this, [i, j], this._minimap);
			this._cells.push(cell);
		}
	}

	beings.forEach(function (being, index) {
		var cell = _this._cells[index % _this._cells.length];
		cell.addEntity(being);
	});
};
"use strict";

var PC = function PC() {
	this._stats = {};
	this._attacks = {};

	for (var p in Stats) {
		this._stats[p] = Stats[p].def;
	}
	for (var p in Elements) {
		this._attacks[p] = 0;
	}
};

PC.prototype = {
	getStats: function getStats() {
		return this._stats;
	},
	getAttacks: function getAttacks() {
		return this._attacks;
	},
	setStat: function setStat(stat, value) {
		this._stats[stat] = value;
	}
};
"use strict";

var Rules = {

	/* = Generating stuff = */

	getBeingDifficulty: function getBeingDifficulty(difficulty, depth) {
		if (depth <= 2) {
			return depth;
		}
		return Math.round((difficulty + depth) / 2);
	},

	isChestTrapped: function isChestTrapped(depth) {
		return ROT.RNG.getUniform() > 0.5;
	},

	isLevelShop: function isLevelShop(depth) {
		return depth % 7 == 5;
	},

	isLevelElemental: function isLevelElemental(depth) {
		return depth % 5 == 4;
	},

	getEntityCount: function getEntityCount(depth) {
		if (this.isLevelShop(depth)) {
			return 3;
		} else if (depth <= 2) {
			return depth;
		} else if (depth <= 8) {
			return 3;
		} else if (depth <= 12) {
			return 6;
		} else {
			var depthBonus = Math.max(0, depth - 16);
			return 9 + depthBonus;
		}
	},

	/* = Combat outcome = */

	getArrows: function getArrows() {
		/* how many arrows are consumed */
		return ROT.RNG.getUniform() > 0.8 ? 2 : 1;
	},

	getSkillMultiplier: function getSkillMultiplier(skill) {
		/* damage/mana reduction based on skill */
		/* 0 => 1, 100 => 0.5 */
		skill = Math.min(skill, 100);
		var frac = skill / 200;
		return 1 - frac;
	},

	getGoldGain: function getGoldGain(difficulty) {
		return Math.floor(difficulty / 3);
	},

	isArrowFound: function isArrowFound() {
		return ROT.RNG.getUniform() > 0.9;
	},

	isAttackGained: function isAttackGained() {
		return ROT.RNG.getUniform() > 0.5;
	},

	getTrapDamage: function getTrapDamage(depth) {
		return depth;
	},

	getChestDamage: function getChestDamage(depth) {
		return this.getTrapDamage(Math.round(depth / 2));
	},

	getChestGold: function getChestGold(depth) {
		return depth;
	},

	/* = Elemental stuff = */

	getResistanceGain: function getResistanceGain() {
		return ROT.RNG.getUniformInt(0, 3);
	},

	getElementalPenalty: function getElementalPenalty() {
		return 2;
	},

	getElementalBonus: function getElementalBonus() {
		return 0.5;
	},

	/* = Shopping stuff = */

	getPotionCost: function getPotionCost() {
		return 5;
	},

	getPotionStrength: function getPotionStrength() {
		return 5;
	},

	getTrainingCost: function getTrainingCost() {
		return 8;
	},

	getTrainingStrength: function getTrainingStrength() {
		return 5;
	},

	getAmmoCost: function getAmmoCost() {
		return 12;
	},

	getResistanceCost: function getResistanceCost() {
		return 5;
	},

	getResistanceStrength: function getResistanceStrength() {
		return 5;
	},

	/* = Leveling up = */

	getXpRange: function getXpRange(xp) {
		/* XP ranges are 10, 20, 40, ... */
		var c = 10;

		var base = Math.log(1 + xp / c) / Math.LN2;
		base = Math.floor(base);
		return [c * (Math.pow(2, base) - 1), c * (Math.pow(2, base + 1) - 1)];
	},

	getLevelResistance: function getLevelResistance() {
		return 6;
	},

	getLevelSkill: function getLevelSkill() {
		return 6;
	},

	getLevelStat: function getLevelStat() {
		return 1.25;
	}

};
"use strict";

var Gauge = function Gauge(conf) {
	this._conf = {
		label: "",
		color: "",
		min: 0,
		max: 100,
		width: 25,
		oldValue: 0,
		newValue: 100
	};
	for (var p in conf) {
		this._conf[p] = conf[p];
	}

	this._node = document.createElement("div");

	this._build();
};

Gauge.prototype = {
	getNode: function getNode() {
		return this._node;
	},
	_build: function _build() {
		var conf = this._conf;
		this._node.classList.add("gauge");
		this._node.style.backgroundColor = ROT.Color.toRGB(conf.color);

		var diff = conf.newValue - conf.oldValue;
		if (diff) {
			var label = "" + conf.label + " " + (diff > 0 ? "+" : "") + "" + diff;
		} else {
			var label = conf.label;
		}

		if (conf.newValue < conf.min) {
			this._node.classList.add("underflow");
			conf.newValue = conf.min;
		}

		if (conf.newValue > conf.max) {
			this._node.classList.add("overflow");
			conf.newValue = conf.max;
		}

		diff = conf.newValue - conf.oldValue;

		var text = new Array(conf.width + 1).join(" ").split("");
		var start = Math.round((text.length - label.length) / 2);
		for (var i = 0; i < label.length; i++) {
			text[start + i] = label.charAt(i);
		}

		var min = Math.min(conf.oldValue, conf.newValue);
		var max = Math.max(conf.oldValue, conf.newValue);
		var range = conf.max - conf.min;

		var breakPoints = [// in chars; these two must differ
		Math.round((min - conf.min) * conf.width / range), // animation starts here
		Math.round((max - conf.min) * conf.width / range) // empty ends starts here
		];

		if (breakPoints[0] == breakPoints[1] && diff) {
			var exact = (max - conf.min) * conf.width / range;
			if (exact > breakPoints[1]) {
				// upper range was rounded down
				breakPoints[1]++;
			} else {
				// upper range was rounded up
				breakPoints[0]--;
			}
		}

		if (!range) {
			breakPoints[1] = 0;
		} /* zero-zero edge case */

		if (breakPoints[0] > 0) {
			var full = document.createElement("span");
			full.innerHTML = text.slice(0, breakPoints[0]).join("");
			this._node.appendChild(full);
		}

		if (diff) {
			var animate = document.createElement("span");
			animate.classList.add(diff > 0 ? "up" : "down");
			animate.innerHTML = text.slice(breakPoints[0], breakPoints[1]).join("");
			this._node.appendChild(animate);
		}

		if (breakPoints[1] < text.length) {
			var empty = document.createElement("span");
			empty.classList.add("empty");
			empty.innerHTML = text.slice(breakPoints[1]).join("");
			this._node.appendChild(empty);
		}
	}
};
"use strict";

var Chest = function Chest(depth) {
	this._depth = depth;
	this._trapped = Rules.isChestTrapped(depth);
	this._gold = Rules.getChestGold(depth);
	this._damage = Rules.getChestDamage(depth);

	var name = "T" + (this._trapped ? "rapped t" : "") + "reasure chest";
	Entity.call(this, { ch: "$", color: Stats.gold.color, name: name });
};
Chest.prototype = Object.create(Entity.prototype);

Chest.create = function (depth, element) {
	return new this(depth);
};

Chest.prototype.getAttacks = function () {
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
};

Chest.prototype.computeOutcome = function (id) {
	var result = {};
	switch (id) {
		case "ignore":
			break;

		case "open":
			result.gold = this._gold;
			if (this._trapped) {
				result.hp = -this._damage;
			}
			break;
	}

	return result;
};
"use strict";

var Trap = function Trap(depth, color, name) {
	this._damage = Rules.getTrapDamage(depth);

	Entity.call(this, { ch: "^", color: color, name: name });
};
Trap.prototype = Object.create(Entity.prototype);

Trap.create = function (depth, element) {
	if (element) {
		var def = this.ALL.filter(function (def) {
			return def.element == element;
		})[0];
	} else {
		var def = this.ALL.random();
	}

	var color = def.element ? Elements[def.element].color : def.color;

	return new this(depth, color, def.name);
};

Trap.prototype.getAttacks = function () {
	var results = [];

	results.push({
		id: "setoff",
		label: "Set off the trap"
	});

	return results;
};

Trap.prototype.computeOutcome = function (id) {
	var result = {};
	result.hp = -this._damage;

	return result;
};

Trap.ALL = [{
	name: "Fireball trap",
	element: "fire"
}, {
	name: "Splash trap",
	element: "water"
}, {
	name: "Poison dart",
	element: "poison" }, {
	name: "Hidden spikes",
	color: [150, 150, 150]
}, {
	name: "Falling rock trap",
	color: [80, 80, 80] }, {
	name: "Bear trap",
	color: [100, 80, 40]
}];
"use strict";

var Pool = function Pool(depth) {
	var hue = ROT.RNG.getUniform();
	var color = ROT.Color.hsl2rgb([hue, 0.8, 0.8]);
	Entity.call(this, { ch: "≈", color: color, name: "Magic pool" });

	this._outcome = [{ hp: -10 }, { hp: +10 }, { mana: -10 }, { mana: +10 }, { strength: -5 }, { strength: +5 }, { magic: -5 }, { magic: +5 }].random();
};
Pool.prototype = Object.create(Entity.prototype);

Pool.create = function (depth, element) {
	return new this(depth);
};

Pool.prototype.getAttacks = function () {
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
};

Pool.prototype.computeOutcome = function (id) {
	if (id == "ignore") {
		return {};
	} else {
		return this._outcome;
	}
};
"use strict";

var Shopkeeper = function Shopkeeper(name, items) {
	this._items = items;

	var hue = ROT.RNG.getUniform();
	var color = ROT.Color.hsl2rgb([hue, 1, 0.5]);
	Entity.call(this, { ch: "@", color: color, name: name });
};
Shopkeeper.prototype = Object.create(Entity.prototype);

Shopkeeper.create = function (depth) {
	if (ROT.RNG.getUniform() > 0.9) {
		var all = [];
		this.ALL.forEach(function (def) {
			def.items.forEach(function (item) {
				return all.push(item);
			});
		});
		all = all.randomize();
		return new this("C.M.O.T. Dibbler", all.slice(0, 3));
	} else {
		var def = this.ALL.random();
		return new this(def.name, def.items);
	}
};

Shopkeeper.prototype.getAttacks = function () {
	return this._items.map(function (item, index) {
		return {
			id: index,
			label: "Buy " + item.name
		};
	}).concat({
		id: "leave",
		label: "Leave the shop"
	});
};

Shopkeeper.prototype.computeOutcome = function (id) {
	var result = {};

	if (id in this._items) {
		return this._items[id].outcome;
	} else {
		return {};
	}
};

Shopkeeper.ALL = [{
	name: "Potion vendor",
	items: [{
		name: "Small HP potion",
		outcome: {
			hp: Rules.getPotionStrength(),
			gold: -Rules.getPotionCost()
		}
	}, {
		name: "Medium HP potion",
		outcome: {
			hp: 2 * Rules.getPotionStrength(),
			gold: -2 * Rules.getPotionCost()
		}
	}, {
		name: "Large HP potion",
		outcome: {
			hp: 3 * Rules.getPotionStrength(),
			gold: -3 * Rules.getPotionCost()
		}
	}]
}, {
	name: "Mana dealer",
	items: [{
		name: "Mana scroll",
		outcome: {
			mana: Rules.getPotionStrength(),
			gold: -Rules.getPotionCost()
		}
	}, {
		name: "Mana book",
		outcome: {
			mana: 2 * Rules.getPotionStrength(),
			gold: -2 * Rules.getPotionCost()
		}
	}, {
		name: "Lutefisk",
		outcome: {
			mana: 3 * Rules.getPotionStrength(),
			hp: -Rules.getPotionStrength(),
			gold: -3 * Rules.getPotionCost()
		}
	}]
}, {
	name: "Skill trainer",
	items: [{
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
	}]
}, {
	name: "Ammunitioner",
	items: [{
		name: "1 arrow",
		outcome: {
			ammo: 1,
			gold: -Rules.getAmmoCost()
		}
	}, {
		name: "2 arrows",
		outcome: {
			ammo: 2,
			gold: -2 * Rules.getAmmoCost()
		}
	}, {
		name: "3 arrows",
		outcome: {
			ammo: 3,
			gold: -3 * Rules.getAmmoCost()
		}
	}]
}, {
	name: "Elemental scholar",
	items: [{
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
	}]
}];
"use strict";

var Bestiary = [{
	visual: {
		name: "Goblin",
		ch: "g",
		color: [20, 250, 20]
	},
	variants: ["{} Chieftain", "Large {}", "{} King"],
	diff: 3
}, {
	visual: {
		name: "Rat",
		ch: "r",
		color: [150, 100, 20]
	},
	variants: ["Giant {}"],
	diff: 3
}, {
	visual: {
		name: "Bat",
		ch: "b",
		color: [180, 180, 180]
	},
	variants: ["Giant {}"],
	diff: 3
}, {
	visual: {
		name: "Dog",
		ch: "d",
		color: [180, 160, 100]
	},
	variants: ["Large {}"],
	diff: 3
}, {
	visual: {
		name: "Swordsman",
		ch: "s",
		color: [50, 50, 180]
	},
	diff: 8
}, {
	visual: {
		name: "Outlaw",
		ch: "t",
		color: [70, 70, 70]
	},
	diff: 5
}, {
	visual: {
		name: "Pangolin",
		ch: "p",
		color: [150, 100, 20]
	},
	variants: ["Giant {}"],
	min: 3,
	diff: 5
}, {
	visual: {
		name: "Orc",
		ch: "o",
		color: [20, 150, 20]
	},
	variants: ["Large {}", "{} Leader"],
	min: 5,
	diff: 8
}, {
	visual: {
		name: "Ogre",
		ch: "O",
		color: [20, 20, 200]
	},
	variants: ["{} Magus", "{} King"],
	min: 6,
	diff: 10
}, {
	visual: {
		name: "Carnivorous gelatine",
		ch: "j",
		color: [240, 20, 240]
	},
	min: 5,
	diff: 12
}, {
	visual: {
		name: "Worm",
		ch: "w"
	},
	variants: ["Large {}"],
	min: 4,
	diff: 7
}, {
	visual: {
		name: "Beetle",
		ch: "i"
	},
	variants: ["Large {}"],
	min: 4,
	diff: 7
}, {
	visual: {
		name: "Lizard",
		ch: "l"
	},
	variants: ["Large {}"],
	min: 5,
	diff: 10
}, {
	visual: {
		name: "Elemental",
		ch: "e"
	},
	variants: ["Large {}"],
	min: 8,
	diff: 12
}, {
	visual: {
		name: "Dragon",
		ch: "D",
		color: [250, 230, 20]
	},
	min: 12,
	diff: 16
}, {
	visual: {
		name: "Dragon",
		ch: "D"
	},
	min: 12,
	diff: 16
}, {
	visual: {
		name: "Hydra",
		ch: "H",
		color: [200, 150, 20]
	},
	min: 15,
	diff: 18
}, {
	visual: {
		name: "Ghost",
		ch: "g",
		color: [200, 200, 200]
	},
	variants: ["Large {}"],
	min: 7,
	diff: 10
}, {
	visual: {
		name: "Zombie",
		ch: "z",
		color: [20, 120, 120]
	},
	variants: ["Large {}"],
	min: 8,
	diff: 12
}, {
	visual: {
		name: "Mummy",
		ch: "Z",
		color: [250, 220, 20]
	},
	min: 12,
	diff: 15
}, {
	visual: {
		name: "Vampire",
		ch: "V",
		color: [220, 20, 220]
	},
	min: 14,
	diff: 18
}];
"use strict";

var Minimap = function Minimap(width, height) {
	this._node = document.createElement("table");
	this._node.classList.add("minimap");

	this._cells = [];

	for (var j = 0; j < height; j++) {
		var tr = document.createElement("tr");
		this._node.appendChild(tr);
		this._cells.push([]);
		for (var i = 0; i < width; i++) {
			var td = document.createElement("td");
			this._cells[j].push(td);
			tr.appendChild(td);
		}
	}
};

Minimap.prototype = {
	getNode: function getNode() {
		return this._node;
	},
	focus: function focus(x, y) {
		this._cells[y][x].classList.add("active");
	},
	blur: function blur(x, y) {
		this._cells[y][x].classList.remove("active");
	},
	set: function set(x, y, ch, color) {
		var cell = this._cells[y][x];
		cell.innerHTML = ch;
		cell.style.color = color;
	}
};
"use strict";

var Game = function Game() {
	this._dom = {
		intro: document.createElement("div"),
		outro: document.createElement("div")
	};
	this._level = null;

	window.addEventListener("resize", this);
	this._resize();

	this._start();
};

Game.prototype = {
	nextLevel: function nextLevel() {
		var depth = this._level ? this._level.getDepth() : 0;
		depth++;

		var w = window.innerWidth;
		var h = window.innerHeight;

		this._level && this._level.deactivate();
		this._level = Level.create(depth);
		this._level.activate(w, h);
	},

	over: function over() {
		window.addEventListener("keydown", this);
		this._level.deactivate();

		var depth = this._level.getDepth();
		var gold = pc.getStats().gold;
		var url = encodeURIComponent(location.href);
		var status = encodeURIComponent("I got to level " + depth + " at Warden's Duty, \n\t\tcollecting " + gold + " gold pieces! " + location.href);

		var node = this._dom.outro;
		node.id = "outro";
		node.innerHTML = "<h1>Game over</h1>\n\t\t\t<p>You are unable to continue your duty. All the vicious\n\t\t\tcritters locked inside cells are too hard to defeat \n\t\t\tand the game is over.</p>\n\n\t\t\t<p>On the other hand, you did a fine job cleaning the \n\t\t\tprison up. Many cells are now free and you managed to descend\n\t\t\tto level <strong>" + depth + "</strong>. You also gathered \n\t\t\t<span style=\"color:" + ROT.Color.toHex(Stats.gold.color) + "\">" + gold + "</span> gold pieces. \n\t\t\tClick the icons below to share your score!</p>\n\t\t\t\n\t\t\t<a class=\"twitter\" href=\"https://twitter.com/home?status=" + status + "\">\n\t\t\t\t<span>t</span>\n\t\t\t\t<br/>Twitter\n\t\t\t</a>\n\n\t\t\t<a class=\"gplus\" href=\"https://plus.google.com/share?url=" + url + "\">\n\t\t\t\t<span>g+</span>\n\t\t\t\t<br/>Google Plus\n\t\t\t</a>\n\t\t\t\n\t\t\t<a class=\"fb\" href=\"https://www.facebook.com/sharer/sharer.php?u=" + url + "\">\n\t\t\t\t<span>f</span>\n\t\t\t\t<br/>Facebook\n\t\t\t</a>\n\n\t\t\t<p>Press <strong>Enter</strong> to play again! (You will make it further this time...)</p>\n\t\t";
		document.body.insertBefore(node, document.body.firstChild);
	},

	handleEvent: function handleEvent(e) {
		var _this = this;

		if (e.type == "resize") {
			this._resize();
			return;
		}

		if (e.keyCode != 13) {
			return;
		}

		if (this._level) {
			location.reload();
		} else {
			window.removeEventListener("keydown", this);
			this.nextLevel();
			this._dom.intro.classList.add("transparent");
			setTimeout(function () {
				_this._dom.intro.parentNode.removeChild(_this._dom.intro);
			}, 3000);
		}
	},

	_resize: function _resize() {
		var w = window.innerWidth;
		var h = window.innerHeight;

		/* FIXME ne nekde u game? */
		var data = Level.data;
		data.fontSize = h / 30;
		document.documentElement.style.fontSize = data.fontSize + "px";

		/* fixme zbytecne? */
		document.documentElement.style.lineHeight = data.lineHeight;

		this._level && this._level.resize(w, h);
	},

	_start: function _start() {
		var node = this._dom.intro;
		node.id = "intro";

		node.innerHTML = "<h1>Warden's Duty</h1>\n\t\t\t<p>The game you are about to play is a 7DRL. It was created \n\t\t\tin a limited time, might exhibit strange bugs and some \n\t\t\tsay it contains <em>roguelike</em> (‽) elements. \n\t\t\tYou will encounter goblins, rats, dragons, pangolins and \n\t\t\tmaybe even a lutefisk.\n\t\t\t<a href=\"https://www.youtube.com/watch?v=6dNAbb7vKjY\">Be prepared.</a></p>\n\t\t\t\n\t\t\t<p>Warden's Duty was created by \n\t\t\t<a href=\"http://ondras.zarovi.cz/\">Ondřej Žára</a> and the \n\t\t\tcomplete source code is available on\n\t\t\t<a href=\"https://github.com/ondras/wardens-duty\">GitHub</a>.\n\t\t\tIf you find the game's layout broken, try adjusting your window\n\t\t\tto be more <em>widescreen</em>, i.e. considerably wider than it is tall.</p>\n\t\t\t\n\t\t\t<p>To start the game, please press <strong>Enter</strong>.</p> \n\t\t";
		document.body.appendChild(node);

		window.addEventListener("keydown", this);
	}
};

var pc = new PC();
var game = new Game();
