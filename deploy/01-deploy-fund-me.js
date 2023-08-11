const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({getNamedAccounts, deployments }) =>{
    const{ deploy, log, get} = deployments
    const{ deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    //get the ethUsdPriceFeedAddress from the network config according to chainId
    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if (chainId == 31337) {
        //get the latest mock contract deployment
        const ethUsdAggregator = await get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    }
    else{
        //Testnet: get the ethUsdPriceFeedAddress from the network config according to chainId
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    //if the price feed contract doesn't exit, we deploy the minium version for local network testing
    // Use chainId get price feed address
    // If chainId is X use address Y
    // If chainId is Z use address A
    // So used Avae to achieve the above goal
    // Use helper-hardhat-config
    const fundMe = await deploy("FundMe", {
        from: deployer, // who deploy this contract
        args: [ethUsdPriceFeedAddress], //put price feed address // parameters
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log("FundMe Deployed!")
    if(chainId != 31337 && process.env.ETHERSCAN_API_KEY){
        //verify
        await verify(fundMe.address, [ethUsdPriceFeedAddress])
    }
    log("----------------------------------------------------")
}
//只运行带有特殊标签的脚本
module.exports.tags = ["all", "fundme"]

