// Runs set up functions of the Utils and Arbitration contracts
const { ethers } = require("hardhat")

async function setUpUtils() {
    console.log('Starting Utils and Arbitration setup, please wait a few seconds...')
    const Utils = await ethers.getContract("NFTicketsUtils")
    const Market = await ethers.getContract("NFTicketsMarket")
    const utilsTransactionResponse = await Utils.setUp(Market.address)
    await utilsTransactionResponse.wait(1)
    console.log('Finished Utils setup, starting Arbitration setup...')
    const Tic = await ethers.getContract("NFTicketsTic")
    const Arbitration = await ethers.getContract("NFTicketsArbitration")
    const arbitrationTransactionResponse = await Arbitration.setUp(Market.address, Tic.address)
    await arbitrationTransactionResponse.wait(1)
    console.log('Finished Arbitration setup - all done!')
}

setUpUtils()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })