import { expect } from "chai";
import hre  from "hardhat";
import {bufferToHex, createNewTree, deployContract} from "./utils";
import {NightCatsGenesis} from "../typechain-types";
import keccak256 from "keccak256";

describe("Genesis Cats minting", function () {
	it('should allow minting only till max limit', async () => {
		const [_, otherAccount] = await hre.ethers.getSigners();
		const tree = createNewTree(otherAccount.address);
		const genesisCats = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		await genesisCats.setWlHex(bufferToHex(tree.getRoot()));
		const hexProof = tree.getHexProof(keccak256(otherAccount.address));
		await genesisCats.premint();
		await genesisCats.setIsWlMintLive(true);
		await expect(genesisCats.connect(otherAccount)
			.mint(hexProof, { value: hre.ethers.utils.parseEther("0.029") }))
			.to.be.revertedWith("Not enough ETH sent!");
		await genesisCats.connect(otherAccount)
			.mint(hexProof, { value: hre.ethers.utils.parseEther("0.03") });
		expect(await genesisCats.totalSupply()).to.equal((await genesisCats.reserveSupply()).add(1));
		await expect(genesisCats.connect(otherAccount)
			.mint(hexProof, { value: hre.ethers.utils.parseEther("0.03") }))
			.to.be.revertedWith("You have already minted enough!");
	});

	it('should not allow minting if not in WL', async () => {
		const [_, otherAccount, otherAccount1] = await hre.ethers.getSigners();
		const tree = createNewTree(otherAccount.address);
		const genesisCats = await deployContract("NightCatsGenesis") as NightCatsGenesis;
		await genesisCats.setWlHex(bufferToHex(tree.getRoot()));
		const hexProof = tree.getHexProof(keccak256(otherAccount1.address));
		await genesisCats.premint();
		await genesisCats.setIsWlMintLive(true);
		await expect(genesisCats.connect(otherAccount1).mint(hexProof, {
			value: hre.ethers.utils.parseEther("0.03"),
		})).to.be.revertedWith("You are not whitelisted!");
	});
});
