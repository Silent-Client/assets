require("dotenv").config();

const fs = require("fs");
const { getUsers } = require("./users");
const { getLaunches } = require("./launches");
const { getPayments } = require("./payments");
const axios = require("axios");

const YEAR = new Date().getFullYear();
const TOKEN = process.env.SECRET_TOKEN;

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
	const friends = await getFriendsCount();
	console.log("");
	const downloads = await getDownloadsCount();
	console.log("");

	await fs.promises.writeFile(
		`../${YEAR}/global.json`,
		JSON.stringify({
			new_users: users.registred,
			overvall_playtime: users.overvall_playtime,
			launches: launches.size,
			earned: payments.total,
			friends: friends,
			downloads: downloads,
		})
	);
}

async function getDownloadsCount() {
	console.log("Getting downloads count");
	let download_count = 0;
	const { data } = await axios.get(
		"https://api.github.com/repos/Silent-Client/launcher-releases/releases"
	);

	for (const release of data) {
		download_count += release.assets[0].download_count;
	}

	if (fs.existsSync(`../${YEAR - 1}/global.json`)) {
		const prev = JSON.parse(
			(await fs.promises.readFile(`../${YEAR - 1}/global.json`)).toString()
		);

		download_count -= prev.downloads;
	}

	console.log(`${download_count} in ${YEAR}`);

	return download_count;
}

async function getFriendsCount() {
	console.log("Getting friends count");
	const { data: friends } = await axios.get(
		`https://api.silentclient.net/results/get_friend_count?token=${TOKEN}`
	);
	console.log(`${friends.count} in ${YEAR}`);

	return friends.count;
}

main();
