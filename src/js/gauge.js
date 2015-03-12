var Gauge = function(conf) {
	this._conf = {
		label: "",
		color: "",
		min: 0,
		max: 100,
		width: 30,
		oldValue: 0, 
		newValue: 100 
	}
	for (var p in conf) { this._conf[p] = conf[p]; }

	this._node = document.createElement("div");

	this._build();
}

Gauge.prototype = {
	getNode() { return this._node; },
	_build() {
		var conf = this._conf;
		this._node.classList.add("gauge");
		this._node.style.backgroundColor = ROT.Color.toRGB(conf.color);
		
		var diff = conf.newValue - conf.oldValue;
		if (diff) {
			var label = `${conf.label} ${diff > 0 ? "+" : ""}${diff}`;
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

		var text = new Array(conf.width+1).join(" ").split("");
		var start = Math.round((text.length-label.length)/2);
		for (var i=0;i<label.length;i++) {
			text[start+i] = label.charAt(i);
		}

		var min = Math.min(conf.oldValue, conf.newValue);
		var max = Math.max(conf.oldValue, conf.newValue);
		var range = conf.max-conf.min;

		var breakPoints = [ // in chars; these two must differ
			Math.round((min-conf.min)*conf.width/range), // animation starts here
			Math.round((max-conf.min)*conf.width/range) // empty ends starts here
		];
		
		if (breakPoints[0] == breakPoints[1] && diff) {
			var exact = (max-conf.min)*conf.width/range;
			if (exact > breakPoints[1]) { // upper range was rounded down
				breakPoints[1]++;
			} else { // upper range was rounded up
				breakPoints[0]--;
			}
		}
		
		if (!range) { breakPoints[1] = 0; } /* zero-zero edge case */
		
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
}

