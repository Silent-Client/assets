const axios = require("axios");
const fs = require("fs");
const { sleep } = require("./utils");

const YEAR = new Date().getFullYear();
const TOKEN = process.env.SECRET_TOKEN;

async function getPayments() {
	console.log("Getting payments");

	const { data } = await axios.get(
		`https://api.silentclient.net/results/get_payments?token=${TOKEN}`
	);
	console.log(`${data.payments.length} payments in ${YEAR}`);

	let total = 0;
	let donators = [];

	for (const payment of data.payments) {
		total += payment.real_amount;
		try {
			if (!fs.existsSync(`../${YEAR}/accounts/${payment.user_id}.json`)) {
				console.error(`payment_id: ${payment.id}, user not found :(`);
				continue;
			}
			const user = JSON.parse(
				(
					await fs.promises.readFile(
						`../${YEAR}/accounts/${payment.user_id}.json`
					)
				).toString()
			);

			const donator = donators.find(u => u.username === user.username);
			if (donator) {
				donator.total += payment.real_amount;
			} else {
				donators.push({
					username: user.username,
					total: payment.real_amount,
				});
			}
		} catch (error) {
			console.error(`Error! payment_id: ${payment.id}`, error);
		}
	}

	console.log(`${(total / 100).toFixed(2)}$ earned in ${YEAR}!`);

	await fs.promises.writeFile(
		`../${YEAR}/donators.json`,
		JSON.stringify(
			donators.sort((a, b) => {
				if (a.total < b.total) {
					return 1;
				}
				if (a.total > b.total) {
					return -1;
				}
				return 0;
			})
		)
	);

	return { total };
}

module.exports = { getPayments };
