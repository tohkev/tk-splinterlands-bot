const fetch = require("node-fetch");
				
let cardLibrary = require("./data/cardsDetails.json")

async function getCardById(id) {
// 	async function getCardLibrary() {
// 		let cardLibrary = [];
// 		try {
// 			cardLibrary = await fetch(
// 				"C:\\Users\\tohke\\Documents\\GitHub\\splinterlands-guild-brawls\\data\\cardsDetails.json"
// 			)
// 			let data = await cardLibrary.json();
// 			return data;
// 		} catch (err) {
// 			console.log(err);
// 		}
// 	}

	// cardLibrary = await getCardLibrary();

	return cardLibrary.find((card) => card.id === id);
}

module.exports = getCardById;
