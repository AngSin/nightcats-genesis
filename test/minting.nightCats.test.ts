import {expect} from "chai";
import hre from "hardhat";
import {bufferToHex, createNewTree, deployContract} from "./utils";
import {NightCats, NightCatsGenesis} from "../typechain-types";
import keccak256 from "keccak256";

describe("NightCats minting", function () {
	describe("whitelist minting", () => {
		it('should allow minting only till max limit', async () => {
			const [ownerAccount, otherAccount, otherAccount1] = await hre.ethers.getSigners();
			const tree = createNewTree([otherAccount.address, otherAccount1.address]);
			const nightCats = await deployContract("NightCats") as NightCats;
			await nightCats.setWlHex(bufferToHex(tree.getRoot()));
			const hexProof = tree.getHexProof(keccak256(otherAccount.address));
			await nightCats.setIsWlMintLive(true);
			await expect(nightCats.connect(otherAccount)
				.wlMint(hexProof, 3, { value: hre.ethers.utils.parseEther("0.074") }))
				.to.be.revertedWith("Not enough ETH sent!");
			await expect(nightCats.connect(otherAccount)
				.wlMint(hexProof, 4, { value: hre.ethers.utils.parseEther("0.1") }))
				.to.be.revertedWith("You are attempting to mint more than you're allowed");
			await nightCats.connect(otherAccount)
				.wlMint(hexProof, 3, { value: hre.ethers.utils.parseEther("0.075") });
			expect(await nightCats.totalSupply()).to.equal(3);
			await expect(nightCats.connect(otherAccount)
				.wlMint(hexProof, 1, { value: hre.ethers.utils.parseEther("0.03") }))
				.to.be.revertedWith("You have already minted enough!");
			const hexProof1 = tree.getHexProof(keccak256(otherAccount1.address));
			await nightCats.connect(otherAccount1)
				.wlMint(hexProof1, 2, { value: hre.ethers.utils.parseEther("0.05") });
			expect(await nightCats.totalSupply()).to.equal(5);
			const hexProof2 = tree.getHexProof(keccak256(ownerAccount.address));
			await expect(nightCats
				.wlMint(hexProof2, 3, { value: hre.ethers.utils.parseEther("0.075") }))
				.to.be.revertedWith("You are not whitelisted!");
			await nightCats.setMaxSupply(5);
			await expect(nightCats.connect(otherAccount1)
				.wlMint(hexProof1, 2, { value: hre.ethers.utils.parseEther("0.05") }))
				.to.be.revertedWith("Attempting to mint above max supply!")
		});
	});

	describe("public mint", () => {
		it('should let public mint', async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const nightCatsContract = await deployContract("NightCats") as NightCats;
			await nightCatsContract.setMaxSupply(4);
			await nightCatsContract.setIsPublicMintLive(true);
			await nightCatsContract.publicMint(3, { value: hre.ethers.utils.parseEther("0.15")});
			expect(await nightCatsContract.totalSupply()).to.equal(3);
			await expect(nightCatsContract.connect(otherAccount)
				.publicMint(2, { value: hre.ethers.utils.parseEther("0.15")}))
				.to.be.revertedWith("Attempting to mint above max supply!");
			await expect(nightCatsContract.connect(otherAccount)
				.publicMint(1, { value: hre.ethers.utils.parseEther("0.034")}))
				.to.be.revertedWith("Not enough ETH sent!");
			await nightCatsContract.connect(otherAccount)
				.publicMint(1, { value: hre.ethers.utils.parseEther("0.035")});
			expect(await nightCatsContract.totalSupply()).to.equal(4);
		});
	});
});
