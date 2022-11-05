import {expect} from "chai";
import hre from "hardhat";
import {bufferToHex, createNewTree, deployContract} from "./utils";
import {NightCats, NightCatsGenesis} from "../typechain-types";
import keccak256 from "keccak256";

describe("NightCats minting", function () {
	it('should allow minting only till max limit', async () => {
		const [ownerAccount, otherAccount, otherAccount1] = await hre.ethers.getSigners();
		const tree = createNewTree([otherAccount.address, otherAccount1.address]);
		const genesisCats = await deployContract("NightCats") as NightCats;
		await genesisCats.setWlHex(bufferToHex(tree.getRoot()));
		const hexProof = tree.getHexProof(keccak256(otherAccount.address));
		await genesisCats.setIsWlMintLive(true);
		await expect(genesisCats.connect(otherAccount)
			.wlMint(hexProof, 3, { value: hre.ethers.utils.parseEther("0.074") }))
			.to.be.revertedWith("Not enough ETH sent!");
		await genesisCats.connect(otherAccount)
			.wlMint(hexProof, 3, { value: hre.ethers.utils.parseEther("0.075") });
		expect(await genesisCats.totalSupply()).to.equal(3);
		await expect(genesisCats.connect(otherAccount)
			.wlMint(hexProof, 1, { value: hre.ethers.utils.parseEther("0.03") }))
			.to.be.revertedWith("You have already minted enough!");
		const hexProof1 = tree.getHexProof(keccak256(otherAccount1.address));
		await genesisCats.connect(otherAccount1)
			.wlMint(hexProof1, 3, { value: hre.ethers.utils.parseEther("0.075") });
		expect(await genesisCats.totalSupply()).to.equal(6);
		const hexProof2 = tree.getHexProof(keccak256(ownerAccount.address));
		await expect(genesisCats
			.wlMint(hexProof2, 3, { value: hre.ethers.utils.parseEther("0.075") }))
			.to.be.revertedWith("You are not whitelisted!");
	});
});
