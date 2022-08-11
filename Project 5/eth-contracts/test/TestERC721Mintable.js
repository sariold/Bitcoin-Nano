var ERC721Mintable = artifacts.require("ERC721Mintable");

contract("TestERC721Mintable", (accounts) => {
	const owner = accounts[0];
	const account_one = accounts[1];
	const account_two = accounts[2];

	describe("match erc721 spec", function () {
		beforeEach(async function () {
			this.contract = await ERC721Mintable.new("RealEstateToken", "RET", {
				from: owner,
			});

			// TODO: mint multiple tokens
			await this.contract.mint(account_one, 1);
			await this.contract.mint(account_one, 2);
			await this.contract.mint(account_one, 3);
			await this.contract.mint(account_two, 4);
			await this.contract.mint(account_two, 5);
			await this.contract.mint(account_two, 6);
		});

		it("should return total supply", async function () {
			let totalSupply = await this.contract.totalSupply.call();
			assert.equal(totalSupply, 6, "Does not match total supply");
		});

		it("should get token balance", async function () {
			let balanceOne = await this.contract.balanceOf.call(account_one);
			assert.equal(
				balanceOne,
				3,
				"Does not match balance of account_one"
			);
		});
		// token uri should be complete i.e: https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/1
		it("should return token uri", async function () {
			let tokenURI = await this.contract.tokenURI.call(1);
			assert.equal(
				tokenURI,
				"https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/1",
				"Does not match given tokenURI"
			);
		});

		it("should transfer token from one owner to another", async function () {
			await this.contract.safeTransferFrom(account_one, account_two, 1, {
				from: account_one,
			});
			let tokenOneOwner = await this.contract.ownerOf(1);
			assert.equal(
				tokenOneOwner,
				account_two,
				"New token owner is not correct"
			);
		});
	});

	describe("have ownership properties", function () {
		beforeEach(async function () {
			this.contract = await ERC721Mintable.new("RealEstateToken", "RET", {
				from: owner,
			});
		});

		it("should fail when minting when address is not contract owner", async function () {
			let error;
			try {
				await this.contract.mint(account_two, 7, {
					from: account_one,
				});
			} catch (e) {
				error = e;
			}
			assert.notEqual(
				error,
				undefined,
				"Revert error not thrown for minting when address is not contract owner"
			);
			assert.isAbove(
				error.message.search("Requires sender is contract owner"),
				-1,
				"Revert error not thrown for minting when address is not contract owner"
			);
		});

		it("should return contract owner", async function () {
			let result = await this.contract.getOwner.call();
			assert.equal(
				result,
				owner,
				"Contract owner not correctly returned"
			);
		});
	});
});
