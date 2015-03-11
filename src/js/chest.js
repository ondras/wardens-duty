var Chest = function(depth) {
	Entity.call({ch:"$", color: [250, 230, 20], name: "Treasure chest"});
}
Chest.prototype = Object.create(Entity.prototype);
