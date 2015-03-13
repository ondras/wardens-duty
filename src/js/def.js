var Stats = {
	"hp": {
		label: "Health",
		color: [50, 220, 50],
		def: 20
	},
	"maxhp": {
		def: 20
	},
	"mana": {
		label: "Mana",
		color: [50, 50, 220],
		def: 20
	},
	"maxmana": {
		def: 20
	},
	"strength": {
		label: "Strength",
		color: [50, 180, 100],
		def: 10 // max 100 reduces damage by half
	},
	"magic": {
		label: "Magic affinity",
		color: [100, 50, 180],
		def: 10 // max 100 reduces mana consumption by half
	},
	"gold": {
		label: "Gold",
		color: [230, 200, 20],
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
		def: 0
	}
}

var Elements = {
	"poison": {
		label: "Poison",
		color: [100, 160, 20],
		def: 0 // max 100 reduces damage by half
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
	Stats[key] = {
		label: `${Elements[key].label} resistance`,
		color: Elements[key].color,
		def: 0
	}
});
