var Stats = {
	"hp": {
		label: "Health",
		color: "#3e3",
		def: 100
	},
	"maxhp": {
		def: 100
	},
	"mana": {
		label: "Mana",
		color: "#33e",
		def: 100
	},
	"maxmana": {
		def: 100
	},
	"gold": {
		label: "Gold",
		color: ROT.Color.toHex([250, 230, 20]),
		def: 0
	},
	"ammo": {
		label: "Arrows",
		color: "#a82",
		def: 3
	},
	"xp": {
		label: "Experience",
		color: "#a3a",
		def: 5
	}
}

var Elements = {
	"poison": {
		label: "Poison",
		def: 0
	},

	"fire": {
		label: "Fire",
		def: 0
	},

	"water": {
		label: "Water",
		def: 0
	}
}

Object.keys(Elements).forEach(key => {
	Stats[`res-${key}`] = {
		label: `${Elements[key].label} resistance`,
		def: 0
	}
});
