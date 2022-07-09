var HDWalletProvider = require("@truffle/hdwallet-provider");
var mnemonic =
	// "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";
	"island embark prize student shadow example kit uncle live custom miss promote";

module.exports = {
	networks: {
		development: {
			provider: function () {
				return new HDWalletProvider(
					mnemonic,
					"http://127.0.0.1:7545/",
					0,
					50
				);
			},
			network_id: "*",
			gas: 6721975,
		},
	},
	compilers: {
		solc: {
			version: "^0.8.15",
		},
	},
};
