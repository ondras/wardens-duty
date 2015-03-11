"use strict";

var Attacks = {
	melee: {},

	ranged: {},

	buy: {},

	cancel: {}
};

var Stats = {
	hp: {
		label: "Health",
		color: "#3e3",
		def: 100
	},
	maxhp: {
		def: 100
	},
	mana: {
		label: "Mana",
		color: "#33e",
		def: 100
	},
	maxmana: {
		def: 100
	},
	gold: {
		label: "Gold",
		color: "#ee3",
		def: 0
	},
	ammo: {
		label: "Arrows",
		color: "#a82",
		def: 3
	},
	xp: {
		label: "Experience",
		color: "#a3a",
		def: 5
	}
};

var Elements = {
	poison: {
		label: "Poison",
		def: 0
	},

	fire: {
		label: "Fire",
		def: 0
	},

	water: {
		label: "Water",
		def: 0
	}
};

Object.keys(Elements).forEach(function (key) {
	Stats["res-" + key] = {
		label: "" + Elements[key].label + " resistance",
		def: 0
	};

	Attacks["elemental-" + key] = {};
});
"use strict";

var Cell = function Cell(level, entity) {
	this._level = level;
	this._entity = entity;
	this._current = 0;
	this._done = false;

	this._dom = {
		node: document.createElement("div"),
		entity: document.createElement("div"),
		info: document.createElement("div"),
		attacks: document.createElement("div"),
		gauges: document.createElement("div"),
		confirm: document.createElement("div")
	};

	this._attacks = this._entity.getAttacks();
	this._build();
};

Cell.prototype = {
	activate: function activate() {
		window.addEventListener("keypress", this);
		window.addEventListener("keydown", this);

		if (!this._done) {
			this.syncAttacks();
		}
	},

	deactivate: function deactivate() {
		window.removeEventListener("keypress", this);
		window.removeEventListener("keydown", this);
	},

	getNode: function getNode() {
		return this._dom.node;
	},

	resize: function resize(w, h) {
		this._dom.node.style.width = w + "px";
		this._dom.node.style.height = h + "px";
	},

	isDone: function isDone() {
		return this._done;
	},

	isDoable: function isDoable() {
		return this._attacks.some(function (attack) {
			return !attack.disabled;
		});
	},

	syncAttacks: function syncAttacks() {
		var _this = this;

		this._attacks.forEach(function (attack, index) {
			attack.disabled = _this._isAttackDisabled(attack.id);
			attack.node.classList[attack.disabled ? "add" : "remove"]("disabled");
		});

		this._switchAttack(this._current);
	},

	handleEvent: function handleEvent(e) {
		if (this._done) {
			/* done confirmation */
			this._finalize();
			return;
		}

		switch (e.type) {
			case "keydown":
				if (e.keyCode != 13) {
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

	_switchAttack: function _switchAttack(attackIndex) {
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
		this._buildGauge(box1, stats, outcome, "gold");
		this._buildGauge(box1, stats, outcome, "xp");

		var box2 = document.createElement("div");
		box2.classList.add("group");

		this._buildGauge(box2, stats, outcome, "res-fire");
		this._buildGauge(box2, stats, outcome, "res-water");
		this._buildGauge(box2, stats, outcome, "res-poison");

		this._dom.gauges.appendChild(box1);
		this._dom.gauges.appendChild(box2);

		this._syncConfirm();
	},

	_build: function _build() {
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
		label.innerHTML = "<span>" + visual.name + "</span>";
		this._dom.info.appendChild(label);

		this._buildAttacks();
		this._dom.info.appendChild(this._dom.gauges);

		this._dom.node.appendChild(this._dom.info);
	},

	_buildAttacks: function _buildAttacks() {
		var ul = document.createElement("ul");

		this._attacks.forEach(function (attack, index) {
			attack.node = document.createElement("li");
			attack.node.innerHTML = attack.label;
			ul.appendChild(attack.node);
		});

		this._dom.attacks.appendChild(ul);
		this._dom.attacks.appendChild(this._dom.confirm);
		this._dom.info.appendChild(this._dom.attacks);
	},

	_buildGauge: function _buildGauge(node, stats, outcome, type) {
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
		} else if (type == "ammo" || type == "gold") {
			var oldValue = stats[type];
			var newValue = this._getNewValue(stats, outcome, type);
			conf.max = Math.max(oldValue, newValue);
		}

		var gauge = new Gauge(conf);
		node.appendChild(gauge.getNode());
	},

	_getNewValue: function _getNewValue(stats, outcome, type) {
		return stats[type] + (type in outcome ? outcome[type] : 0);
	},

	_isAttackDisabled: function _isAttackDisabled(id) {
		var outcome = this._entity.computeOutcome(id);
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

	_doAttack: function _doAttack() {
		this._dom.entity.querySelector("span").style.color = "#000";

		var id = this._attacks[this._current].id;
		var result = this._entity.doAttack(id);

		this._done = true;

		if (result) {
			/* we need to show this text and wait for a confirmation */
			/* FIXME show result */
			this._dom.info.innerHTML = result;
		} else {
			/* pass control back to level */
			this._finalize();
		}
	},

	_syncConfirm: function _syncConfirm() {

		var attack = this._attacks[this._current];
		var node = this._dom.confirm;

		if (attack.disabled) {
			node.classList.add("disabled");
			node.innerHTML = "Impossible to do";
		} else {
			node.classList.remove("disabled");
			node.innerHTML = "<span>Enter</span> to confirm";
		}
	},

	_finalize: function _finalize() {
		this._dom.info.innerHTML = "";
		this.deactivate();
		this._level.checkCells();
	}
};
"use strict";

var Entity = function Entity() {
	var visual = arguments[0] === undefined ? { ch: "?", color: "#fff", name: "" } : arguments[0];

	this._visual = visual;
};

Entity.create = function (depth, element) {
	/* FIXME shopeepers, traps, chests, more?? */
	return Being.create(depth, element);
};

Entity.prototype = {
	getVisual: function getVisual() {
		return this._visual;
	},

	getAttacks: function getAttacks() {},

	computeOutcome: function computeOutcome(attack) {},

	doAttack: function doAttack(attack) {
		var outcome = this.computeOutcome(attack);
		var stats = pc.getStats();

		for (var p in outcome) {
			stats[p] += outcome[p];
			/* FIXME xp */
		}
	}
};
"use strict";

var Being = function Being(difficulty, visual) {
	Entity.call(this, visual);
	this._difficulty = difficulty;
};
Being.prototype = Object.create(Entity.prototype);

Being.create = function (depth, element) {
	var visual = null;
	if (depth == 1) {
		visual = this.ALL.goblin.visual;
	} else {
		var avail = [];
		for (var p in this.ALL) {
			/* filter all types and their variants */
			this._availableVariants(depth, p, avail);
		}

		var result = avail.random();
		var def = this.ALL[result.type];
		var visual = Object.create(def.visual);

		if (result.variant > 0) {
			visual.name = def.variants[result.variant - 1].replace("{}", visual.name);
			visual.color = ROT.Color.interpolate(visual.color, [0, 0, 0], result.variant / 10);
			if (result.variant >= def.variants.length / 2) {
				visual.ch = visual.ch.toUpperCase();
			}
		}
	}
	return new this(depth, visual);
};

Being._availableVariants = function (depth, type, available) {
	var def = this.ALL[type];

	var min = def.min || 0;
	var max = def.max || Infinity;
	if (depth >= min && depth <= max) {
		available.push({ type: type, variant: 0 });
	}

	max && def.variants && def.variants.forEach(function (variant, index) {
		var range = max - min;
		var variantMin = min + range * (index + 1) / 2;
		var variantMax = variantMin + range;
		if (depth >= variantMin && depth <= variantMax) {
			available.push({ type: type, variant: index + 1 });
		}
	});
};

Being.prototype.getAttacks = function (pc) {
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
};

Being.prototype.computeOutcome = function (attack) {
	var outcome = {};

	outcome.xp = +5;

	switch (attack) {
		case "melee":
			outcome.hp = -50;
			break;

		case "ranged":
			outcome.ammo = -1;
			break;

		case "magic":
			outcome.mana = -2;
			break;
	}

	return outcome;
};

Being.ALL = {
	goblin: {
		visual: {
			name: "Goblin",
			ch: "g",
			color: [20, 250, 20]
		},
		variants: ["{} Chieftain", "Large {}", "{} King"],
		max: 10
	},

	rat: {
		visual: {
			name: "Rat",
			ch: "g",
			color: [150, 100, 20]
		},
		variants: ["Giant {}"],
		max: 10
	},

	bat: {
		visual: {
			name: "Bat",
			ch: "b",
			color: [180, 180, 180]
		},
		variants: ["Giant {}"],
		max: 10
	} };
"use strict";

/**
 * @param {int} depth
 * @param {int[2]} size
 * @param {string} intro Introduction HTML
 * @param {string} [element] For element-specific levels
 */
var Level = function Level(depth, size, intro, element) {
	this._depth = depth;
	this._size = size;
	this._size[1]++; // room for the intro cell

	this._cells = [];
	this._current = null;
	this._texture = [];

	this._dom = {
		node: document.createElement("div"),
		intro: document.createElement("div")
	};

	var count = this._size[0] * (this._size[1] - 1);
	for (var i = 0; i < count; i++) {
		var entity = Entity.create(depth, element);
		var cell = new Cell(this, entity);
		this._cells.push(cell);
	}

	this._build(intro);
	this.checkCells();
};

Level.create = function (depth) {
	/**
  * General level layout:
  *     1. one goblin
  *     2:  ?
  *  7n-2: shops
  *    4n: elemental
  *    3+: with "P.S." in intro
  */

	var intro = this._createIntro(depth);
	return new this(depth, [1, 1], intro);
};

Level.data = {
	fontSize: 24,
	lineHeight: 1,
	fontFamily: "serif"
};

Level.prototype = {
	activate: function activate(w, h) {
		window.addEventListener("keypress", this);
		window.addEventListener("keydown", this);

		this._activateCell(0, 0);
		this.resize(w, h);
		document.body.appendChild(this._dom.node);
	},

	deactivate: function deactivate() {
		window.removeEventListener("keypress", this);
		window.removeEventListener("keydown", this);

		this._dom.node.parentNode.removeChild(this._dom.node);
		this._cells.forEach(function (cell) {
			return cell.deactivate();
		});
	},

	getDepth: function getDepth() {
		return this._depth;
	},

	checkCells: function checkCells() {
		this._cells.forEach(function (cell) {
			return cell.syncAttacks();
		});
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
			var index = this._current[0] + (this._current[1] - 1) * this._size[0];
			if (index >= 0) {
				this._cells[index].deactivate();
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

	_build: function _build(introHTML) {
		var _this = this;

		this._createTextureData();

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
	},

	_createTextureData: function _createTextureData() {
		var texture = this._texture;

		var width = 13;
		var height = 6;
		for (var i = 0; i < width; i++) {
			texture.push([]);
			for (var j = 0; j < height; j++) {
				var color = ROT.Color.randomize([40, 40, 40], 5);
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
		intro = "<p>welcome to the prison. As you might have already noticed, \n\t\tall our cells are full. You really need to take care of that.</p>";
	} else {
		intro = "<p>welcome to prison level " + depth + ". All the cells are full.</p>";
	}

	intro = "" + intro + "<p class=\"sign\">Yours,<br/>O.</p>";

	if (depth >= 1) {
		var ps = Level._ps;
		intro = "" + intro + "<p class=\"ps\">P.S. They say that " + ps[depth % ps.length] + ".</p>";
	}

	return "<p>Warden,</p>" + intro;
};

Level._ps = ["aaa", "bbb", "ccc"].randomize();
"use strict";

var PC = function PC() {
	this._stats = {};
	this._attacks = {};

	for (var p in Stats) {
		this._stats[p] = Stats[p].def;
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

var Gauge = function Gauge(conf) {
	this._conf = {
		label: "",
		color: "",
		min: 0,
		max: 100,
		width: 30,
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
		this._node.style.backgroundColor = conf.color;

		if (conf.newValue < conf.min) {
			this._node.classList.add("underflow");
			conf.newValue = conf.min;
		}

		if (conf.newValue > conf.max) {
			this._node.classList.add("overflow");
			conf.newValue = conf.max;
		}

		var diff = conf.newValue - conf.oldValue;
		if (diff) {
			var label = "" + conf.label + " " + (diff > 0 ? "+" : "") + "" + diff;
		} else {
			var label = conf.label;
		}

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

		var node = this._dom.outro;
		node.id = "outro";
		var depth = this._level.getDepth();
		node.innerHTML = "<h1>Game over</h1>\n\t\t\t<p>You are unable to continue your duty. All the vicious\n\t\t\tcritters locked inside cells are too hard to defeat \n\t\t\tand the game is over.</p>\n\n\t\t\t<p>On the other hand, you did a fine job cleaning the \n\t\t\tprison up. Many cells are now free and you managed to descend\n\t\t\tto level " + depth + ". Click the icons below to share your \n\t\t\tscore!</p>\n\t\t\t\n\t\t\t<a class=\"twitter\">\n\t\t\t\t<span>t</span>\n\t\t\t\t<br/>Twitter\n\t\t\t</a>\n\n\t\t\t<a class=\"gplus\">\n\t\t\t\t<span>g+</span>\n\t\t\t\t<br/>Google Plus\n\t\t\t</a>\n\t\t\t\n\t\t\t<a class=\"fb\">\n\t\t\t\t<span>f</span>\n\t\t\t\t<br/>Facebook\n\t\t\t</a>\n\n\t\t\t<p>Press <strong>Enter</strong> to play again!</p>\n\t\t";
		/* FIXME outro */
		node.classList.add("transparent");
		document.body.appendChild(node);

		setTimeout(function () {
			node.classList.remove("transparent");
		}, 0);
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

		node.innerHTML = "<h1>Warden's Duty</h1>\n\t\t\t<p>The game you are about to play is a 7DRL. It was created \n\t\t\tin a limited time, might exhibit strange bugs and some \n\t\t\tsay it contains <em>roguelike</em> (‽) elements. \n\t\t\tYou will encounter goblins, rats, dragons, pangolins and \n\t\t\tmaybe even a lutefisk.\n\t\t\t<a href=\"https://www.youtube.com/watch?v=6dNAbb7vKjY\">Be prepared.</a></p>\n\t\t\t\n\t\t\t<p>Warden't Duty was created by \n\t\t\t<a href=\"http://ondras.zarovi.cz/\">Ondřej Žára</a> and the \n\t\t\tcomplete source code is available on\n\t\t\t<a href=\"https://github.com/ondras/wardens-duty\">GitHub</a>.\n\t\t\tIf you find the game's layout broken, try adjusting your window\n\t\t\tto be more \"widescreen\", i.e. considerably wider than it is tall.</p>\n\t\t\t\n\t\t\t<p>To start the game, please press <strong>Enter</strong>.</p> \n\t\t";
		document.body.appendChild(node);

		window.addEventListener("keydown", this);

		this.nextLevel();
		this.over();
	}
};

var pc = new PC();
var game = new Game();
