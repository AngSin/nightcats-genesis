import hre from "hardhat";
import { deployContract } from "./utils";
import {NightCatsGenesis} from "../typechain-types";
import {expect} from "chai";

describe("setGodCatTokenIds", function () {
	it('should set god cat token ids', async () => {
		const [_, otherAccount] = await hre.ethers.getSigners();
		const genesisCats = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		await genesisCats.setGodCatTokenIds([0, 1]);
		await expect (genesisCats.connect(otherAccount).setGodCatTokenIds([0, 1]))
			.to.be.revertedWith("You are not allowed to call this function!");
		await genesisCats.setGodCatTokenIds([0, 1]);
		expect(await genesisCats.godCatTokenIds(0)).to.equal(0);
		expect(await genesisCats.godCatTokenIds(1)).to.equal(1);
	});

	it("should tell if a token id is a god cat or not", async () => {
		const genesisCats = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		await genesisCats.setGodCatTokenIds([0, 1, 2]);
		expect(await genesisCats.isGodCat(0)).to.equal(true);
		expect(await genesisCats.isGodCat(3)).to.equal(false);
	});
});