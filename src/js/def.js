var Stats = {
	"hp": {
		label: "Health",
		color: [50, 220, 50],
		def: 100
	},
	"maxhp": {
		def: 100
	},
	"mana": {
		label: "Mana",
		color: [50, 50, 220],
		def: 100
	},
	"maxmana": {
		def: 100
	},
	"strength": {
		label: "Strength",
		color: [50, 180, 100],
		def: 10
	},
	"magic": {
		label: "Magic affinity",
		color: [100, 50, 180],
		def: 10
	},
	"gold": {
		label: "Gold",
		color: [250, 230, 20],
		def: 0
	},
	"ammo": {
		label: "Arrows",
		color: [200, 120, 30],
		def: 3
	},
	"xp": {
		label: "Experience",
		color: [200, 50, 200],
		def: 5
	}
}

var Elements = {
	"poison": {
		label: "Poison",
		color: [100, 160, 20],
		def: 0
	},

	"fire": {
		label: "Fire",
		color: [180, 20, 20],
		def: 0
	},

	"water": {
		label: "Water",
		color: [20, 20, 180],
		def: 0
	}
}

Object.keys(Elements).forEach(key => {
	Stats[`res-${key}`] = {
		label: `${Elements[key].label} resistance`,
		color: Elements[key].color,
		def: 0
	}
});
