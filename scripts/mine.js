const { moveBlocks } = require("../utils/move-blocks");

const BLOCKS = 2;
const SLEEP_AMOUNT = 1000;

async function mineBlocks() {
    if (network.config.chainId == "31337") {
        // Moralis has a hard time if you move more than 1 an once!
        await moveBlocks(BLOCKS, SLEEP_AMOUNT);
    }
}

mineBlocks()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
