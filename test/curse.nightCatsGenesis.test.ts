import { deployContract } from "./utils";
import { NightCatsGenesis } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

describe("curse", () => {
	it("isCurseActive should work", async () => {
		const genesisCats = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		const moreThanThreeDaysInSeconds = (60 * 60 * 24 * 3) + 1;
		await genesisCats.inflictCurse();
		expect(await genesisCats.isCurseActive()).to.equal(true);
		await time.increase(moreThanThreeDaysInSeconds);
		expect(await genesisCats.isCurseActive()).to.equal(false);
	});

	it("curse should be default of 3 days, which should be changeable", async () => {
		const genesisCats = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		expect(await genesisCats.cursePeriod()).to.equal(60 * 60 * 24 * 3);
		await genesisCats.setCursePeriod(6)
		expect(await genesisCats.cursePeriod()).to.equal(6);
	});
});