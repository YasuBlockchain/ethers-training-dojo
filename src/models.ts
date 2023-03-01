import {BigNumber, Event} from "ethers";

export interface WalletModel {
    address?: string
    balanceInWei?: string
    chain?: ChainModel
}

export interface ChainModel {
    id: number
    name?: string
    symbol?: string
    explorer?: string
    rpc?: string
}

export interface ERC20Model {
    name?: string,
    symbol?: string,
    balanceOfConnectedAccount?: BigNumber
    totalSupply?: BigNumber
    events?: {
        transferFrom?: Event[],
        transferTo?: Event[],
    }
}

