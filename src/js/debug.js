var Debug = function() {
	Level.apply(this, arguments);
	this._dom.node.appendChild(this._minimap.getNode());
}

Debug.prototype = Object.create(Level.prototype);

Debug.prototype._buildCells = function(count, element) {
	var beings = [];

	Bestiary.forEach(def => {
		var diff = def.diff;

		if (!def.visual.color) { 
			for (var p in Elements) {
				var vis = Object.create(def.visual);
				vis.color = Elements[p].color;
				var being = new Being(diff, vis, element);
				beings.push(being);
			}
		} else {
			var being = new Being(diff, def.visual, element);
			beings.push(being);
		}
	});

	var size = Math.ceil(Math.sqrt(beings.length));
	this._size = [size, size];

	this._minimap = new Minimap(this._size[0], this._size[1]);

	for (var j=0;j<this._size[1];j++) {
		for (var i=0;i<this._size[0];i++) {
			var cell = new Cell(this, [i, j], this._minimap);
			this._cells.push(cell);
		}
	}

	beings.forEach((being, index) => {
		var cell = this._cells[index % this._cells.length];
		cell.addEntity(being);
	});
}
