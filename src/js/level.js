var Level = function() {
	this._size = [2, 3];
	this._cells = [];
	this._current = [-1, -1];

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

	if (!Level.data.random) { this._createTextureData(); }

	this._build();
	this._resize();
	this.checkCells();
}

Level.data = {
	fontSize: 24,
	lineHeight: 1,
	random: null,
	fontFamily: "serif",
	texture: ""
}

Level.prototype = {
	activate() {
		window.addEventListener("keypress", this);
		window.addEventListener("keydown", this);
		window.addEventListener("resize", this);

		document.body.appendChild(this._dom.node);
		this._activateCell(0, 0);
	},

	deactivate() {
		window.removeEventListener("keypress", this);
		window.removeEventListener("keydown", this);
		window.removeEventListener("resize", this);

		this._dom.node.parentNode.removeChild(this._dom.node);
		this._cells.forEach(cell => cell.deactivate());
	},

	checkCells() {
		var doable = this._cell.some(cell => cell.isDoable());
		var done = this._cell.some(cell => cell.isDone());

		if (done) { /* level done, switch to another */

		} else if (!doable) { /* game over */

		}
	},

	handleEvent(e) {
		if (e.type == "resize") {
			this._updateSizeData();
			this._resize();
			return;
		}

		if (e.ctrlKey || e.altKey || e.metaKey) { return; }
		var what = (e.type == "keydown" ? e.keyCode : String.fromCharCode(e.charCode));

		switch (what) {
			/* FIXME rot constants? */
			case 37:
			case "a":
			case "h":
				this._activateCell(this._current[0]-1, this._current[1]);
			break;
			case 38:
			case "w":
			case "k":
				this._activateCell(this._current[0], this._current[1]-1);
			break;
			case 39:
			case "d":
			case "l":
				this._activateCell(this._current[0]+1, this._current[1]);
			break;
			case 40:
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

	_updateSizeData() {
		var data = Level.data;
		data.fontSize = window.innerHeight/30;
		document.documentElement.style.fontSize = data.fontSize + "px";
		document.documentElement.style.lineHeight = data.lineHeight;

		this._renderTexture();
	},

	_activateCell(x, y) {
		if (x < 0 || y < 0 || x >= this._size[0] || y >= this._size[1]) { return; }
		if (y == 0 && x > 0) { return; }

		this._current = [x, y];
		this._positionPort();

		var index = x + (y-1)*this._size[0];
		if (index >= 0) { this._cells[index].activate(); }
	},

	_build() {
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
		var data = Level.data;
		data.random = [];

		var width = 13;
		var height = 6;
		for (var i=0;i<width;i++) {
			data.random.push([]);
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
				data.random[i].push(color);
			}
		}
		this._updateSizeData();
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

		canvas.width = data.random.length*w;
		canvas.height = (data.random[0].length)*h;
		ctx.font = font;
		ctx.textBaseline = "top";

		data.random.forEach((value, col) => {
			value.forEach((value, row) => {
				var x = col * w;
				var y = fontSize * (row * data.lineHeight + data.lineHeight/2 - 0.4);
				ctx.fillStyle = ROT.Color.toRGB(data.random[col][row]);
				ctx.fillText(ch, x, y);
			});
		});

		Level.data.texture = `url(${canvas.toDataURL("text/png")})`;
	},

	_resize() {
		var w = window.innerWidth;
		var h = window.innerHeight;

		var node = this._dom.node;
		node.style.width = (this._size[0]*w) + "px";
		node.style.height = (this._size[1]*h) + "px";
		node.style.backgroundImage = Level.data.texture;

		this._dom.intro.style.width = w+"px";
		this._dom.intro.style.height = h+"px";

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

	_positionPort() {
		var node = this._dom.node;

		var left = - window.innerWidth * this._current[0];
		var top = - window.innerHeight * this._current[1];
		node.style.left = left + "px";
		node.style.top = top + "px";
	}
}
