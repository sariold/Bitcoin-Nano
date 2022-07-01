const HDWallet = require("@truffle/hdwallet-provider");
const infuraKey = "ac88277e781b454bbd699924c146c85e";

// Throwaway wallet
const mnemonic =
	"piece season ocean excite grunt never crystal bind skate bus name wasp";

module.exports = {
	networks: {
		development: {
			host: "127.0.0.1",
			port: 9545,
			network_id: "*", // Match any network id
			websockets: true,
		},
		rinkeby: {
			provider: () =>
				new HDWallet(
					mnemonic,
					`https://rinkeby.infura.io/v3/${infuraKey}`
				),
			network_id: 4, // rinkeby's id
			gas: 4500000, // rinkeby has a lower block limit than mainnet
			gasPrice: 10000000000,
		},
	},
	compilers: {
		solc: {
			version: "0.8.1", // Fetch exact version from solc-bin (default: truffle's version)
			// docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
			// settings: {          // See the solidity docs for advice about optimization and evmVersion
			//  optimizer: {
			//    enabled: false,
			//    runs: 200
			//  },
			//  evmVersion: "byzantium"
			// }
		},
	},
};
