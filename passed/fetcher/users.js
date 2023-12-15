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
	let index = 0;
	let fullIndex = 0;
	let accounts = [];

	for (const user of data.users) {
		try {
			let account = await getAccount(user);
			if (fs.existsSync(`../${YEAR - 1}/accounts/${user.id}.json`)) {
				const prevAccount = JSON.parse(
					(
						await fs.promises.readFile(
							`../${YEAR - 1}/accounts/${user.id}.json`
						)
					).toString()
				);
				account.overvall_playtime -= prevAccount.overvall_playtime;
			}
			overvall_playtime += account.overvall_playtime;

			accounts.push(account);
		} catch (error) {
			if (error?.response?.status === 429) {
				await sleep(60 * 11 * 1000);

				let account = await getAccount(user);
				if (fs.existsSync(`../${YEAR - 1}/accounts/${user.id}.json`)) {
					const prevAccount = JSON.parse(
						(
							await fs.promises.readFile(
								`../${YEAR - 1}/accounts/${user.id}.json`
							)
						).toString()
					);
					account.overvall_playtime -= prevAccount.overvall_playtime;
				}
				overvall_playtime += account.overvall_playtime;

				accounts.push(account);

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

	accounts = accounts.sort((a, b) => {
		if (a.overvall_playtime < b.overvall_playtime) {
			return 1;
		}
		if (a.overvall_playtime > b.overvall_playtime) {
			return -1;
		}
		return 0;
	});

	accounts.length = 10;

	await fs.promises.writeFile(
		`../${YEAR}/playtime.json`,
		JSON.stringify(
			accounts.map(account => {
				return {
					id: account.id,
					username: account.username,
					overvall_playtime: account.overvall_playtime,
				};
			})
		)
	);

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

	return account;
}

module.exports = { getUsers };
