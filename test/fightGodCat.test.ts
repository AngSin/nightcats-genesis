import hre from "hardhat";
import {deployContract} from "./utils";
import {Necklaces, NightCatsGenesis} from "../typechain-types";
import {expect} from "chai";
import {BigNumber} from "ethers";

describe("fightGodCat", () => {
	it("should let cats enter raffle", async () => {
		const [owner, otherAccount] = await hre.ethers.getSigners();
		const genesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		const necklacesContract = await deployContract("Necklaces") as Necklaces;
		await genesisContract.premint();
		await necklacesContract.ownerMint(5);
		await expect(necklacesContract.fightGodCat(0, [0,1]))
			.to.be.revertedWith("Raffle not active!");
		await necklacesContract.startRaffle();
		await necklacesContract.setNightCatsGenesisContract(genesisContract.address);
		await expect(necklacesContract.connect(otherAccount).fightGodCat(0, [0,1]))
			.to.be.revertedWith("This is not your cat!");
		await necklacesContract.fightGodCat(0, [0, 1]);
		expect(await necklacesContract.getRaffleEntries()).to.eql([
			BigNumber.from(0),
			BigNumber.from(0),
			BigNumber.from(0),
			BigNumber.from(0),
		]);
		await expect(necklacesContract.fightGodCat(0, [0, 1]))
			.to.be.revertedWith("VM Exception while processing transaction: reverted with custom error 'OwnerQueryForNonexistentToken()'");
		await necklacesContract.fightGodCat(1, [2, 4]);
		expect(await necklacesContract.getRaffleEntries()).to.eql([
			BigNumber.from(0),
			BigNumber.from(0),
			BigNumber.from(0),
			BigNumber.from(0),
			BigNumber.from(1),
			BigNumber.from(1),
		]);
	});
});
