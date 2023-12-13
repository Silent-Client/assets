const axios = require("axios");
const fs = require("fs");
const { sleep } = require("./utils");

const YEAR = new Date().getFullYear();
const TOKEN = process.env.SECRET_TOKEN;

async function getLaunches() {
	console.log(`Getting launches`);

	const { data } = await axios.get(
		`https://api.silentclient.net/results/get_launches?token=${TOKEN}`
	);
	console.log(`${data.launches.length} launches in ${YEAR}`);

	let countries = [];
	let players = [];
	let ips = [];
	let index = 0;
	let fullIndex = 0;

	for (const launch of data.launches) {
		if (launch.ip === "unknown") {
			continue;
		}
		try {
			let ip = ips.find(e => e.query === launch.ip);
			if (!ip) {
				const ipInfo = await axios.get(`http://ip-api.com/json/${launch.ip}`);
				ips.push(ipInfo.data);
				ip = ipInfo.data;
				if (ipInfo.headers["x-rl"] === "0") {
					const rateLimit = Number(ipInfo.headers["x-ttl"]) + 3;
					console.log(`Oh... Rate limit ${rateLimit}`);
					await sleep(rateLimit * 1000);
				}
			}

			const country = countries.find(e => ip.countryCode === e.country_code);

			if (country) {
				country.launches += 1;
				const player = players.find(u => u === launch.user_id);
				if (!player) {
					country.players += 1;
					players.push(launch.user_id);
				}
			} else {
				countries.push({
					country: ip.country,
					country_code: ip.countryCode,
					launches: 1,
					players: 1,
				});
				players.push(launch.user_id);
			}
		} catch (error) {
			if (error?.response?.headers["x-rl"] === "0") {
				const rateLimit = Number(error?.response?.headers["x-ttl"]) + 3;
				console.log(`Oh... Rate limit ${rateLimit}`);
				await sleep(rateLimit * 1000);
				continue;
			}

			console.error(`Error! launch_id: ${launch.id}`, error);
		}
		if (index === 10) {
			index = 0;

			if (fs.existsSync(`../${YEAR}/countries.json`)) {
				await fs.promises.rm(`../${YEAR}/countries.json`, {
					force: true,
					recursive: true,
				});
			}
			await fs.promises.writeFile(
				`../${YEAR}/countries.json`,
				JSON.stringify(countries)
			);

			console.log(`Processed ${fullIndex + 1}/${data.launches.length}`);
		}
		index++;
		fullIndex++;
	}

	if (fs.existsSync(`../${YEAR}/countries.json`)) {
		await fs.promises.rm(`../${YEAR}/countries.json`, {
			force: true,
			recursive: true,
		});
	}
	await fs.promises.writeFile(
		`../${YEAR}/countries.json`,
		JSON.stringify(
			countries.sort((a, b) => {
				if (a.players < b.players) {
					return 1;
				}
				if (a.players > b.players) {
					return -1;
				}
				return 0;
			})
		)
	);

	console.log(`Processed ${data.launches.length}/${data.launches.length}`);

	return { size: data.launches.size };
}

module.exports = { getLaunches };
