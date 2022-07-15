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
	await fsd.setAuthorization(FlightSuretyApp.address, true);

	await fsa.fundAirline({
		from: firstAirline,
		value: Web3.utils.toWei("10", "ether"),
	});

	const time = Math.floor(Date.now() / 1000);
	await fsa.registerFlight(firstAirline, "OA3451", time);
	await fsa.registerFlight(firstAirline, "OA2354", time);
	await fsa.registerFlight(firstAirline, "OA4525", time);
	await fsa.registerFlight(firstAirline, "OA4200", time);

	let config = {
		localhost: {
			url: "http://localhost:9545",
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
