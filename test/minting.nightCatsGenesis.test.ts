import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre  from "hardhat";
import {bufferToHex, createNewTree, deployContract} from "./utils";
import {NightCatsGenesis} from "../typechain-types";
import keccak256 from "keccak256";

describe("Genesis Cats minting", function () {
	it('should mint', async () => {
		const [owner] = await hre.ethers.getSigners();
		const tree = createNewTree(owner.address);
		const genesisCats = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		await genesisCats.setWlHex(bufferToHex(tree.getRoot()));
		const hexProof = tree.getHexProof(keccak256(owner.address));
		expect(await genesisCats.mint(hexProof)).to.equal("hi");
	});

	it('should mint', async () => {
		const [_, otherAccount] = await hre.ethers.getSigners();
		const tree = createNewTree(otherAccount.address);
		const genesisCats = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		await genesisCats.setWlHex(bufferToHex(tree.getRoot()));
		const hexProof = tree.getHexProof(keccak256(otherAccount.address));
		await expect(genesisCats.mint(hexProof)).to.be.revertedWith("You are not whitelisted!");
	});
});
