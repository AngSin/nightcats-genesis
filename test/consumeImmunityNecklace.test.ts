import {deployContract} from "./utils";
import {Necklaces, NightCats, NightCatsGenesis} from "../typechain-types";
import {expect} from "chai";

describe("consumeImmunityNecklace", () => {
	it("should allow consumption of immunity necklaces", async () => {
		const genesisContract = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		const necklacesContract = await deployContract("Necklaces") as Necklaces;
		const nightCatsContract = await deployContract("NightCats") as NightCats;
		await nightCatsContract.setGenesisContract(genesisContract.address);
		await genesisContract.setNightCatsContract(nightCatsContract.address);
		await nightCatsContract.setNecklaceContract(necklacesContract.address);
		await necklacesContract.setNightCatsContract(nightCatsContract.address);
		await nightCatsContract.premint();
		await necklacesContract.ownerMint(5);
		await expect(necklacesContract.consumeImmunityNecklace(0, 1))
			.to.be.rejectedWith("Event is not Active!");
		await necklacesContract.startEvent();
		await necklacesContract.consumeImmunityNecklace(0, 1);
		expect(await nightCatsContract.isCatCurrentlyImmune(0)).to.equal(true);
		expect(await nightCatsContract.isCatCurrentlyImmune(1)).to.equal(false);
		await necklacesContract.consumeImmunityNecklace(2, 2);
		expect(await nightCatsContract.isCatCurrentlyImmune(2)).to.equal(true);
		await expect(necklacesContract.ownerOf(1))
			.to.be.rejectedWith("");
		await necklacesContract.startEvent();
		expect(await nightCatsContract.isCatCurrentlyImmune(0)).to.equal(false);
	});
});