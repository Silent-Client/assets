const axios = require("axios");
const fs = require("fs");
const { sleep } = require("./utils");

const YEAR = new Date().getFullYear();
const TOKEN = process.env.SECRET_TOKEN;

async function getUsers() {
	console.log(`Getting users`);

	const { data } = await axios.get(
		`https://api.silentclient.net/results/get_users?token=${TOKEN}`
	);
	console.log(`${data.users.length} users found`);
	console.log(`${data.count} users registred in ${YEAR}`);

	let overvall_playtime = 0;

	for (const user of data.users) {
		try {
			overvall_playtime += await getAccount(user);
		} catch (error) {
			if (error?.response?.status === 429) {
				await sleep(60 * 11 * 1000);
				overvall_playtime += await getAccount(user);
				continue;
			}

			console.error(`Error! user_id: ${user.id}`, error);
		}
	}

	console.log(`All users processed!`);
	const minutes = Math.floor(overvall_playtime / 60);
	console.log(`${minutes} minutes played for ${YEAR}!`);

	return { overvall_playtime, registred: data.count };
}

async function getAccount(user) {
	const account = (
		await axios.get(
			`https://api.silentclient.net/results/get_user?token=${TOKEN}&id=${user.id}`
		)
	).data.data;

	if (!fs.existsSync(`../${YEAR}/accounts`)) {
		await fs.promises.mkdir(`../${YEAR}/accounts`, { recursive: true });
	}

	await fs.promises.writeFile(
		`../${YEAR}/accounts/${user.id}.json`,
		JSON.stringify(account)
	);

	return account.overvall_playtime;
}

module.exports = { getUsers };
