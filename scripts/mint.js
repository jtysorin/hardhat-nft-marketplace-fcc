const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/move-blocks");

const PRICE = ethers.utils.parseEther("0.5");

async function mint() {
    const nftMarketPlace = await ethers.getContract("NftMarketPlace");
    const basicNft = await ethers.getContract("BasicNft");
    console.log("Minting...");
    const mintTx = await basicNft.mintNft();
    const mintTxReceipt = await mintTx.wait(1);
    const tokenId = mintTxReceipt.events[0].args.tokenId;
    console.log(`Got tokenId: ${tokenId}`);
    console.log(`NFT Address: ${basicNft.address}`);

    if (network.config.chainId == "31337") {
        // Moralis has a hard time if you move more than 1 an once!
        await moveBlocks(1, (sleepAmount = 1000));
    }
}

mint()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
