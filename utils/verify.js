const { run } = require("hardhat");

/**
 * Use this function only to verify contract on etherscan networks
 *
 * @param contractAddress The contract address
 * @param args            The constructor arguments of the contract
 * @returns {Promise<void>}
 */
async function verify(contractAddress, args) {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLocaleString().includes("already ferified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
}

module.exports = {
  verify,
};
