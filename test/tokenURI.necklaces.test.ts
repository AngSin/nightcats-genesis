import {deployContract} from "./utils";
import {Necklaces} from "../typechain-types";
import {expect} from "chai";

describe("Necklaces tokenURI", () => {
	it("should return the right token uri", async () => {
		const necklacesContract = await deployContract("Necklaces") as Necklaces;
		await necklacesContract.ownerMint(7);
		expect(await necklacesContract.isResurrectionNecklace(0)).to.equal(true);
		expect(await necklacesContract.isImmunityNecklace(0)).to.equal(false);
		expect(await necklacesContract.isResurrectionNecklace(1)).to.equal(false);
		expect(await necklacesContract.isImmunityNecklace(1)).to.equal(true);

		await necklacesContract.setResurrectionUri("https://resurrection/");
		await necklacesContract.setImmunityUri("https://immunity/");

		expect(await necklacesContract.tokenURI(0)).to.equal("https://resurrection/0");
		expect(await necklacesContract.tokenURI(1)).to.equal("https://immunity/1");
	});
});