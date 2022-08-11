var SolnSquareVerifier = artifacts.require("SolnSquareVerifier");
const proof = require("../../zokrates/code/square/proof.json");

contract("SolnSquareVerifier", (accounts) => {
	const owner = accounts[0];
	const accountOne = accounts[1];

	describe("verify the minting", async () => {
		beforeEach(async () => {
			this.contract = await SolnSquareVerifier.new({ from: owner });
		});

		// Test if an ERC721 token can be minted for contract - SolnSquareVerifier
		it("can mint a new token for the SolnSquareVerifier contract", async () => {
			await this.contract.mint(accountOne, 1, { from: owner });
			let tokenBalance = await this.contract.balanceOf.call(accountOne);
			assert.equal(tokenBalance, 1, "Token balance does not match");
		});

		// Test if a new solution can be added for contract - SolnSquareVerifier
		it("can add a new solution / mint a verified token", async () => {
			let eventEmitted = false;

			await this.contract.AddedSolution(() => {
				eventEmitted = true;
			});

			let mint = await this.contract.mintVerified(
				accountOne,
				1,
				proof.proof.a,
				proof.proof.b,
				proof.proof.c,
				proof.inputs,
				{ from: owner }
			);

			assert.equal(
				eventEmitted,
				true,
				"AddedSolution event was not correctly emitted"
			);
		});

		it("token cannot be minted if it fails verification during minting process", async () => {
			let result = true;
			try {
				await this.contract.mintVerified(
					accountOne,
					1,
					proof.proof.a,
					proof.proof.b,
					proof.proof.c,
					[6, 9],
					{ from: owner }
				);
			} catch (e) {
				result = false;
			}
			assert.equal(
				result,
				false,
				"New token minted with bad verification"
			);
		});

		it("duplicate solution token cannot be verify minted", async () => {
			let result = true;
			await this.contract.mintVerified(
				accountOne,
				1,
				proof.proof.a,
				proof.proof.b,
				proof.proof.c,
				proof.inputs,
				{ from: owner }
			);
			try {
				await this.contract.mintVerified(
					accountOne,
					2,
					proof.proof.a,
					proof.proof.b,
					proof.proof.c,
					proof.inputs,
					{ from: owner }
				);
			} catch (e) {
				result = false;
			}
			assert.equal(
				result,
				false,
				"Token was minted with a duplicate solution"
			);
		});
	});
});
