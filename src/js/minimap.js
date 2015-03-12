var Minimap = function(width, height) {
	this._node = document.createElement("table");
	this._node.classList.add("minimap");

	this._cells = [];
	
	for (var j=0;j<height;j++) {
		var tr = document.createElement("tr");
		this._node.appendChild(tr);
		this._cells.push([]);
		for (var i=0;i<width;i++) {
			var td = document.createElement("td");
			this._cells[j].push(td);
			tr.appendChild(td);
		}
	}
}

Minimap.prototype = {
	getNode() { return this._node; },
	focus(x, y) {
		this._cells[y][x].classList.add("active");
	},
	blur(x, y) {
		this._cells[y][x].classList.remove("active");
	},
	set(x, y, ch, color) {
		var cell = this._cells[y][x];
		cell.innerHTML = ch;
		cell.style.color = color;
	}
}
