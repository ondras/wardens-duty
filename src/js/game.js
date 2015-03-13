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
		var depth = (this._level ? this._level.getDepth() : 10);
		depth++;
		
		var w = window.innerWidth;
		var h = window.innerHeight;

		this._level && this._level.deactivate();
		this._level = Level.create(depth);
		this._level.activate(w, h);
	},
	
	over() {
		window.addEventListener("keydown", this);
		this._level.deactivate();
		
		var depth = this._level.getDepth();
		var url = encodeURIComponent(location.href);
		var status = encodeURIComponent(`I got to level ${depth} at Warden's Duty! ${location.href}`);

		var node = this._dom.outro;
		node.id = "outro";
		node.innerHTML = `<h1>Game over</h1>
			<p>You are unable to continue your duty. All the vicious
			critters locked inside cells are too hard to defeat 
			and the game is over.</p>

			<p>On the other hand, you did a fine job cleaning the 
			prison up. Many cells are now free and you managed to descend
			to level ${depth}. Click the icons below to share your 
			score!</p>
			
			<a class="twitter" href="https://twitter.com/home?status=${status}">
				<span>t</span>
				<br/>Twitter
			</a>

			<a class="gplus" href="https://plus.google.com/share?url=${url}">
				<span>g+</span>
				<br/>Google Plus
			</a>
			
			<a class="fb" href="https://www.facebook.com/sharer/sharer.php?u={$url}">
				<span>f</span>
				<br/>Facebook
			</a>

			<p>Press <strong>Enter</strong> to play again!</p>
		`;
		document.body.insertBefore(node, document.body.firstChild);
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
			}, 3000);
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
			<p>The game you are about to play is a 7DRL. It was created 
			in a limited time, might exhibit strange bugs and some 
			say it contains <em>roguelike</em> (‽) elements. 
			You will encounter goblins, rats, dragons, pangolins and 
			maybe even a lutefisk.
			<a href="https://www.youtube.com/watch?v=6dNAbb7vKjY">Be prepared.</a></p>
			
			<p>Warden't Duty was created by 
			<a href="http://ondras.zarovi.cz/">Ondřej Žára</a> and the 
			complete source code is available on
			<a href="https://github.com/ondras/wardens-duty">GitHub</a>.
			If you find the game's layout broken, try adjusting your window
			to be more <em>widescreen</em>, i.e. considerably wider than it is tall.</p>
			
			<p>To start the game, please press <strong>Enter</strong>.</p> 
		`;
		document.body.appendChild(node);
		
		window.addEventListener("keydown", this);
	}
}

var pc = new PC();
var game = new Game();
