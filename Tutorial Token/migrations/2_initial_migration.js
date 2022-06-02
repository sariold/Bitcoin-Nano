var SampleToken = artifacts.require("SampleToken");

var decimals = 18;
var value = (100 * 10 ** decimals).toString();
var tokens = web3.utils.toBN(value);

module.exports = function (deployer) {
	deployer.deploy(SampleToken, "TT", "TEST", tokens);
};
