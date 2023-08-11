const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
  deployer = (await getNamedAccounts()).deployer
  //use hardhat-deploy deploy the FundMe contract
  await deployments.fixture(["all"])
  const fundMe = await ethers.getContract("FundMe", deployer);
  fundMe_address = await fundMe.getAddress()
  console.log(`Got contract FundMe at ${fundMe_address}`)
  console.log("Funding contract...")
  const transactionResponse = await fundMe.fund({
    value: ethers.parseEther("0.1"),
  })
  await transactionResponse.wait()
  console.log("Funded!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })