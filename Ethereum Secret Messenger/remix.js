var Web3 = require("web3");
var web3 = new Web3("HTTP://127.0.0.1:7545");

web3.eth
	.getTransactionCount("0x8ab0E41D98f9F155292aE64d04b050A6526388F9")
	.then(console.log);
