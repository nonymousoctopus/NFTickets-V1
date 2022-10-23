const { network } = require("hardhat")
const {networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { verify } = require("../utils/verify")
require("dotenv").config()

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    log("Deploying NFTickets Token contrat")
    const NFTicketsTok = await deploy("NFTicketsTok", {
        from: deployer,
        args: "",
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`Token deployed at ${NFTicketsTok.address}`)
    log('------------------')

    log("Deploying NFTickets Utils contrat")
    const NFTicketsUtils = await deploy("NFTicketsUtils", {
        from: deployer,
        args: "",
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`Utils deployed at ${NFTicketsUtils.address}`)
    log('------------------')

    log("Deploying NFTickets Arbitration contrat")
    const NFTicketsArbitration = await deploy("NFTicketsArbitration", {
        from: deployer,
        args: [NFTicketsTok.address],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`Arbitration deployed at ${NFTicketsArbitration.address}`)
    log('------------------')

    log("Deploying NFTickets Market contrat")
    const NFTicketsMarket = await deploy("NFTicketsMarket", {
        from: deployer,
        args: [NFTicketsArbitration.address, NFTicketsUtils.address],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`Market deployed at ${NFTicketsMarket.address}`)
    log('------------------')

    log("Deploying NFTickets Ticket contrat")
    const NFTicketsTic = await deploy("NFTicketsTic", {
        from: deployer,
        args: [NFTicketsMarket.address],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`Ticket deployed at ${NFTicketsTic.address}`)
    log('------------------')
    //log(`Verify with: \n npx hardhat verify --network ${networkName} ${NFTicketsTok.address} ${args.toString().replace(/,/g, " ")

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        //await verify(NFTicketsTok.address, [ethUsdPriceFeedAddress])
        await verify(NFTicketsTok.address)
        await verify(NFTicketsUtils.address)
        await verify(NFTicketsArbitration.address, [NFTicketsTok.address])
        await verify(NFTicketsMarket.address, [NFTicketsArbitration.address, NFTicketsUtils.address])
        await verify(NFTicketsTic.address, [NFTicketsMarket.address])
    }
}

module.exports.tags = ["all", "NFTickets"]