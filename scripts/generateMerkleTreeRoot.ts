const addresses = require('./wlAddresses.json');
const keccak256 = require('keccak256');
const { MerkleTree } = require('merkletreejs');

const leaves = addresses.map((address: string) => keccak256(address));
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
const bufferToHex = (x: Buffer) => `0x${x.toString('hex')}`;
const wlHex = bufferToHex(tree.getRoot());

console.log(wlHex);
console.log(tree.getHexProof(keccak256("0xf18622888a9a2867EC820dE936fd816c9a644c48")));

