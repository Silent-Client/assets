const fs = require("fs");
const jimp = require("jimp");
const { DownloaderHelper } = require("node-downloader-helper");

const YEAR = new Date().getFullYear();

async function generateImages(accounts) {
	try {
		await fs.promises.rm("./temp", { force: true, recursive: true });
	} catch (error) {}
	await fs.promises.mkdir("./temp", { recursive: true });

	const templatePath = `./assets/passed_template_${YEAR}.png`;
	const onestExtraBold64 = await jimp.loadFont(
		"./assets/onest-extrabold-64.fnt"
	);
	const onestRegular24 = await jimp.loadFont("./assets/onest-regular-24.fnt");

	let index = 0;
	let fullIndex = 0;

	for (const account of accounts) {
		const loadedImage = await jimp.read(templatePath);
		const userImagePath = `../${YEAR}/accounts/${account.id}.png`;
		let skinPath = `./temp/${account.username}.png`;

		const dl = new DownloaderHelper(
			`https://mc-heads.net/body/${account.username}/158.png`,
			__dirname + "/temp",
			{ fileName: `${account.username}.png` }
		);
		dl.on("error", () => {
			skinPath = "./assets/steve.png";
		});
		await dl.start().catch(() => (skinPath = "./assets/steve.png"));

		await loadedImage.print(
			onestExtraBold64,
			233,
			175,
			`${account.username.toUpperCase()}'S STATS`
		);
		const skin = await jimp.read(skinPath);
		await loadedImage.composite(skin, 41, 46);

		// Total Playtime
		await loadedImage
			.print(
				onestExtraBold64,
				41,
				530,
				{
					text: `${(account.overvall_playtime / 60 / 60).toFixed(0)} HOURS`,
					alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
				},
				609,
				100
			)
			.print(
				onestRegular24,
				41,
				632,
				{
					text: `About ${(account.overvall_playtime / 60).toFixed(
						0
					)} minutes and ${account.overvall_playtime} seconds`,
					alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
				},
				609,
				100
			);

		// Favorite Version
		await loadedImage
			.print(
				onestExtraBold64,
				666,
				530,
				{
					text:
						account.top_versions.length !== 0
							? account.top_versions[0].version !== "unknown"
								? account.top_versions[0].version
								: "1.8"
							: "N/A",
					alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
				},
				609,
				100
			)
			.print(
				onestRegular24,
				666,
				632,
				{
					text:
						account.top_versions.length !== 0
							? `Launched ${account.top_versions[0].launches} times`
							: "",
					alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
				},
				609,
				100
			);

		// Favorite Server
		await loadedImage
			.print(
				onestExtraBold64,
				41,
				813,
				{
					text:
						account.top_server_joins.length !== 0
							? account.top_server_joins[0].server_ip
							: "N/A",
					alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
				},
				1234,
				100
			)
			.print(
				onestRegular24,
				41,
				915,
				{
					text:
						account.top_server_joins.length !== 0
							? `Joined ${account.top_server_joins[0].joins}${
									YEAR === 2023 ? " from 22 December" : ""
							  }`
							: "",
					alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
				},
				1234,
				100
			);

		// Total Friend Adds
		await loadedImage.print(
			onestExtraBold64,
			41,
			1086,
			{
				text: `${account.friends_count}`,
				alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
			},
			609,
			100
		);

		// Total Launches
		await loadedImage.print(
			onestExtraBold64,
			666,
			1086,
			{
				text: `${account.launches_count}`,
				alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
			},
			609,
			100
		);

		await loadedImage.writeAsync(userImagePath);

		if (index === 10) {
			index = 0;
			console.log(`Processed ${fullIndex + 1}/${accounts.length} (image_task)`);
		}
		index++;
		fullIndex++;
	}
	await fs.promises.rm("./temp", { force: true, recursive: true });
	console.log(`Processed ${accounts.length}/${accounts.length} (image_task)`);
}

module.exports = { generateImages };
