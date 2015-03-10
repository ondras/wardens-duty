var Game = function() {
	this._dom = {
		intro: document.createElement("div"),
		outro: document.createElement("div")
	}
	this._level = null;

	window.addEventListener("resize", this);
	this._resize();
	
	this._start();
}

Game.prototype = {
	nextLevel() {
		var depth = (this._level ? this._level.getDepth() : 0);
		depth++;
		
		var w = window.innerWidth;
		var h = window.innerHeight;

		this._level && this._level.deactivate();
		this._level = new Level(depth);
		this._level.activate(w, h);
	},
	
	over() {
		window.addEventListener("keydown", this);
		
		var node = this._dom.outro;
		node.id = "outro";
		node.innerHTML = `<h1>Game over</h1>
			<p>jak cyp</p>
		`;
		/* FIXME outro */
		node.classList.add("transparent");
		document.body.appendChild(node);

		setTimeout(() => {
			node.classList.remove("transparent");
		}, 0);
	},
	
	handleEvent(e) {
		if (e.type == "resize") {
			this._resize();
			return;
		}
		
		if (e.keyCode != 13) { return; }
		
		if (this._level) {
			location.reload();
		} else {
			window.removeEventListener("keydown", this);
			this.nextLevel();
			this._dom.intro.classList.add("transparent");
			setTimeout(() => {
				this._dom.intro.parentNode.removeChild(this._dom.intro);
			}, 2000);
		}
	},

	_resize() {
		var w = window.innerWidth;
		var h = window.innerHeight;

		/* FIXME ne nekde u game? */
		var data = Level.data;
		data.fontSize = h/30;
		document.documentElement.style.fontSize = data.fontSize + "px";

		/* fixme zbytecne? */
		document.documentElement.style.lineHeight = data.lineHeight;

		this._level && this._level.resize(w, h);
	},
	
	_start() {
		var node = this._dom.intro;
		node.id = "intro";
		
		node.innerHTML = `<h1>Warden's Duty</h1>
			<p>The game you are about to play blah blah blah </p>
		`;
		document.body.appendChild(node);
		
		window.addEventListener("keydown", this);
	}
}

var pc = new PC();
var game = new Game();
