import { deployContract } from "./utils";
import { NightCats, NightCatsGenesis} from "../typechain-types";
import hre, { waffle } from "hardhat";
import {expect} from "chai";

describe("claim genesis", () => {
	it("should let secondary collection claim genesis", async () => {
		const [_, otherAccount] = await hre.ethers.getSigners();
		const nightCatsContract = await deployContract("NightCats") as NightCats;
		const nightCatsGenesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		await nightCatsGenesisContract.setNightCatsContract(nightCatsContract.address);
		await nightCatsContract.setGenesisContract(nightCatsGenesisContract.address);
		await nightCatsContract.setIsPublicMintLive(true);
		await nightCatsContract.publicMint(40, { value: hre.ethers.utils.parseEther("1.4") });
		await nightCatsGenesisContract.premint();
		expect(await nightCatsGenesisContract.totalSupply()).to.equal(await nightCatsGenesisContract.premintSupply());
		await nightCatsGenesisContract.setPublicSupply(0);
		await nightCatsGenesisContract.setReserveSupply(2);
		await expect(nightCatsGenesisContract.connect(otherAccount).claimGenesis([0,1,2,3,4,5,6,7,8,9]))
			.to.be.revertedWith("You are not the owner of cat #0");
		await nightCatsGenesisContract.claimGenesis([0,1,2,3,4,5,6,7,8,9]);
		expect(await nightCatsGenesisContract.totalSupply()).to.equal((await nightCatsGenesisContract.premintSupply()).add(1n));
		await nightCatsGenesisContract.claimGenesis([10,11,12,13,14,15,16,17,18,19]);
		expect(await nightCatsGenesisContract.totalSupply()).to.equal((await nightCatsGenesisContract.premintSupply()).add(2n));
		// claim limit reached (reserveSupply)
		expect(await nightCatsGenesisContract.totalSupply()).to.equal(35);
		await expect(nightCatsGenesisContract.claimGenesis([20,21,22,23,24,25,26,27,28,29]))
			.to.be.revertedWith("Max limit reached!");
	});

	it("should revert if burning of nightCats failed", async () => {
		const [deployerOfContract, otherAccount] = await hre.ethers.getSigners();
		const NightCats = require('../artifacts/contracts/NightCats.sol/NightCats.json');
		const nightCatsContract = await waffle.deployMockContract(deployerOfContract, NightCats.abi);
		await nightCatsContract.mock.burn.revertsWithReason("Burning failed");
		await nightCatsContract.mock.ownerOf.returns(deployerOfContract.address);
		const nightCatsGenesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		await nightCatsGenesisContract.setNightCatsContract(nightCatsContract.address);
		await nightCatsGenesisContract.premint();
		expect(await nightCatsGenesisContract.totalSupply()).to.equal(await nightCatsGenesisContract.premintSupply());
		await nightCatsGenesisContract.setPublicSupply(0);
		await nightCatsGenesisContract.setReserveSupply(2);
		await expect(nightCatsGenesisContract.claimGenesis([0,1,2,3,4,5,6,7,8,9]))
			.to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Burning failed'");
	});
});