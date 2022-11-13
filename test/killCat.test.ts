import {deployContract} from "./utils";
import {Necklaces, NightCats, NightCatsGenesis} from "../typechain-types";
import hre from "hardhat";
import {expect} from "chai";

describe("killCat", () => {
	it("should kill cat", async () => {
		const [_, otherAccount] = await hre.ethers.getSigners();
		const genesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		const catsContract = await deployContract("NightCats") as NightCats;
		const necklacesContract = await deployContract("Necklaces") as Necklaces;
		await genesisContract.setNightCatsContract(catsContract.address);
		await catsContract.setGenesisContract(genesisContract.address);
		await catsContract.setNecklaceContract(necklacesContract.address);
		await necklacesContract.setNightCatsContract(catsContract.address);
		await genesisContract.premint();
		await catsContract.premint();
		await necklacesContract.ownerMint(4);

		// curse not active
		await expect(genesisContract.killCat(0, 0))
			.to.be.revertedWith("Curse is not active!");

		// curse active but is second curse
		await genesisContract.inflictCurse();
		await genesisContract.inflictCurse();
		await expect(genesisContract.killCat(0, 0))
			.to.be.revertedWith("You can't kill yet!");

		// genesis is not a god cat
		await genesisContract.inflictCurse();
		await expect(genesisContract.killCat(0, 0))
			.to.be.revertedWith("Cat is not a god cat!");

		// God cat is not yours
		await genesisContract.setGodCatTokenIds([1, 2, 3, 5, 8]);
		await expect(genesisContract.connect(otherAccount).killCat(1, 0))
			.to.be.revertedWith("This god cat is not yours!");

		// cat is immune
		await necklacesContract.startEvent();
		await necklacesContract.consumeImmunityNecklace(0, 1);
		await expect(genesisContract.killCat(1, 0))
			.to.be.revertedWith("Cat is currently immune");

		// new curse & new necklace event; cat's immunity is reset
		await necklacesContract.startEvent();
		await genesisContract.killCat(1, 0);
		expect(await catsContract.isCatDead(0)).to.equal(true);

		// cat is dead
		await expect(genesisContract.killCat(1, 0))
			.to.be.revertedWith("Cat is dead!");

		// max kills per curse reached
		await genesisContract.setMaxKillsPerCurse(2);
		await genesisContract.killCat(1, 2);
		await expect(genesisContract.killCat(1, 3))
			.to.be.revertedWith("Max amount of kills per curse reached.");
	});
});