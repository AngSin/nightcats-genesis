import { deployContract } from "./utils";
import {NightCats, NightCatsGenesis} from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

describe("curse", () => {
	it("isCurseActive should work", async () => {
		const genesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		const nightCatsContract = await deployContract("NightCats") as NightCats;
		await genesisContract.setNightCatsContract(nightCatsContract.address);
		await nightCatsContract.setGenesisContract(genesisContract.address);
		const moreThanThreeDaysInSeconds = (60 * 60 * 24 * 3) + 1;
		await genesisContract.inflictCurse();
		expect(await genesisContract.isCurseActive()).to.equal(true);
		await time.increase(moreThanThreeDaysInSeconds);
		expect(await genesisContract.isCurseActive()).to.equal(false);
	});

	it("curse should be default of 3 days, which should be changeable", async () => {
		const genesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		const nightCatsContract = await deployContract("NightCats") as NightCats;
		await genesisContract.setNightCatsContract(nightCatsContract.address);
		await nightCatsContract.setGenesisContract(genesisContract.address);
		expect(await genesisContract.cursePeriod()).to.equal(60 * 60 * 24 * 3);
		await genesisContract.setCursePeriod(6)
		expect(await genesisContract.cursePeriod()).to.equal(6);
	});
});