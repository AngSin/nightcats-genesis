import {ethers} from "hardhat";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
const addresses: string[] = require('../scripts/wlAddresses.json');

export const deployContract = async (contractName: string) => {
	const ContractFactory = await ethers.getContractFactory(contractName);
	return await ContractFactory.deploy();
}

export const bufferToHex = (x: Buffer) => `0x${x.toString('hex')}`;

export const createNewTree = (newAddresses: string[]) => {
	const wlAddresses = [...addresses, ...newAddresses];
	const leaves = wlAddresses.map((address: string) => keccak256(address));
	const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
	return tree;
};

export const createTree = (newAddresses: string[]) => {
	const wlAddresses = [...addresses, ...newAddresses];
	const leaves = wlAddresses.map((address: string) => keccak256(address));
	const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
	return tree;
};