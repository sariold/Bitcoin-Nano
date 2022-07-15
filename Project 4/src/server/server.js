import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";
import express from "express";

let config = Config["localhost"];
let web3 = new Web3(
	new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
);
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(
	FlightSuretyApp.abi,
	config.appAddress
);
let oracles = [];
let oracleCount = 20;
let codes = [0, 10, 20, 30, 40, 50];

web3.eth.getAccounts((error, accounts) => {
	// console.log(accounts);
	for (let i = 0; i < oracleCount; i++) {
		flightSuretyApp.methods.registerOracle().send(
			{
				from: accounts[i],
				value: web3.utils.toWei("1", "ether"),
				gas: 6721975,
			},
			(error, result) => {
				console.log(error);
				flightSuretyApp.methods
					.getMyIndexes()
					.call({ from: accounts[i] }, (error, result) => {
						let oracle = {
							address: accounts[i],
							index: result,
						};
						// console.log(oracle);
						oracles.push(oracle);
						console.log(
							"ORACLE REGISTERED: " + JSON.stringify(oracle)
						);
					});
			}
		);
	}
});

// console.log(oracles);

flightSuretyApp.events.OracleRequest(
	{
		fromBlock: 0,
	},
	function (error, event) {
		if (error) console.log(error);
		else {
			let returnValues = event.returnValues;
			// console.log(returnValues);

			let status = codes[Math.floor(Math.random() * codes.length)];
			// let status = 20;

			for (let i = 0; i < oracles.length; i++) {
				if (oracles[i].index.includes(returnValues.index)) {
					flightSuretyApp.methods
						.submitOracleResponse(
							returnValues.index,
							returnValues.airline,
							returnValues.flight,
							returnValues.timestamp,
							status
						)
						.send(
							{
								from: oracles[i].address,
								gas: 6721975,
							},
							(error, result) => {
								console.log(
									"FROM " +
										JSON.stringify(oracles[i]) +
										"STATUS CODE: " +
										status
								);
							}
						);
				}
			}
		}
	}
);

const app = express();
app.get("/api", (req, res) => {
	res.send({
		message: "An API for use with your Dapp!",
	});
});

export default app;
