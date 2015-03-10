var Level = function(depth) {
	this._depth = depth;

//	this._size = Generator.getSize(depth);
	//this._size[1]++; // room for the intro cell
	this._size = [2, 2];
	this._cells = [];
	this._current = null;

	this._texture = [];

	this._dom = {
		node: document.createElement("div"),
		intro: document.createElement("div")
	}

	var count = this._size[0]*(this._size[1]-1);
	for (var i=0;i<count;i++) {
		var being = new Being();
		var cell = new Cell(this, being);
		this._cells.push(cell);
	}

	this._build();
	this.checkCells();
}

Level.data = {
	fontSize: 24,
	lineHeight: 1,
	fontFamily: "serif"
}

Level.prototype = {
	activate(w, h) {
		window.addEventListener("keypress", this);
		window.addEventListener("keydown", this);

		this._activateCell(0, 0);
		this.resize(w, h);
		document.body.appendChild(this._dom.node);
	},

	deactivate() {
		window.removeEventListener("keypress", this);
		window.removeEventListener("keydown", this);

		this._dom.node.parentNode.removeChild(this._dom.node);
		this._cells.forEach(cell => cell.deactivate());
	},
	
	getDepth() {
		return this._depth;
	},

	checkCells() {
		this._cells.forEach(cell => cell.syncAttacks());
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

		if (this._current) {
			var index = this._current[0] + (this._current[1]-1)*this._size[0];
			if (index >= 0) { this._cells[index].deactivate(); }
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

	_build() {
		this._createTextureData();

		this._dom.node.classList.add("level");

		this._dom.intro.classList.add("cell");
		this._dom.node.appendChild(this._dom.intro);

		var intro = document.createElement("div");
		intro.classList.add("intro");
		intro.innerHTML = "This is intro pico";
		this._dom.intro.appendChild(intro);

		this._cells.forEach(cell => this._dom.node.appendChild(cell.getNode()));

	},

	_createTextureData() {
		var texture = this._texture;

		var width = 13;
		var height = 6;
		for (var i=0;i<width;i++) {
			texture.push([]);
			for (var j=0;j<height;j++) {
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
