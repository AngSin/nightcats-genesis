const addresses = require('./wlAddresses.json');
const keccak256 = require('keccak256');
const { MerkleTree } = require('merkletreejs');

const leaves = [...addresses, "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2"].map((address: string) => keccak256(address));
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
const bufferToHex = (x: Buffer) => `0x${x.toString('hex')}`;
const wlHex = bufferToHex(tree.getRoot());

console.log(wlHex);
console.log(tree.getHexProof(keccak256("0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2")));

