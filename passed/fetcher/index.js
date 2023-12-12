require("dotenv").config();

const axios = require("axios");
const fs = require("fs");
const { getUsers } = require("./users");
const { getLaunches } = require("./launches");
const { getPayments } = require("./payments");

const YEAR = new Date().getFullYear();

async function main() {
	console.log(`Starting PASSED${YEAR} process`);
	try {
		await fs.promises.rm(`../${YEAR}`, { recursive: true, force: true });
	} catch (error) {}
	await fs.promises.mkdir(`../${YEAR}`, { recursive: true });
	const users = await getUsers();
	console.log("");
	const launches = await getLaunches();
	console.log("");
	const payments = await getPayments();
	console.log("");

	await fs.promises.writeFile(
		`../${YEAR}/global.json`,
		JSON.stringify({
			new_users: users.registred,
			overvall_playtime: users.overvall_playtime,
			launches: launches.size,
			earned: payments.total,
		})
	);
}

main();
