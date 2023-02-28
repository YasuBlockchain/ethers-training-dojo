## FOLLOW THE INSTRUCTIONS

### Install the project dependencies

Open your terminal at the root of the project & type "npm install"

### Create your own ".env.local" for environment variables

The .env (not the .env.local) file has empty variable. Copy & paste them into your .env.local file.

#### 1. Get an INFURA account

- [Sign up](https://app.infura.io/register) and get your API Key from INFURA
- Go to your .env.local file and past it next to INFURA_API_KEY 
  - E.g: REACTA_APP_INFURA_API_KEY=MY_API_KEY

#### 2. Create your own ERC20 in Ethereum Testnet (Goerli)

- Deploy the [ERC20 contract](https://github.com/SolidityPracticeDojo/ethers-training/blob/main/src/artifacts/Erc20.sol)
  in the ethereum testnet (Goerli).
- Once deployed go yo your .env.local file and past the address & the symbol of the token next to REACT_APP_GOERLI_ERC20_TOKEN_ADDRESS
  & REACT_APP_GOERLI_ERC20_TOKEN_SYMBOL 
  - E.g: REACT_APP_GOERLI_ERC20_TOKEN_ADDRESS=0x0f264d757A7C9eab9E005F89089E7155Ff0d3cfg



## What can I do in the App?

* Login to Metamask
    * if you are using other network than Polygon or Goerli Test,et, your wallet will be asked to switch to Polygon (mumbai)
    * you can't log in if you didn't sign the "hello" message
* Print some basic data like connected address, network name, id & balance
* Switch from Goerli to Polygon and vice-versa (If Goerli or Mumbai are not added to Metamask, it will be added automatically)
* Goerli ERC20
  * Print some data like Token symbol, total supply ...
  * List transfers from / to signer
  * Listen to Transfer events
* Logout

Good to know

- Infura is a node supplier
- Most of the wallets respect the [EIP-1102](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1102.md) and
  the [EIP-1193](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md) to normalize their API. 
