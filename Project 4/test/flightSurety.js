const Web3 = require("web3");
var Test = require("../config/testConfig.js");
var BigNumber = require("bignumber.js");
const assert = require("assert");
const { receiveMessageOnPort } = require("worker_threads");

contract("Flight Surety Tests", async (accounts) => {
	var config;
	var firstAirline; // First airline account
	var secondAirline;
	var thirdAirline;
	var fourthAirline;
	var fifthAirline;
	var sixthAirline;
	var passenger;

	const timestamp = Math.floor(Date.now() / 1000);

	before("setup contract", async () => {
		config = await Test.Config(accounts);
		firstAirline = config.firstAirline;
		// await config.flightSuretyData.authorizeCaller(
		// 	config.flightSuretyApp.address
		// );
		await config.flightSuretyData.setAuthorization(
			config.flightSuretyApp.address,
			true
		);

		console.log(await config.flightSuretyData.getRegisteredAirlines());

		secondAirline = accounts[2];
		thirdAirline = accounts[3];
		fourthAirline = accounts[4];
		fifthAirline = accounts[5];
		sixthAirline = accounts[6];
		passenger = accounts[7];
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
				from: secondAirline,
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

		// ACT
		try {
			await config.flightSuretyApp.registerAirline(
				newAirline,
				"Dasani Airlines",
				{
					from: secondAirline,
				}
			);
		} catch (e) {}
		let result = await config.flightSuretyData.isAirlineRegistered.call(
			secondAirline
		);

		// ASSERT
		assert.equal(
			result,
			false,
			"Airline should not be able to register itself it there are less than 4 airlines and it is not original airline"
		);
	});

	it("(airline) can register an Airline using registerAirline() if it is not funded", async () => {
		try {
			await config.flightSuretyApp.registerAirline(
				secondAirline,
				"Dasani Airlines",
				{
					from: firstAirline,
				}
			);
		} catch (e) {}
		let result = await config.flightSuretyData.isAirlineRegistered.call(
			secondAirline
		);

		assert.equal(
			result,
			true,
			"Airline should be able to register another airline if it hasn't provided funding"
		);
	});

	it("(airline) can be registered but not participate in the system until it is funded", async () => {
		try {
			await config.flightSuretyData.registerFlight.call(
				secondAirline,
				"DA2048",
				Math.floor(Date.now() / 1000),
				{
					from: secondAirline,
				}
			);
		} catch (e) {}

		let result = await config.flightSuretyData.isAirlineAuthorized(
			secondAirline
		);

		assert.equal(
			result,
			false,
			"Airline should not be authorized since it hasn't provided funding"
		);
	});

	it("(airline) can go from not funded to funded", async () => {
		let result = await config.flightSuretyData.isAirlineFunded.call(
			secondAirline
		);

		assert.equal(result, false, "Airline should not be funded yet");

		try {
			await config.flightSuretyApp.fundAirline({
				value: web3.utils.toWei("10", "ether"),
				from: secondAirline,
			});
		} catch (e) {}
		result = await config.flightSuretyData.isAirlineFunded.call(
			secondAirline
		);

		assert.equal(
			result,
			true,
			"Airline should change from not funded to funded if it pays 10 ether"
		);
	});

	it("(airline) cannot register a new airline when there are 4 or more airlines, group consensus must be made", async () => {
		try {
			await config.flightSuretyApp.registerAirline(
				thirdAirline,
				"Fiji Airlines",
				{
					from: firstAirline,
				}
			);
			await config.flightSuretyApp.registerAirline(
				fourthAirline,
				"Voss Airlines",
				{
					from: firstAirline,
				}
			);
			await config.flightSuretyApp.registerAirline(
				fifthAirline,
				"Nestle Airlines",
				{
					from: firstAirline,
				}
			);
		} catch (e) {}
		let result = await config.flightSuretyData.isAirlineRegistered.call(
			fifthAirline
		);
		console.log(await config.flightSuretyData.getRegisteredAirlines());

		assert.equal(result, false, "Airline should not be registered");
	});

	it("(airline) can register airline if 50% consesus is reached through voting", async () => {
		try {
			await config.flightSuretyApp.fundAirline({
				value: web3.utils.toWei("10", "ether"),
				from: thirdAirline,
			});
			await config.flightSuretyApp.fundAirline({
				value: web3.utils.toWei("10", "ether"),
				from: fourthAirline,
			});
			await config.flightSuretyData.airlineVote(
				secondAirline,
				fifthAirline,
				{ from: secondAirline }
			);
			await config.flightSuretyApp.registerAirline(
				fifthAirline,
				"Nestle Airlines",
				{
					from: thirdAirline,
				}
			);
		} catch (e) {}
		let result = await config.flightSuretyData.isAirlineRegistered.call(
			fifthAirline
		);
		console.log(await config.flightSuretyData.getRegisteredAirlines());

		assert.equal(result, true, "Airline should be registered");
	});

	it("(airline) cannot register airline if 50% consesus is not reached through voting", async () => {
		try {
			await config.flightSuretyApp.fundAirline({
				value: web3.utils.toWei("10", "ether"),
				from: fifthAirline,
			});
			await config.flightSuretyData.airlineVote(
				secondAirline,
				sixthAirline,
				{ from: secondAirline }
			);
			await config.flightSuretyApp.registerAirline(
				sixthAirline,
				"Spring Airlines",
				{
					from: firstAirline,
				}
			);
		} catch (e) {}
		let result = await config.flightSuretyData.isAirlineRegistered.call(
			sixthAirline
		);
		console.log(await config.flightSuretyData.getRegisteredAirlines());

		assert.equal(result, false, "Airline should not be registered");
	});

	it(`Can register and retrieve a flight`, async function () {
		var eventEmitted = false;

		await config.flightSuretyApp.registerFlight(
			secondAirline,
			"OA1732",
			timestamp
		);

		config.flightSuretyApp.contract.events.OracleRequest({}, (err, res) => {
			eventEmitted = true;
		});

		await config.flightSuretyApp.fetchFlightStatus(
			secondAirline,
			"OA1732",
			timestamp
		);

		assert.equal(eventEmitted, true, "Event not emitted");
	});

	it(`(passenger) cannot buy insurance for an unfunded flight`, async function () {
		let result = await config.flightSuretyData.isPassengerInsured(
			sixthAirline,
			"SA1311",
			passenger
		);
		assert.equal(result, false, "Passenger is insured");
		try {
			await config.flightSuretyApp.buy(sixthAirline, "SA1311", {
				from: passenger,
				value: Web3.utils.toWei("1", "ether"),
			});
		} catch (e) {}
		result = await config.flightSuretyData.isPassengerInsured(
			sixthAirline,
			"SA1311",
			passenger
		);
		assert.equal(result, false, "Passenger is insured");
	});

	it(`(passenger) cannot buy insurance for more than 1 ether per flight`, async function () {
		let result = await config.flightSuretyData.isPassengerInsured(
			secondAirline,
			"OA1732",
			passenger
		);
		assert.equal(result, false, "Passenger is insured");
		try {
			await config.flightSuretyApp.buy(secondAirline, "OA1732", {
				from: passenger,
				value: Web3.utils.toWei("1.1", "ether"),
			});
		} catch (e) {}
		result = await config.flightSuretyData.isPassengerInsured(
			secondAirline,
			"OA1732",
			passenger
		);
		assert.equal(result, false, "Passenger is insured");
	});

	it(`(passenger) can go from uninsured to insured after buying insurance for a flight`, async function () {
		let result = await config.flightSuretyData.isPassengerInsured(
			secondAirline,
			"OA1732",
			passenger
		);
		assert.equal(result, false, "Passenger is insured");
		await config.flightSuretyApp.buy(secondAirline, "OA1732", {
			from: passenger,
			value: Web3.utils.toWei("1", "ether"),
		});
		result = await config.flightSuretyData.isPassengerInsured(
			secondAirline,
			"OA1732",
			passenger
		);
		assert.equal(result, true, "Passenger is not insured");
	});

	it(`(passenger) can withdraw their 1.5x insurance claim for a flight if they have credits`, async function () {
		const beforeBalance = await web3.eth.getBalance(passenger);
		try {
			await config.flightSuretyData.creditInsurees(
				secondAirline,
				"OA1732",
				150
			);
		} catch (e) {}

		let result = await config.flightSuretyApp.withdraw({
			from: passenger,
		});

		let afterBalance = await web3.eth.getBalance(passenger);

		let gasPrice = await web3.eth.getTransaction(result.tx);
		let gasUsed = JSON.parse(JSON.stringify(result.receipt)).gasUsed;
		const gasCost = gasPrice.gasPrice * gasUsed;

		afterBalance = afterBalance + gasCost;

		assert.equal(
			beforeBalance < afterBalance + web3.utils.toWei("1.5", "ether"),
			true,
			"Passenger did not earn 1.5x ether"
		);
	});

	it(`(passenger) cannot withdraw if they do not have credits`, async function () {
		const beforeBalance = await web3.eth.getBalance(passenger);

		try {
			await config.flightSuretyApp.withdraw({
				from: passenger,
				gasPrice: 0,
			});
		} catch (e) {}

		const afterBalance = await web3.eth.getBalance(passenger);

		assert.equal(
			afterBalance,
			beforeBalance,
			"Passenger did not earn 1.5x ether"
		);
	});
});

// Math.floor(Date.now() / 1000);
