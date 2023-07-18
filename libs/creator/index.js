const axios = require("axios");
const fs = require("fs");
const path = require("path");
const input = require("input");
const { DownloaderHelper } = require("node-downloader-helper");

(async function main() {
	const versionInput = await input.text("Enter MC Version: ");
	const patchLwjgl = await input.confirm("Patch Lwjgl?: ");
	if (fs.existsSync(`../${versionInput}`)) {
		console.log("Clearing version directory...");
		try {
			await fs.promises.rm(`../${versionInput}`, {
				force: true,
				recursive: true,
			});
		} catch {}
	}

	console.log("Finding version in manifest...");
	const { data: manifest } = await axios.get(
		"https://launchermeta.mojang.com/mc/game/version_manifest.json"
	);

	const version = manifest.versions.find(v => v.id === versionInput);

	if (!version) {
		throw new Error("Version not found.");
	}

	console.log("Parsing version manifest...");
	const { data: versionManifest } = await axios.get(version.url);
	const libraries = [];
	console.log("Parsing libraries...");
	for (const library of versionManifest.libraries) {
		console.log(`Finded ${library.name}`);
		if (library?.downloads?.classifiers) {
			const keys = Object.keys(library?.downloads?.classifiers);
			for (const key of keys) {
				const artifact = library?.downloads?.classifiers[key];
				console.log(`Finded native library ${path.basename(artifact.path)}`);
				libraries.push({
					name: path.basename(artifact.path),
					...artifact,
				});
			}
			continue;
		}
		const artifact = library?.downloads?.artifact;
		if (!artifact) {
			console.log(`Artifact of ${library.name} not found`);
			continue;
		}

		libraries.push({
			name: path.basename(artifact.path),
			...artifact,
		});
	}

	console.log("Creating version directory...");
	await fs.promises.mkdir(`../${versionInput}`, { recursive: true });

	for (const library of libraries) {
		console.log(`Downloading ${library.name} to ${library.path}...`);
		await fs.promises.mkdir(
			`../${versionInput}/${path.dirname(library.path)}`,
			{ recursive: true }
		);
		const download = new DownloaderHelper(
			library.url,
			`../${versionInput}/${path.dirname(library.path)}`,
			{ fileName: path.basename(library.path) }
		);

		await download.start();

		console.log(`Patching ${library.name} URL`);
		library.url = `https://assets.silentclient.net/libs/${versionInput}/${library.path}`;
	}

	if (patchLwjgl) {
		console.log("Patching LWJGL");
		try {
			await fs.promises.mkdir(
				`../${versionInput}/org/lwjgl/lwjgl/lwjgl/2.9.1`,
				{ recursive: true }
			);
		} catch {}
		await fs.promises.copyFile(
			"../lwjgl-2.9.1.jar",
			`../${versionInput}/org/lwjgl/lwjgl/lwjgl/2.9.1/lwjgl-2.9.1.jar`
		);

		const lwjgl = libraries.find(l => l.name === "lwjgl-2.9.1.jar");
		if (lwjgl) {
			const newSize = (await fs.promises.stat("../lwjgl-2.9.1.jar")).size;
			console.log(`Changing size of LWJGL from ${lwjgl.size} to ${newSize}...`);
			lwjgl.size = newSize;
		}
	}

	console.log("Saving manifest...");
	await fs.promises.writeFile(
		`../${versionInput}/manifest.json`,
		JSON.stringify(libraries)
	);

	console.log("Done!");
})();
