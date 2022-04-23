const fetch = require("node-fetch");

async function getCardById(id) {
	async function getCardLibrary() {
		let cardLibrary = [];
		try {
			cardLibrary = await fetch(
				"https://game-api.splinterlands.com/cards/get_details"
			);
			cardLibrary = cardLibrary.json();
		} catch (err) {
			console.log(err);
		}
		return cardLibrary;
	}

	cardLibrary = await getCardLibrary();

	return cardLibrary.find((card) => card.id === id);
}

module.exports = getCardById;
