import {deployContract} from "./utils";
import {NightCatsGenesis} from "../typechain-types";
import {expect} from "chai";
import {time} from "@nomicfoundation/hardhat-network-helpers";

describe("tokenURI", () => {
	it("should return god uri even when curse is active", async () => {
		const genesisCats = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		await genesisCats.setGodCatTokenIds([0, 1, 3]);
		expect(await genesisCats.tokenURI(3)).to.equal(await genesisCats.godCatUri() + 3);
		await genesisCats.inflictCurse();
		expect(await genesisCats.tokenURI(3)).to.equal(await genesisCats.godCatUri() + 3);
	});

	it("should return relevant uris depending on curse", async () => {
		const genesisCats = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		expect(await genesisCats.tokenURI(3)).to.equal(await genesisCats.baseStateUri() + 3);
		const newBaseStateUri = "https://baseState/";
		await genesisCats.setBaseStateUri(newBaseStateUri);
		expect(await genesisCats.tokenURI(3)).to.equal(`${newBaseStateUri}3`);
		// first curse
		await genesisCats.inflictCurse();
		expect(await genesisCats.tokenURI(3)).to.equal(await genesisCats.cursedStateUri() + 3);
		// first curse ends
		const moreThanThreeDaysInSeconds = (60 * 60 * 24 * 3) + 1;
		await time.increase(moreThanThreeDaysInSeconds);
		expect(await genesisCats.tokenURI(3)).to.equal(`${newBaseStateUri}3`);
		// second curse
		await genesisCats.inflictCurse();
		expect(await genesisCats.tokenURI(3)).to.equal(await genesisCats.cursedStateUri() + 3);
		// second curse ends
		await time.increase(moreThanThreeDaysInSeconds);
		expect(await genesisCats.tokenURI(3)).to.equal(await genesisCats.finalStateUri() + 3);
		// third curse
		await genesisCats.inflictCurse();
		expect(await genesisCats.tokenURI(3)).to.equal(await genesisCats.finalStateUri() + 3);
		// third curse ends
		await time.increase(moreThanThreeDaysInSeconds);
		expect(await genesisCats.tokenURI(3)).to.equal(await genesisCats.finalStateUri() + 3);
	});
});