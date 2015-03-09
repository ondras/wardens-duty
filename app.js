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
		def: 0
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
	this._switchAttack(0);
};

Cell.prototype = {
	activate: function activate() {
		window.addEventListener("keypress", this);
		window.addEventListener("keydown", this);

		if (!this._done) {
			this._syncAttacks();
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
		this._current = attackIndex;
		this._dom.gauges.innerHTML = "";

		var attack = this._attacks[this._current];
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
		ch.style.color = visual.color;
		this._dom.entity.appendChild(ch);
		this._dom.node.appendChild(this._dom.entity);

		/* label */
		var label = document.createElement("div");
		label.classList.add("label");
		label.innerHTML = "<span>" + entity.getName() + "</span>";
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

		this._syncAttacks();
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

	_syncAttacks: function _syncAttacks() {
		var _this = this;

		this._attacks.forEach(function (attack, index) {
			attack.disabled = _this._isAttackDisabled(attack.id);
			attack.node.classList[attack.disabled ? "add" : "remove"]("disabled");
		});

		this._syncConfirm();
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
	this._visual = {
		ch: Math.random() > 0.5 ? "g" : "r",
		color: "#2a2"
	};
	this._name = "Goblin";
};

Entity.prototype = {
	getVisual: function getVisual() {
		return this._visual;
	},
	getName: function getName() {
		return this._name;
	},

	getAttacks: function getAttacks() {},

	computeOutcome: function computeOutcome(attack) {},

	doAttack: function doAttack(attack) {
		var outcome = this.computeOutcome(attack);
	}
};
"use strict";

var Being = function Being() {
	Entity.call(this);
};

Being.prototype = Object.create(Entity.prototype);

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

	results.push({
		id: "magic",
		label: "Magic missile"
	});
	results.push({
		id: "magic",
		label: "Magic missile"
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
			outcome.hp = -150;
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
"use strict";

var Level = (function (_Level) {
	var _LevelWrapper = function Level(_x) {
		return _Level.apply(this, arguments);
	};

	_LevelWrapper.toString = function () {
		return _Level.toString();
	};

	return _LevelWrapper;
})(function (depth) {
	this._depth = depth;
	this._size = [2, 3];
	this._cells = [];
	this._current = [-1, -1];

	this._dom = {
		node: document.createElement("div"),
		intro: document.createElement("div")
	};

	var count = this._size[0] * (this._size[1] - 1);
	for (var i = 0; i < count; i++) {
		var being = new Being();
		var cell = new Cell(this, being);
		this._cells.push(cell);
	}

	if (!Level.data.random) {
		this._createTextureData();
	}

	this._build();
	this._resize();
	this.checkCells();
});

Level.data = {
	fontSize: 24,
	lineHeight: 1,
	random: null,
	fontFamily: "serif",
	texture: ""
};

Level.prototype = {
	activate: function activate() {
		window.addEventListener("keypress", this);
		window.addEventListener("keydown", this);
		window.addEventListener("resize", this);

		document.body.appendChild(this._dom.node);
		this._activateCell(0, 0);
	},

	deactivate: function deactivate() {
		window.removeEventListener("keypress", this);
		window.removeEventListener("keydown", this);
		window.removeEventListener("resize", this);

		this._dom.node.parentNode.removeChild(this._dom.node);
		this._cells.forEach(function (cell) {
			return cell.deactivate();
		});
	},

	getDepth: function getDepth() {
		return this._depth;
	},

	checkCells: function checkCells() {
		var doable = this._cells.some(function (cell) {
			return cell.isDoable();
		});
		var done = this._cells.some(function (cell) {
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

	handleEvent: function handleEvent(e) {
		if (e.type == "resize") {
			this._updateSizeData();
			this._resize();
			return;
		}

		if (e.ctrlKey || e.altKey || e.metaKey) {
			return;
		}
		var what = e.type == "keydown" ? e.keyCode : String.fromCharCode(e.charCode);

		switch (what) {
			/* FIXME rot constants? */
			case 37:
			case "a":
			case "h":
				this._activateCell(this._current[0] - 1, this._current[1]);
				break;
			case 38:
			case "w":
			case "k":
				this._activateCell(this._current[0], this._current[1] - 1);
				break;
			case 39:
			case "d":
			case "l":
				this._activateCell(this._current[0] + 1, this._current[1]);
				break;
			case 40:
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

	_updateSizeData: function _updateSizeData() {
		var data = Level.data;
		data.fontSize = window.innerHeight / 30;
		document.documentElement.style.fontSize = data.fontSize + "px";
		document.documentElement.style.lineHeight = data.lineHeight;

		this._renderTexture();
	},

	_activateCell: function _activateCell(x, y) {
		if (x < 0 || y < 0 || x >= this._size[0] || y >= this._size[1]) {
			return;
		}
		if (y == 0 && x > 0) {
			return;
		}

		this._current = [x, y];
		this._positionPort();

		var index = x + (y - 1) * this._size[0];
		if (index >= 0) {
			this._cells[index].activate();
		}
	},

	_build: function _build() {
		var _this = this;

		this._dom.node.classList.add("level");

		this._dom.intro.classList.add("cell");
		this._dom.node.appendChild(this._dom.intro);

		var intro = document.createElement("div");
		intro.classList.add("intro");
		intro.innerHTML = "This is intro pico";
		this._dom.intro.appendChild(intro);

		this._cells.forEach(function (cell) {
			return _this._dom.node.appendChild(cell.getNode());
		});
	},

	_createTextureData: function _createTextureData() {
		var data = Level.data;
		data.random = [];

		var width = 13;
		var height = 6;
		for (var i = 0; i < width; i++) {
			data.random.push([]);
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
				data.random[i].push(color);
			}
		}
		this._updateSizeData();
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

		canvas.width = data.random.length * w;
		canvas.height = data.random[0].length * h;
		ctx.font = font;
		ctx.textBaseline = "top";

		data.random.forEach(function (value, col) {
			value.forEach(function (value, row) {
				var x = col * w;
				var y = fontSize * (row * data.lineHeight + data.lineHeight / 2 - 0.4);
				ctx.fillStyle = ROT.Color.toRGB(data.random[col][row]);
				ctx.fillText(ch, x, y);
			});
		});

		Level.data.texture = "url(" + canvas.toDataURL("text/png") + ")";
	},

	_resize: function _resize() {
		var _this = this;

		var w = window.innerWidth;
		var h = window.innerHeight;

		var node = this._dom.node;
		node.style.width = this._size[0] * w + "px";
		node.style.height = this._size[1] * h + "px";
		node.style.backgroundImage = Level.data.texture;

		this._dom.intro.style.width = w + "px";
		this._dom.intro.style.height = h + "px";

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

	_positionPort: function _positionPort() {
		var node = this._dom.node;

		var left = -window.innerWidth * this._current[0];
		var top = -window.innerHeight * this._current[1];
		node.style.left = left + "px";
		node.style.top = top + "px";
	}
};
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

	this._start();
};

Game.prototype = {
	nextLevel: function nextLevel() {
		var depth = this._level ? this._level.getDepth() : 0;
		depth++;

		this._level && this._level.deactivate();
		this._level = new Level(depth);
		this._level.activate();
	},

	over: function over() {
		window.addEventListener("keydown", this);

		var node = this._dom.outro;
		node.id = "outro";
		node.innerHTML = "Game over jak cyp";
		/* FIXME outro */
		node.classList.add("transparent");
		document.body.appendChild(node);

		setTimeout(function () {
			node.classList.remove("transparent");
		}, 0);
	},

	handleEvent: function handleEvent(e) {
		var _this = this;

		if (e.keyCode != 13) {
			return;
		}

		window.removeEventListener("keydown", this);

		if (this._level.getDepth() > 1) {
			location.reload();
		} else {
			this._dom.intro.classList.add("transparent");
			setTimeout(function () {
				_this._dom.intro.parentNode.removeChild(_this._dom.intro);
			}, 2000);
		}
	},

	_start: function _start() {
		this.nextLevel();
		var node = this._dom.intro;
		node.id = "intro";

		node.innerHTML = "<h1>Warden's Duty</h1>\n\t\t<p>The game you are about to play blah blah blah </p>\n\t\t";
		document.body.appendChild(node);

		window.addEventListener("keydown", this);
	}
};

var pc = new PC();
var game = new Game();
