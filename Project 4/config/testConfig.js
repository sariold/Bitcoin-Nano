var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require("bignumber.js");

var Config = async function (accounts) {
	let owner = accounts[0];
	let firstAirline = accounts[1];

	let flightSuretyData = await FlightSuretyData.deployed();
	let flightSuretyApp = await FlightSuretyApp.deployed(
		flightSuretyData.address
	);

	return {
		owner: owner,
		firstAirline: firstAirline,
		weiMultiple: new BigNumber(10).pow(18),
		flightSuretyData: flightSuretyData,
		flightSuretyApp: flightSuretyApp,
	};
};

module.exports = {
	Config: Config,
};
