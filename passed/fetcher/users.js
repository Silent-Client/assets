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
	let friends = 0;
	let index = 0;
	let fullIndex = 0;

	for (const user of data.users) {
		try {
			const account = await getAccount(user);
			overvall_playtime += account.playtime;
			friends += account.friends;
		} catch (error) {
			if (error?.response?.status === 429) {
				await sleep(60 * 11 * 1000);
				const account = await getAccount(user);
				overvall_playtime += account.playtime;
				friends += account.friends;
				continue;
			}

			console.error(`Error! user_id: ${user.id}`, error);
		}
		if (index === 10) {
			index = 0;
			console.log(`Processed ${fullIndex + 1}/${data.users.length}`);
		}
		index++;
		fullIndex++;
	}

	console.log(`Processed ${data.users.length}/${data.users.length}`);
	const minutes = Math.floor(overvall_playtime / 60);
	console.log(`${minutes} minutes played for ${YEAR}!`);

	return { overvall_playtime, friends, registred: data.count };
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

	return {
		playtime: account.overvall_playtime,
		friends: account.friends_count,
	};
}

module.exports = { getUsers };
