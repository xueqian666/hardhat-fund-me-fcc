const{ deployments, ethers, getNamedAccounts } = require("hardhat")
const { expect, assert } = require("chai")
const{ get} = deployments
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
    let fundMe
    let mockV3Aggregator
    let deployer
    let fundMe_address
    const sendValue = ethers.parseEther("1")// 1 eth

    beforeEach(async () => {
        // const accounts = await ethers.getSigners()
        // deployer = accounts[0]
        deployer = (await getNamedAccounts()).deployer
        //use hardhat-deploy deploy the FundMe contract
        await deployments.fixture(["all"])
        //拿到最新部署的合约, 所有种类的合约
        fundMe = await ethers.getContract("FundMe", deployer);
        fundMe_address = await fundMe.getAddress()
        //拿到 mockV3Aggregator 合约
        mockV3Aggregator = await get("MockV3Aggregator", deployer)
        //console.log("fundMe.provider: ", ethers.provider); // 输出 fundMe.provider 的信息
    })
    describe("constructor", function () {
        it("sets the aggregator addresses correctly", async () => {
            const response = await fundMe.getPriceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })
    describe("fund", function () {
        // https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
        // could also do assert.fail
        it("Fails if you don't send enough ETH", async () => {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            )
        })
        // we could be even more precise here by making sure exactly $50 works
        // but this is good enough for now
        it("Updates the amount funded data structure", async () => {
            await fundMe.fund({ value: sendValue }) //action
            const response = await fundMe.getAddressToAmountFunded(
                deployer
            )
            assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to array of funders", async () => {
            await fundMe.fund({ value: sendValue }) //action
            const response = await fundMe.getFunder(0)
            assert.equal(response, deployer)
        })
    })
    describe("cheaperWithdraw", function () {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue }) // action 确保fund过， 确保注入基金
        })
        it("withdraws ETH from a single funder", async () => {

            // Arrange
            const startingFundMeBalance = await ethers.provider.getBalance(fundMe_address)
            const startingDeployerBalance = await ethers.provider.getBalance(deployer)

            // Act
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait()

            const { gasUsed, gasPrice } = transactionReceipt
            const gasCost = gasUsed * gasPrice
            
            const endingFundMeBalance = await ethers.provider.getBalance(fundMe_address)
            const endingDeployerBalance = await ethers.provider.getBalance(deployer)

            // Assert
            // Maybe clean up to understand the testing
            // 提现完合约剩0
            assert.equal(endingFundMeBalance, 0)
            // 最后提现的人的钱 + gas fee = 合约里的钱 + 提现人提现之前的钱
            assert.equal(
                (startingFundMeBalance + startingDeployerBalance)
                    .toString(),
                (endingDeployerBalance + gasCost).toString()
            ) 
        })
        // this test is overloaded. Ideally we'd split it into multiple tests
        // but for simplicity we left it as one
        it("is allows us to withdraw with multiple funders", async () => {
            // Arrange
            const accounts = await ethers.getSigners()
            // i 从1 开始而不是从0开始 是因为0是deployer
            for (i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(accounts[i])
                await fundMeConnectedContract.fund({ value: sendValue })
            }
            const startingFundMeBalance = await ethers.provider.getBalance(fundMe_address)
            const startingDeployerBalance = await ethers.provider.getBalance(deployer)

            // Act
            // const transactionResponse = await fundMe.cheaperWithdraw()
            // Let's comapre gas costs :)
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait()
            const { gasUsed, gasPrice } = transactionReceipt
            const withdrawGasCost = gasUsed * gasPrice

            const endingFundMeBalance = await ethers.provider.getBalance(fundMe_address)
            const endingDeployerBalance = await ethers.provider.getBalance(deployer)

            // Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                (startingFundMeBalance + startingDeployerBalance)
                    .toString(),
                (endingDeployerBalance + withdrawGasCost).toString()
            )

            // Make a getter for storage variables
            await expect(fundMe.getFunder(0)).to.be.reverted
            for (i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(
                        accounts[i].address
                    ),
                    0
                )
            }
        })
        it("Only allows the owner to withdraw", async function () {
            const accounts = await ethers.getSigners()
            const fundMeConnectedContract = await fundMe.connect(accounts[1])
            await expect(fundMeConnectedContract.cheaperWithdraw()).to.be.reverted
        })
    })
})