import {deployContract} from "./utils";
import {NightCats, NightCatsGenesis} from "../typechain-types";
import {expect} from "chai";
import {time} from "@nomicfoundation/hardhat-network-helpers";

describe("tokenURI", () => {
	it("should return god uri even when curse is active", async () => {
		const genesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		const nightCatsContract = await deployContract("NightCats") as NightCats;
		await genesisContract.setNightCatsContract(nightCatsContract.address);
		await nightCatsContract.setGenesisContract(genesisContract.address);
		await genesisContract.setGodCatTokenIds([0, 1, 3]);
		expect(await genesisContract.tokenURI(3)).to.equal(await genesisContract.godCatUri() + 3);
		await genesisContract.inflictCurse();
		expect(await genesisContract.tokenURI(3)).to.equal(await genesisContract.godCatUri() + 3);
	});

	it("should return relevant uris depending on curse", async () => {
		const genesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		const nightCatsContract = await deployContract("NightCats") as NightCats;
		await genesisContract.setNightCatsContract(nightCatsContract.address);
		await nightCatsContract.setGenesisContract(genesisContract.address);
		expect(await genesisContract.tokenURI(3)).to.equal(await genesisContract.baseStateUri() + 3);
		const newBaseStateUri = "https://baseState/";
		await genesisContract.setBaseStateUri(newBaseStateUri);
		expect(await genesisContract.tokenURI(3)).to.equal(`${newBaseStateUri}3`);
		// first curse
		await genesisContract.inflictCurse();
		expect(await genesisContract.tokenURI(3)).to.equal(await genesisContract.cursedStateUri() + 3);
		// first curse ends
		const moreThanThreeDaysInSeconds = (60 * 60 * 24 * 3) + 1;
		await time.increase(moreThanThreeDaysInSeconds);
		expect(await genesisContract.tokenURI(3)).to.equal(`${newBaseStateUri}3`);
		// second curse
		await genesisContract.inflictCurse();
		expect(await genesisContract.tokenURI(3)).to.equal(await genesisContract.cursedStateUri() + 3);
		// second curse ends
		await time.increase(moreThanThreeDaysInSeconds);
		expect(await genesisContract.tokenURI(3)).to.equal(await genesisContract.finalStateUri() + 3);
		// third curse
		await genesisContract.inflictCurse();
		expect(await genesisContract.tokenURI(3)).to.equal(await genesisContract.finalStateUri() + 3);
		// third curse ends
		await time.increase(moreThanThreeDaysInSeconds);
		expect(await genesisContract.tokenURI(3)).to.equal(await genesisContract.finalStateUri() + 3);
	});
});