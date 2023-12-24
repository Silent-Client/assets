const axios = require("axios");
const fs = require("fs");

const YEAR = new Date().getFullYear();
const TOKEN = process.env.SECRET_TOKEN;

async function getServerJoins() {
	const { data } = await axios.get(
		`https://api.silentclient.net/results/get_server_joins?token=${TOKEN}`
	);
	console.log(`${data.server_joins.length} server joins in ${YEAR}`);

	let total = 0;
	let servers = [];
	let index = 0;
	let fullIndex = 0;

	for (const serverJoin of data.server_joins) {
		total++;

		const server = servers.find(u => u.server_ip === serverJoin.server_ip);
		if (server) {
			server.joins += 1;
		} else {
			servers.push({
				server_ip: serverJoin.server_ip,
				joins: 1,
			});
		}

		if (index === 10) {
			index = 0;
			console.log(
				`Processed ${fullIndex + 1}/${
					data.server_joins.length
				} (server_joins_task)`
			);
		}
		index++;
		fullIndex++;
	}

	console.log(
		`Processed ${data.server_joins.length}/${data.server_joins.length} (server_joins_task)`
	);

	console.log(`${total} server joins in ${YEAR}!`);

	servers = servers.sort((a, b) => {
		if (a.joins < b.joins) {
			return 1;
		}
		if (a.joins > b.joins) {
			return -1;
		}
		return 0;
	});

	if (servers.length > 10) {
		servers.length = 10;
	}

	await fs.promises.writeFile(
		`../${YEAR}/servers.json`,
		JSON.stringify(servers)
	);

	return { total };
}

module.exports = { getServerJoins };
