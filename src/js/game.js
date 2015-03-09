var Game = function() {
	this._dom = {
		intro: document.createElement("div"),
		outro: document.createElement("div")
	}
	this._level = null;
	
	this._start();
}

Game.prototype = {
	nextLevel() {
		var depth = (this._level ? this._level.getDepth() : 0);
		depth++;
		
		this._level && this._level.deactivate();
		this._level = new Level(depth);
		this._level.activate();
	},
	
	over() {
		window.addEventListener("keydown", this);
		
		var node = this._dom.outro;
		node.id = "outro";
		node.innerHTML = "Game over jak cyp";
		/* FIXME outro */
		node.classList.add("transparent");
		document.body.appendChild(node);

		setTimeout(() => {
			node.classList.remove("transparent");
		}, 0);
	},
	
	handleEvent(e) {
		if (e.keyCode != 13) { return; }
		
		window.removeEventListener("keydown", this);
		
		if (this._level.getDepth() > 1) {
			location.reload();
		} else {
			this._dom.intro.classList.add("transparent");
			setTimeout(() => {
				this._dom.intro.parentNode.removeChild(this._dom.intro);
			}, 2000);
		}
	},
	
	_start() {
		this.nextLevel();
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
