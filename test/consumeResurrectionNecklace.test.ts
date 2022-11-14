import {deployContract} from "./utils";
import {Necklaces, NightCats, NightCatsGenesis} from "../typechain-types";
import {expect} from "chai";
import hre from "hardhat";

describe('consumeResurrectionNecklace', () => {
	it("should resurrect a dead cat", async () => {
		const [owner, otherAccount] = await hre.ethers.getSigners();
		const catsContract = await deployContract("NightCats") as NightCats;
		const genesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		const necklacesContract = await deployContract("Necklaces") as Necklaces;
		await necklacesContract.setNightCatsContract(catsContract.address);
		await catsContract.setNecklaceContract(necklacesContract.address);
		await catsContract.setGenesisContract(genesisContract.address);
		await genesisContract.setNightCatsContract(catsContract.address);
		await catsContract.premint();
		// resurrection event not active
		await necklacesContract.ownerMint(2);
		await expect(necklacesContract.consumeResurrectionNecklace(0, 0))
			.to.be.revertedWith("Resurrection ritual is not going on!");
		// necklace not yours
		await catsContract.transferFrom(owner.address, otherAccount.address, 0);
		await necklacesContract.startResurrectionPeriod();
		await expect(necklacesContract.connect(otherAccount).consumeResurrectionNecklace(0, 0))
			.to.be.revertedWith("This is not your necklace!");
		// necklace not a resurrection necklace
		await expect(necklacesContract.consumeResurrectionNecklace(1, 1))
			.to.be.revertedWith("This is not a resurrection necklace!");
		// cat not dead
		await expect(necklacesContract.consumeResurrectionNecklace(1, 0))
			.to.be.revertedWith("This cat is not dead!");
		// cat is dead; resurrection works now
		for (let i = 0; i < 3; i++) {
			await genesisContract.inflictCurse();
		}
		await genesisContract.premint();
		await genesisContract.setGodCatTokenIds([0]);
		await genesisContract.killCat(0, 1);
		expect(await catsContract.isCatDead(1)).to.equal(true);
		await necklacesContract.consumeResurrectionNecklace(1, 0);
		expect(await catsContract.isCatDead(1)).to.equal(false);
	});
});