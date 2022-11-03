const { ethers, network } = require("hardhat");

const TOKEN_ID = 0;


async function checkNftOwner() {
    const basicNft = await ethers.getContract("BasicNft");

    const owner = await basicNft.ownerOf(TOKEN_ID);

    console.log(`Owner of NFT with tokenId ${TOKEN_ID} is ${owner}`);
}

checkNftOwner()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
