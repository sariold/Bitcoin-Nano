import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";

import Config from "./config.json";
import Web3 from "web3";

export default class Contract {
	constructor(network, callback) {
		let config = Config[network];
		this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
		this.flightSuretyApp = new this.web3.eth.Contract(
			FlightSuretyApp.abi,
			config.appAddress
		);

		this.initialize(callback);
		this.owner = null;
		this.firstAirline = null;
		this.airlines = [];
		this.passengers = [];
	}

	initialize(callback) {
		this.web3.eth.getAccounts((error, accts) => {
			this.owner = accts[0];
			this.firstAirline = accts[1];

			// let counter = 1;

			// while (this.airlines.length < 5) {
			// 	this.airlines.push(accts[counter++]);
			// }

			// while (this.passengers.length < 5) {
			// 	this.passengers.push(accts[counter++]);
			// }

			callback();
		});
	}

	isOperational(callback) {
		let self = this;
		self.flightSuretyApp.methods
			.isOperational()
			.call({ from: self.owner }, callback);
	}

	isPassengerInsured(flight, callback) {
		let self = this;
		self.flightSuretyApp.methods
			.isPassengerInsured(self.firstAirline, flight, self.owner)
			.call({ from: self.owner }, callback);
	}

	getPassengerCredits(callback) {
		let self = this;
		self.flightSuretyApp.methods
			.getPassengerCredits(self.owner)
			.call({ from: self.owner }, callback);
	}

	buyInsurance(flight, deposit, callback) {
		let self = this;
		let payload = {
			airline: self.firstAirline,
			flight: flight,
		};
		self.flightSuretyApp.methods.buy(payload.airline, payload.flight).send(
			{
				from: self.owner,
				value: this.web3.utils.toWei(deposit, "ether"),
				gas: 6721975,
			},
			(error, result) => {
				callback(error, result);
			}
		);
	}

	withdrawCredits(callback) {
		let self = this;
		self.flightSuretyApp.methods.withdraw().send(
			{
				from: self.owner,
				gas: 6721975,
			},
			(error, result) => {
				callback(error, result);
			}
		);
	}

	fetchFlightStatus(flight, callback) {
		let self = this;
		let payload = {
			airline: self.firstAirline,
			flight: flight,
			timestamp: Math.floor(Date.now() / 1000),
		};
		self.flightSuretyApp.methods
			.getPassengerCredits(self.owner)
			.call({ from: self.owner })
			.then((result) => console.log(result));
		self.flightSuretyApp.methods
			.fetchFlightStatus(
				payload.airline,
				payload.flight,
				payload.timestamp
			)
			.send({ from: self.owner }, (error, result) => {
				// console.log(result);
				callback(error, payload);
			});
	}
}
