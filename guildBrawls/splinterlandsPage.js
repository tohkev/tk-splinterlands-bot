const log = require("fancy-log");

async function login(page, account, password) {
	try {
		page.waitForSelector("#log_in_button > button").then(() =>
			page.click("#log_in_button > button")
		);
		await page
			.waitForSelector("#email")
			.then(() => page.waitForTimeout(3000))
			.then(() => page.focus("#email"))
			.then(() => page.type("#email", account))
			.then(() => page.focus("#password"))
			.then(() => page.type("#password", password))

			// .then(() => page.waitForSelector('#login_dialog_v2 > div > div > div.modal-body > div > div > form > div > div.col-sm-offset-1 > button', { visible: true }).then(() => page.click('#login_dialog_v2 > div > div > div.modal-body > div > div > form > div > div.col-sm-offset-1 > button')))
			.then(() => page.click("#loginBtn"))
			.then(() => page.waitForTimeout(5000))
			.then(() => page.reload())
			.then(() => page.waitForTimeout(5000))
			.then(() => page.reload())
			.then(() => page.waitForTimeout(3000))
			.then(async () => {
				await page
					.waitForSelector("#log_in_text", {
						visible: true,
						timeout: 3000,
					})
					.then(() => {
						log("logged in!");
					})
					.catch(() => {
						log("didnt login");
						throw new Error("Didnt login");
					});
			})
			.then(() => page.waitForTimeout(2000))
			.then(() => page.reload());
	} catch (e) {
		throw new Error(
			"Check that you used correctly username and posting key. (dont use email and password)"
		);
	}
}

async function checkMana(page) {
	var manas = await page.evaluate(() => {
		var manaCap = document.querySelectorAll(
			"div.mana-total > span.mana-cap"
		)[0].innerText;
		var manaUsed = document.querySelectorAll(
			"div.mana-total > span.mana-used"
		)[0].innerText;
		var manaLeft = manaCap - manaUsed;
		return { manaCap, manaUsed, manaLeft };
	});
	log("manaLimit", manas);
	return manas;
}

async function checkMatchMana(page) {
	const mana = await page.$$eval(
		"div.mana-cap__icon > div.aspect-ratio--1-1 > div.aspect-ratio__content",
		(el) => el.map((x) => x.innerText)
	);
	const manaValue = parseInt(mana);
	return manaValue;
}

async function checkMatchRules(page) {
	const rules = await page.$$eval(
		"div.row > div > div.no-gutters > div > img.brawl-zoomable-obj",
		(el) => el.map((x) => x.getAttribute("data-original-title"))
	);
	return rules.map((x) => x.split(":")[0]).join("|");
}

async function checkMatchActiveSplinters(page) {
	const splinterUrls = await page.$$eval(
		"div.col-xs-3 > div > div.no-gutters > div > img",
		(el) => el.map((x) => x.getAttribute("src"))
	);
	return splinterUrls
		.map((splinter) => splinterIsActive(splinter))
		.filter((x) => x);
}

const splinterIsActive = (splinterUrl) => {
	const splinter = splinterUrl
		.split("/")
		.slice(-1)[0]
		.replace(".svg", "")
		.replace("btn_round_", "");
	return splinter.indexOf("inactive") === -1 ? splinter : "";
};

exports.login = login;
exports.checkMana = checkMana;
exports.checkMatchMana = checkMatchMana;
exports.checkMatchRules = checkMatchRules;
exports.checkMatchActiveSplinters = checkMatchActiveSplinters;
exports.splinterIsActive = splinterIsActive;