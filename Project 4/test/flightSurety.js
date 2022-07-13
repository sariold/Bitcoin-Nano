const Web3 = require("web3");
var Test = require("../config/testConfig.js");
var BigNumber = require("bignumber.js");

contract("Flight Surety Tests", async (accounts) => {
	var config;
	var owner; // First airline account
	before("setup contract", async () => {
		config = await Test.Config(accounts);
		owner = config.firstAirline;
		// await config.flightSuretyData.authorizeCaller(
		// 	config.flightSuretyApp.address
		// );
		await config.flightSuretyData.setAuthorization(
			config.flightSuretyApp.address,
			true
		);

		console.log(await config.flightSuretyData.getRegisteredAirlines());
	});

	/****************************************************************************************/
	/* Operations and Settings                                                              */
	/****************************************************************************************/

	it(`(multiparty) has correct initial isOperational() value`, async function () {
		// Get operating status
		let status = await config.flightSuretyData.isOperational.call();
		assert.equal(status, true, "Incorrect initial operating status value");
	});

	it(`(multiparty) has correct changed isOperational() value`, async function () {
		// Get operating status
		await config.flightSuretyData.setOperatingStatus(false);
		let status = await config.flightSuretyData.isOperational.call();
		assert.equal(
			status,
			false,
			"Incorrect operating status value since it was changed to false"
		);
	});

	it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
		// Ensure that access is denied for non-Contract Owner account
		let accessDenied = false;
		try {
			await config.flightSuretyData.setOperatingStatus(false, {
				from: config.testAddresses[2],
			});
		} catch (e) {
			accessDenied = true;
		}
		assert.equal(
			accessDenied,
			true,
			"Access not restricted to Contract Owner"
		);
	});

	it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
		// Ensure that access is allowed for Contract Owner account
		let accessDenied = false;
		try {
			await config.flightSuretyData.setOperatingStatus(false);
		} catch (e) {
			accessDenied = true;
		}
		assert.equal(
			accessDenied,
			false,
			"Access not restricted to Contract Owner"
		);
	});

	it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
		await config.flightSuretyData.setOperatingStatus(false);

		let reverted = false;
		try {
			await config.flightSurety.getRegisteredAirlines();
		} catch (e) {
			reverted = true;
		}
		assert.equal(
			reverted,
			true,
			"Access not blocked for requireIsOperational"
		);

		// Set it back for other tests to work
		await config.flightSuretyData.setOperatingStatus(true);
	});

	it("(airline) cannot register an Airline using registerAirline() if there exist less than 4 registered airlines and it is not original airline", async () => {
		// ARRANGE
		let newAirline = accounts[2];

		// ACT
		try {
			await config.flightSuretyApp.registerAirline(
				newAirline,
				"Dasani Airlines",
				{
					from: newAirline,
				}
			);
		} catch (e) {}
		let result = await config.flightSuretyData.isAirlineRegistered.call(
			newAirline
		);

		// ASSERT
		assert.equal(
			result,
			false,
			"Airline should not be able to register itself it there are less than 4 airlines and it is not original airline"
		);
	});

	it("(airline) can register an Airline using registerAirline() if it is not funded", async () => {
		let newAirline = accounts[2];

		try {
			await config.flightSuretyApp.registerAirline(
				newAirline,
				"Dasani Airlines",
				{
					from: config.firstAirline,
				}
			);
		} catch (e) {}
		let result = await config.flightSuretyData.isAirlineRegistered.call(
			newAirline
		);

		assert.equal(
			result,
			true,
			"Airline should be able to register another airline if it hasn't provided funding"
		);
	});

	it("(airline) can be registered but not participate in the system until it is funded", async () => {
		let newAirline = accounts[2];

		try {
			await config.flightSuretyData.registerFlight.call(
				newAirline,
				"DA2048",
				Math.floor(Date.now() / 1000),
				{
					from: newAirline,
				}
			);
		} catch (e) {}

		let result = await config.flightSuretyData.isAirlineAuthorized(
			newAirline
		);

		assert.equal(
			result,
			false,
			"Airline should not be authorized since it hasn't provided funding"
		);
	});

	it("(airline) can go from not funded to funded", async () => {
		let newAirline = accounts[2];

		let result = await config.flightSuretyData.isAirlineFunded.call(
			newAirline
		);

		assert.equal(result, false, "Airline should not be funded yet");

		try {
			await config.flightSuretyApp.fundAirline({
				value: web3.utils.toWei("10", "ether"),
				from: newAirline,
			});
		} catch (e) {}
		result = await config.flightSuretyData.isAirlineFunded.call(newAirline);

		assert.equal(
			result,
			true,
			"Airline should change from not funded to funded if it pays 10 ether"
		);
	});

	it("(airline) cannot register a new airline when there are 4 or more airlines, group consensus must be made", async () => {
		let thirdAirline = accounts[3];
		let fourthAirline = accounts[4];
		let fifthAirline = accounts[5];

		try {
			await config.flightSuretyApp.registerAirline(
				thirdAirline,
				"Fiji Airlines",
				{
					from: config.firstAirline,
				}
			);
			await config.flightSuretyApp.registerAirline(
				fourthAirline,
				"Voss Airlines",
				{
					from: config.firstAirline,
				}
			);
			await config.flightSuretyApp.registerAirline(
				fifthAirline,
				"Nestle Airlines",
				{
					from: config.firstAirline,
				}
			);
		} catch (e) {}
		let result = await config.flightSuretyData.isAirlineRegistered.call(
			fifthAirline
		);
		console.log(await config.flightSuretyData.getRegisteredAirlines());

		assert.equal(result, false, "Airline should not be registered");
	});
});

// Math.floor(Date.now() / 1000);
