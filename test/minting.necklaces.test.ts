import { expect } from "chai";
import hre  from "hardhat";
import { deployContract } from "./utils";
import { NightCatsGenesis, Necklaces } from "../typechain-types";

describe('neklace minting', () => {
	it('should let owner mint with right type', async () => {
		const necklacesContract = await deployContract("Necklaces") as Necklaces;
		await necklacesContract.ownerMint(7);
		expect(await necklacesContract.tokenIdToType(0)).to.equal(1);
		expect(await necklacesContract.tokenIdToType(1)).to.equal(0);
		expect(await necklacesContract.tokenIdToType(2)).to.equal(0);
		expect(await necklacesContract.tokenIdToType(3)).to.equal(1);
		expect(await necklacesContract.tokenIdToType(4)).to.equal(0);
		expect(await necklacesContract.tokenIdToType(5)).to.equal(0);
		expect(await necklacesContract.tokenIdToType(6)).to.equal(1);
	});

	describe("claim necklaces", () => {
		it("should only work when event is active", async () => {
			const nightCatsGenesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
			const necklacesContract = await deployContract("Necklaces") as Necklaces;
			await necklacesContract.setNightCatsGenesisContract(nightCatsGenesisContract.address);
			await expect(necklacesContract.claimNecklaces(0, true)).to.be.rejectedWith("Event is not Active!");
		});

		it("should only work for genesis cat owners", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const nightCatsGenesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
			const necklacesContract = await deployContract("Necklaces") as Necklaces;
			await necklacesContract.setNightCatsGenesisContract(nightCatsGenesisContract.address);
			await necklacesContract.startEvent();
			await nightCatsGenesisContract.premint();
			await expect(necklacesContract.connect(otherAccount).claimNecklaces(0, true))
				.to.be.rejectedWith("This is not your cat!");
		});

		it("should only work for cat owners", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const nightCatsContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
			const necklacesContract = await deployContract("Necklaces") as Necklaces;
			await necklacesContract.setNightCatsContract(nightCatsContract.address);
			await necklacesContract.startEvent();
			await nightCatsContract.premint();
			await expect(necklacesContract.connect(otherAccount).claimNecklaces(0, false))
				.to.be.rejectedWith("This is not your cat!");
		});

		it("should not let cats claim more than 2 necklaces per event", async () => {
			const nightCatsContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
			const necklacesContract = await deployContract("Necklaces") as Necklaces;
			await necklacesContract.setNightCatsContract(nightCatsContract.address);
			await necklacesContract.startEvent();
			await nightCatsContract.premint();
			expect(await necklacesContract.totalSupply()).to.equal(0);
			await necklacesContract.claimNecklaces(0, false);
			expect(await necklacesContract.totalSupply()).to.equal(2);
			await expect(necklacesContract.claimNecklaces(0, false))
				.to.be.revertedWith("You have already claimed the max amount!");
			await necklacesContract.claimNecklaces(1, false);
			expect(await necklacesContract.totalSupply()).to.equal(4);
			await necklacesContract.startEvent();
			await necklacesContract.claimNecklaces(0, false);
			expect(await necklacesContract.totalSupply()).to.equal(6);
		});
	});
});