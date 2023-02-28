import {ChainModel} from "./models";

export const CHAIN_GOERLI: ChainModel = {
    id: 5,
    name: "Goerli Testnet",
    symbol: "ETH",
    explorer: `https://goerli.etherscan.io/`,
    rpc: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`
}
export const CHAIN_POLYGON: ChainModel = {
    id: 80001,
    name: "Polygon Testnet",
    symbol: "MATIC",
    explorer: `https://mumbai.polygonscan.com`,
    rpc: `https://endpoints.omniatech.io/v1/matic/mumbai/public`
}

export const ChainList: ChainModel[] = [
    CHAIN_GOERLI,
    CHAIN_POLYGON
]