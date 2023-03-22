const log = require("fancy-log");

async function login(page, account, password) {
	try {
		page.waitForSelector("#log_in_button > button").then(() =>
			page.click("#log_in_button > button")
		);
		await page
			.waitForSelector("input[name='email']")
			.then(() => page.waitForTimeout(5000))
			.then(() => page.focus("input[name='email']"))
			.then(() => page.type("input[name='email']", account))
			.then(() => page.focus("input[name='password']"))
			.then(() => page.type("input[name='password']", password))

			// .then(() => page.waitForSelector('#login_dialog_v2 > div > div > div.modal-body > div > div > form > div > div.col-sm-offset-1 > button', { visible: true }).then(() => page.click('#login_dialog_v2 > div > div > div.modal-body > div > div > form > div > div.col-sm-offset-1 > button')))
			.then(() => page.click("button[type='submit']"))
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
	log("Getting mana..");
	const mana = await page.$$eval(
		"div.combat_info > div:nth-of-type(6) > div > div.mana-cap__icon",
		(el) => el.map((x) => x.getAttribute("data-original-title"))
	);
	const manaValue = parseInt(mana[0].split(": ")[1], 10);
	return manaValue;
}

async function checkMatchRules(page) {
	log("Getting ruleset..");
	const rules = await page.$$eval(
		"div.combat__rules > div > div > img",
		(el) => el.map((x) => x.getAttribute("data-original-title"))
	);
	return rules.map((x) => x.split(":")[0]).join("|");
}

async function checkMatchActiveSplinters(page) {
	let splintersRoute = "div.combat__splinters > div.active_element_list > img";
	log("Getting active splinters..");
	const splinterUrls = await page.$$eval(
		splintersRoute,
		(el) => el.map((x) => x.getAttribute("data-original-title"))
	);
	// log("SplinterUrls", splinterUrls);
	return splinterUrls
		.map((splinter) => splinterIsActive(splinter))
		.filter((x) => !!x);
}

const splinterIsActive = (splinterUrl) => {
	const splinter = splinterUrl
		.toLowerCase()
		.split(": ")
	return splinter.indexOf("inactive") === -1 ? splinter[0] : "";
};

exports.login = login;
exports.checkMana = checkMana;
exports.checkMatchMana = checkMatchMana;
exports.checkMatchRules = checkMatchRules;
exports.checkMatchActiveSplinters = checkMatchActiveSplinters;
exports.splinterIsActive = splinterIsActive;
