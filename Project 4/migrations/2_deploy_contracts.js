const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require("fs");
const Web3 = require("web3");

module.exports = async (deployer, network, accounts) => {
	let firstAirline = accounts[1];

	await deployer.deploy(FlightSuretyData);

	let fsd = await FlightSuretyData.deployed();
	await fsd.registerAirline(firstAirline, "Ozarka Airlines");

	let fsa = await deployer.deploy(FlightSuretyApp, FlightSuretyData.address);
	await dataContract.setAuthorization(FlightSuretyApp.address);

	await fsa.fundAirline({
		from: firstAirline,
		value: Web3.utils.toWei("10", "ether"),
	});

	const time = Math.floor(Date.now() / 1000);
	await fsa.registerFlight(
		firstAirline,
		"OA9231",
		Math.floor(Date.now() / 1000)
	);
	await fsa.registerFlight(
		firstAirline,
		"OA1464",
		Math.floor(Date.now() / 1000) + 100
	);
	await fsa.registerFlight(
		firstAirline,
		"OA8672",
		Math.floor(Date.now() / 1000) + 500
	);

	let config = {
		localhost: {
			url: "http://localhost:7545",
			dataAddress: FlightSuretyData.address,
			appAddress: FlightSuretyApp.address,
		},
	};
	fs.writeFileSync(
		__dirname + "/../src/dapp/config.json",
		JSON.stringify(config, null, "\t"),
		"utf-8"
	);
	fs.writeFileSync(
		__dirname + "/../src/server/config.json",
		JSON.stringify(config, null, "\t"),
		"utf-8"
	);
};
