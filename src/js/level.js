/**
 * @param {int} depth
 * @param {int} count
 * @param {string} intro Introduction HTML
 * @param {string} [element] For element-specific levels
 */
var Level = function(depth, count, intro, element) {
	this._depth = depth;
	this._cells = [];
	this._current = null;
	this._texture = [];
	
	this._dom = {
		node: document.createElement("div"),
		intro: document.createElement("div")
	}

	if (count <= 3) {
		this._size = [count, 1];
	} else if (count <= 6) {
		this._size = [count/2, 2];
	} else {
		this._size = [3, 3];
	}

	this._buildCells(count, element);

	this._size[1]++; // room for the intro cell
	this._build(intro, element);
	this.syncCells();
}

Level.create = function(depth) {
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
	var ctor = (location.hash == "#debug" ? Debug : this);
	return new ctor(depth, count, intro, element);
}

Level.data = {
	fontSize: 24,
	lineHeight: 1,
	fontFamily: "deja vu serif, verdana",
	elementalAnnounced: false,
	shopAnnounced: false
}

Level.prototype = {
	activate(w, h) {
		window.addEventListener("keypress", this);
		window.addEventListener("keydown", this);

		this._activateCell(0, 0);
		this.resize(w, h);
		document.body.insertBefore(this._dom.node, document.body.firstChild);
	},

	deactivate() {
		window.removeEventListener("keypress", this);
		window.removeEventListener("keydown", this);

		this._dom.node.classList.add("done");
		this._cells.forEach(cell => cell.deactivate());

		setTimeout(() => this._dom.node.parentElement.removeChild(this._dom.node), 1500);
	},
	
	getDepth() {
		return this._depth;
	},

	syncCells() {
		this._cells.forEach(cell => cell.syncAttacks());
	},
	
	checkLevelOver() {
		var doable = this._cells.some(cell => cell.isDoable() && !cell.isDone());
		var done = this._cells.every(cell => cell.isDone());

		if (done) { /* level done, switch to another */
			game.nextLevel();
		} else if (!doable) { /* game over */
			game.over();
		}
	},

	resize(w, h) {
		var node = this._dom.node;
		node.style.width = (this._size[0]*w) + "px";
		node.style.height = (this._size[1]*h) + "px";

		this._dom.intro.style.width = w+"px";
		this._dom.intro.style.height = h+"px";

		this._renderTexture();

		this._cells.forEach((cell, index) => {
			var x = index % this._size[0];
			var y = Math.floor(index / this._size[0]) + 1;

			cell.resize(w, h);
			var node = cell.getNode();
			node.style.left = (x*w) + "px";
			node.style.top = (y*h) + "px";
		});

		this._positionPort();
	},

	handleEvent(e) {
		if (e.ctrlKey || e.altKey || e.metaKey) { return; }
		var what = (e.type == "keydown" ? e.keyCode : String.fromCharCode(e.charCode));

		switch (what) {
			case ROT.VK_LEFT:
			case "a":
			case "h":
				this._activateCell(this._current[0]-1, this._current[1]);
			break;
			case ROT.VK_UP:
			case "w":
			case "k":
				this._activateCell(this._current[0], this._current[1]-1);
			break;
			case ROT.VK_RIGHT:
			case "d":
			case "l":
				this._activateCell(this._current[0]+1, this._current[1]);
			break;
			case ROT.VK_DOWN:
			case "s":
			case "j":
				this._activateCell(this._current[0], this._current[1]+1);
			break;

			default:
				return;
			break;
		}
		e.preventDefault();
	},

	_activateCell(x, y) {
		if (!this._isValid(x, y)) { return; }

		if (this._current) { /* consider currently selected cell */
			var index = this._current[0] + (this._current[1]-1)*this._size[0];
			if (index >= 0) { 
				var cell = this._cells[index];
				if (cell.isBlocking()) { return; }
				cell.deactivate(); 
			}
		}

		this._current = [x, y];
		this._positionPort();

		var index = x + (y-1)*this._size[0];
		if (index >= 0) { this._cells[index].activate(); }
	},

	_isValid(x, y) {
		if (x < 0 || y < 0 || x >= this._size[0] || y >= this._size[1]) { return false; }
		if (y == 0 && x > 0) { return false; }
		return true;
	},

	_buildCells(count, element) {
		this._minimap = new Minimap(this._size[0], this._size[1]);

		for (var j=0;j<this._size[1];j++) {
			for (var i=0;i<this._size[0];i++) {
				var cell = new Cell(this, [i, j], this._minimap);
				this._cells.push(cell);
			}
		}

		for (var i=0;i<count;i++) {
			var cell = this._cells[i % this._cells.length];
			var entity = Entity.create(this._depth, element);
			cell.addEntity(entity);
		}
	},

	_build(introHTML, element) {
		this._createTextureData(element);

		this._dom.node.classList.add("level");

		this._dom.intro.classList.add("cell");
		this._dom.node.appendChild(this._dom.intro);

		var intro = document.createElement("div");
		intro.classList.add("intro");
		intro.innerHTML = introHTML;
		this._dom.intro.appendChild(intro);

		this._cells.forEach(cell => this._dom.node.appendChild(cell.getNode()));
		
		if (this._depth >= 2) {
			this._dom.node.appendChild(this._minimap.getNode());
		}
	},

	_createTextureData(element) {
		var texture = this._texture;
		var base = [40, 40, 40];
		if (element) {
			base = ROT.Color.interpolate(base, Elements[element].color, 0.5);
			base = base.map(channel => Math.round(channel/4));
		}

		var width = 13;
		var height = 6;
		for (var i=0;i<width;i++) {
			texture.push([]);
			for (var j=0;j<height;j++) {
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

	_renderTexture() {
		var data = Level.data;
		var ch = "#";
		var fontSize = data.fontSize * 2;

		var canvas = document.createElement("canvas");
		var ctx = canvas.getContext("2d");
		var font = `bold ${fontSize}px ${data.fontFamily}`
		ctx.font = font;

		var w = ctx.measureText(ch).width;
		var h = fontSize * data.lineHeight;

		canvas.width = this._texture.length*w;
		canvas.height = (this._texture[0].length)*h;
		ctx.font = font;
		ctx.textBaseline = "top";

		this._texture.forEach((value, col) => {
			value.forEach((value, row) => {
				var x = col * w;
				var y = fontSize * (row * data.lineHeight + data.lineHeight/2 - 0.4);
				ctx.fillStyle = ROT.Color.toRGB(value);
				ctx.fillText(ch, x, y);
			});
		});

		this._dom.node.style.backgroundImage = `url(${canvas.toDataURL("text/png")})`;
	},

	_positionPort() {
		var node = this._dom.node;

		var left = - window.innerWidth * this._current[0];
		var top = - window.innerHeight * this._current[1];
		node.style.left = left + "px";
		node.style.top = top + "px";
	}
}

Level._createIntro = function(depth) {
	var intro = "";
	
	if (depth == 1) {
		intro = `<p>welcome to the prison. As you might have already noticed, 
		all our cells are full. You really need to fix that.</p>
		<p>This first level has just one cell. Taking care about that goblin
		there shall be an easy task. Just press the <strong>↓</strong> 
		(or <strong>s</strong>) key to move around and do what you must.</p>
		<p>By the way: you will see your own stats below each enemy.</p>
		`;
	} else if (depth == 2) {
		intro = `<p>good job! Welcome to prison level ${depth}. The cells 
		here are full as well. 
		<p>You can now pick from multiple ways to deal with your enemies.
		Also, this level has two cells and both need to be cleared. 
		To move around, use <strong>←→↑↓</strong> or 
		<strong>WASD</strong> or <strong>HJKL</strong> keys.</p>
		`;
	} else {
		intro = `<p>welcome to prison level ${depth}. All the cells are full.</p>`
	}
	
	if (depth == 3) {
		intro = `${intro}<p>Keep an eye on your Experience bar. 
		When it fills up, you gain an experience level, improving your stats and 
		-- do I really need to explain that in more detail?</p>`;
	} else if (Rules.isLevelElemental(depth) && !this.data.elementalAnnounced) {
		this.data.elementalAnnounced = true;
		intro = `${intro}<p>Some levels have strong elemental attunement. 
		Keep an eye on these prisoners and try to approach them wisely.</p>`;
	} else if (Rules.isLevelShop(depth) && !this.data.shopAnnounced) {
		this.data.shopAnnounced = true;
		intro = `${intro}<p>You would not believe this! Some cells are 
		occupied by regular shopkeepers who decided to start their 
		business here. Well, laissez-faire, as they say.</p>`;
	}

	if (depth == 6) {
		intro = `${intro}<p>As you descend deeper, the number of cells will increase. 
		They can be also located in multiple rows.</p>`;
	}

	if (Rules.getEntityCount(depth) == 10) {
		intro = `${intro}<p>These deep prison levels are so crowded that some cells 
		even contain multiple monsters! Fortunately, you can deal with them
		one at a time.</p>`
	}
	
	intro = `${intro}<p class="sign">Yours,<br/>O.</p>`;
	
	if (depth >= 3) {
		var ps = Level._ps;
		intro = `${intro}<p class="ps">P.S. They say that ${ps[depth % ps.length]}.</p>`;
	}
	
	return `<p>Warden,</p>${intro}`;
}

Level._ps = [
	"trapped chests are dangerous",
	"trapped chests are cool",
	"eating lutefisk is risky",
	"elemental resistance is important",
	"elemental resistance is useless",
	"fire fox is stronger than goo gel",
	"goo gel is stronger than fire fox",
	"you should not trust people",
	"you should not trust goblins",
	"deeper cells have tougher enemies",
	"there is no way out of this prison",
	"being a Warden is cool",
	"being a Warden is risky",
	"captured goldfish may give you a wish",
	"coffee is hard to beat",
	"dragons are dangerous",
	"pangolins are dangerous",
	"you should keep an eye on your health",
	"you should keep an eye on your mana",
	"you should have some ammunition ready",
	"you shall not fight fire with fire",
	"you shall not fight water with water",
	"you shall fight water with fire",
	"you shall fight fire with water",
	"arrows are rare",
	"unicorns are rare",
	"roses are red, but not in prison",
	"resistance is futile",
	"this game is a roguelike",
	"this game is a roguelite",
	"there is no save/load in a prison",
	"levelling up is better than sex"
].randomize();
