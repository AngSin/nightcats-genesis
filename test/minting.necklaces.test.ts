import { expect } from "chai";
import hre  from "hardhat";
import { deployContract } from "./utils";
import {NightCatsGenesis, Necklaces, NightCats} from "../typechain-types";

describe('neklace minting', () => {
	it('should let owner mint with right type', async () => {
		const necklacesContract = await deployContract("Necklaces") as Necklaces;
		await necklacesContract.ownerMint(7);
		expect(await necklacesContract.isResurrectionNecklace(0)).to.equal(true);
		expect(await necklacesContract.isImmunityNecklace(0)).to.equal(false);
		expect(await necklacesContract.isResurrectionNecklace(1)).to.equal(false);
		expect(await necklacesContract.isImmunityNecklace(1)).to.equal(true);
		expect(await necklacesContract.isResurrectionNecklace(2)).to.equal(false);
		expect(await necklacesContract.isResurrectionNecklace(3)).to.equal(true);
		expect(await necklacesContract.isResurrectionNecklace(4)).to.equal(false);
		expect(await necklacesContract.isResurrectionNecklace(5)).to.equal(false);
		expect(await necklacesContract.isResurrectionNecklace(6)).to.equal(true);
	});

	describe("claim necklaces", () => {
		it("should only work when event is active", async () => {
			const nightCatsContract = await deployContract("NightCats") as NightCats;
			const nightCatsGenesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
			const necklacesContract = await deployContract("Necklaces") as Necklaces;
			await necklacesContract.setNightCatsContract(nightCatsContract.address);
			await necklacesContract.setNightCatsGenesisContract(nightCatsGenesisContract.address);
			await expect(necklacesContract.claimNecklaces(0, true)).to.be.rejectedWith("Event is not Active!");
		});

		it("should only work for genesis cat owners", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const nightCatsContract = await deployContract("NightCats") as NightCats;
			const nightCatsGenesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
			const necklacesContract = await deployContract("Necklaces") as Necklaces;
			await necklacesContract.setNightCatsContract(nightCatsContract.address);
			await nightCatsContract.setNecklaceContract(necklacesContract.address);
			await necklacesContract.setNightCatsGenesisContract(nightCatsGenesisContract.address);
			await necklacesContract.startEvent();
			await nightCatsGenesisContract.premint();
			await expect(necklacesContract.connect(otherAccount).claimNecklaces(0, true))
				.to.be.rejectedWith("This is not your cat!");
		});

		it("should only work for cat owners", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const nightCatsContract = await deployContract("NightCats") as NightCats;
			const genesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
			const necklacesContract = await deployContract("Necklaces") as Necklaces;
			await necklacesContract.setNightCatsContract(nightCatsContract.address);
			await necklacesContract.setNightCatsGenesisContract(genesisContract.address);
			await nightCatsContract.setNecklaceContract(necklacesContract.address);
			await necklacesContract.startEvent();
			await genesisContract.premint();
			await expect(necklacesContract.connect(otherAccount).claimNecklaces(0, true))
				.to.be.rejectedWith("This is not your cat!");
		});

		it("should not let cats claim more than 2 necklaces per event", async () => {
			const genesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
			const nightCatsContract = await deployContract("NightCats") as NightCats;
			const necklacesContract = await deployContract("Necklaces") as Necklaces;
			await necklacesContract.setNightCatsContract(nightCatsContract.address);
			await necklacesContract.setNightCatsGenesisContract(genesisContract.address);
			await nightCatsContract.setNecklaceContract(necklacesContract.address);
			await necklacesContract.startEvent();
			await genesisContract.premint();
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