import React, {FC, useEffect, useState} from 'react';
import {ethers, Event, Transaction} from "ethers";
import {ERC20Model, WalletModel} from "./models";
import {CHAIN_GOERLI, CHAIN_POLYGON, ChainList} from "./constants";
import {toast} from "react-toastify";
import DataTable, {TableColumn} from "react-data-table-component";
import {useFormik} from "formik";
import ABI from "./artifacts/ABI.json"

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const connectAutomtically = urlParams.get('connectAutomatically')

const rpcProvider = new ethers.providers.WebSocketProvider(`wss://goerli.infura.io/ws/v3/${process.env.REACT_APP_INFURA_API_KEY}`)
const web3Provider = new ethers.providers.Web3Provider(window.ethereum)

function App() {
    const [connectedWallet, setConnectedWallet] = useState<WalletModel | null>(null)

    useEffect(() => {
        if (connectAutomtically) {
            try {
                handleWalletLogin()
            } catch (e: any) {
                alert('ici')
                toast.error(e)
            }
        }
    }, [])

    const handleWalletLogin = () => {
        toast.info("Connecting ...", {autoClose: false})

        // Always check if ethereum global variable is defined
        if (typeof window.ethereum !== 'undefined') {

            // Request wallet account
            web3Provider.send('eth_requestAccounts', []).then(() => {

                // Get Network & allow only BSC & Goerli chain
                web3Provider.getNetwork().then((r: any) => {

                    const {chainId} = r
                    if ([CHAIN_GOERLI.id, CHAIN_POLYGON.id].includes(chainId)) {
                        // Get Chain data
                        setConnectedWallet(prev => ({...prev, chain: ChainList.find(item => item.id == chainId)}))

                        // Get account address
                        web3Provider.getSigner().getAddress().then((address: string) => {

                            setConnectedWallet(prev => ({...prev, address}))
                            // Set account balance
                            web3Provider.getBalance(address).then(balance => {

                                setConnectedWallet(prev => ({...prev, balanceInWei: balance.toString()}))

                                toast.dismiss()
                                toast.success("Connnected!")

                                // Listen to all account changes & network swtich
                                listeners()
                            }).catch(e => {
                                toast.error("Failed to get balance.", {autoClose: false})
                                throw e
                            })

                        }).catch(e => {
                            toast.error("Failed to get signer address.", {autoClose: false})
                            throw e
                        })

                    } else {
                        // It will switch automatically to Goerli Testnet & refresh the page because of chainChanged listener
                        toast.dismiss()
                        toast.info("Chain not supported. Switching to Goerli Testnet ...", {autoClose: false})
                        setTimeout(() => {
                            handleSwitchToGoerliChain()
                        }, 1500)
                    }
                }).catch(e => {
                    toast.error("Get network failed.", {autoClose: false})
                    throw e
                })
            }).catch(e => {
                toast.error("Request wallet accounts failed.", {autoClose: false})
                throw e
            })
        } else {
            toast.error("No wallet detected")
        }
    }

    const refreshBalance = (address: string) => {
        web3Provider.getBalance(address).then(balance => {
            console.log(balance.toString())
            setConnectedWallet(prev => ({...prev, balanceInWei: balance.toString()}))
        }).catch(() => {
            toast.error("Failed to refresh balance.", {autoClose: false})
        })
    }

    const handleWalletLogout = () => {
        setConnectedWallet(null)
    }

    const handleAddGoerliChain = () => {
        window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: `0x${Number(CHAIN_GOERLI.id).toString(16)}`,
                chainName: CHAIN_GOERLI.name,
                nativeCurrency: {
                    name: CHAIN_GOERLI.symbol,
                    symbol: CHAIN_GOERLI.symbol,
                    decimals: 18
                },
                rpcUrls: [CHAIN_GOERLI.rpc],
                blockExplorerUrls: [CHAIN_GOERLI.explorer]
            }]
        }).catch(() => {
            toast.error("Could not add Goerli chain.", {autoClose: false})
        })
    }

    const handleAddPolygonChain = async () => {
        window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: `0x${Number(CHAIN_POLYGON.id).toString(16)}`,
                chainName: CHAIN_POLYGON.name,
                nativeCurrency: {
                    name: CHAIN_POLYGON.symbol,
                    symbol: CHAIN_POLYGON.symbol,
                    decimals: 18
                },
                rpcUrls: [CHAIN_POLYGON.rpc],
                blockExplorerUrls: [CHAIN_POLYGON.explorer]
            }]
        }).catch(() => {
            toast.error("Could not add Polygon chain.", {autoClose: false})
        })
    }

    const handleSwitchToGoerliChain = () => {
        window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{chainId: `0X${Number(CHAIN_GOERLI.id).toString(16)}`}]
        }).then(() => {
            window.location.replace("?connectAutomatically=1")
        }).catch((switchError: any) => {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code == 4902) {
                // Add the network!
                handleAddGoerliChain()
            } else {
                throw switchError
            }
        })

    }

    const handleSwitchToPolygon = async () => {
        window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{chainId: `0X${Number(CHAIN_POLYGON.id).toString(16)}`}]
        }).then(() => {
            window.location.replace("?connectAutomatically=1")
        }).catch((switchError: any) => {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code == 4902) {
                // Add the network!
                handleAddPolygonChain()
            } else {
                throw switchError
            }
        })
    }

    const listeners = () => {
        // Listeners
        // -- Everytime an accountsChanged event fires, it will reload the page ( the best possible way to manage chain changes )
        window.ethereum.on('accountsChanged', async (addresses: string[]) => {
            // The "connectAutomatically" parameter will allow the user to connect automatically (see useEffect function)
            window.location.replace("?connectAutomatically=1")
        });

        // -- Everytime an chainChanged event fires, it will reload the page ( the best possible way to manage chain changes )
        window.ethereum.on('chainChanged', () => {
            // The "connectAutomatically" parameter will allow the user to connect automatically (see useEffect function)
            window.location.replace("?connectAutomatically=1")
        })
    }

    return <div className={"container p-4"}>
        <div className="card">
            <div className="card-header">
                <div className="text-center">
                    {connectedWallet ?
                        <button className={"btn btn-danger"} onClick={() => handleWalletLogout()}>Logout</button> :
                        <button className={"btn btn-primary"} onClick={() => handleWalletLogin()}>Login</button>
                    }
                </div>

            </div>
            <div className="card-body">
                {(!connectedWallet || connectedWallet?.chain?.id != CHAIN_GOERLI.id && connectedWallet?.chain?.id != CHAIN_POLYGON.id) &&
                    <div className={"text-center"}>
                        <div className="alert alert-info m-3" role="alert">
                            Only Polygon Testnet (80001) & Goerli Testnet (5) are supported by the app.
                        </div>
                    </div>
                }

                {connectedWallet && [CHAIN_GOERLI.id, CHAIN_POLYGON.id].includes(connectedWallet.chain!.id) && <>
                    <div className="row">
                        <div className="col-6 d-flex align-items-center">
                            <h5>{connectedWallet.chain?.name}</h5>
                        </div>
                        <div className="col-6 d-flex flex-row-reverse">
                            {connectedWallet.chain?.id != CHAIN_GOERLI.id &&
                                <button className={"btn btn-secondary me-2"}
                                        onClick={() => handleSwitchToGoerliChain()}>Switch to
                                    Goerli Testnet</button>}

                            {connectedWallet.chain?.id != CHAIN_POLYGON.id &&
                                <button className={"btn btn-info"}
                                        onClick={() => handleSwitchToPolygon()}>Switch to
                                    Polygon Testnet</button>}
                        </div>
                    </div>

                    <hr/>


                    <ul>
                        <li>Address: {connectedWallet.address}</li>
                        <li>Balance: {connectedWallet.balanceInWei && ethers.utils.formatEther(connectedWallet.balanceInWei)} {connectedWallet.chain?.symbol}</li>
                        <li>ChainId: {connectedWallet?.chain?.id}</li>
                    </ul>


                    <hr/>

                    {connectedWallet.address && connectedWallet.chain?.id == CHAIN_GOERLI.id && <ERC20Container connectedWallet={connectedWallet} refreshBalance={refreshBalance}/>}
                </>
                }

            </div>
        </div>
    </div>
}


type ERC20ContainerProps = {
    connectedWallet: WalletModel
    refreshBalance: (address: string) => void
}
const ERC20Container: FC<ERC20ContainerProps> = ({connectedWallet, refreshBalance}) => {
    const [activeTabEvent, setActiveTabEvent] = useState<"transferFrom" | "transferTo">("transferFrom")
    const [activeWriteContractAction, setActiveWriteContractAction] = useState<"mint" | "transfer" | "burn">()

    const [loadingErc20data, setLoadingErc20data] = useState<boolean>(true)
    const [erc20, setErc20] = useState<ERC20Model | null>(null)

    const columnsTransferFrom: TableColumn<Event>[] = [
        {name: '#', selector: row => row.transactionHash},
        {name: 'Block', selector: row => row.blockNumber, maxWidth: '50px'},
        {name: 'Transaction index', selector: row => row.transactionIndex, maxWidth: '150px'},
        {name: 'To', selector: row => row.args?.to},
        {name: 'Value in Wei', selector: row => row.args?.value.toString()}
    ];

    const columnsTransferTo: TableColumn<Event>[] = [
        {name: '#', selector: row => row.transactionHash},
        {name: 'Block', selector: row => row.blockNumber, maxWidth: '50px'},
        {name: 'Transaction index', selector: row => row.transactionIndex, maxWidth: '150px'},
        {name: 'From', selector: row => row.args?.from},
        {name: 'Value in Wei', selector: row => row.args?.value.toString()}
    ];

    useEffect(() => {
        getERC20Data(connectedWallet.address || '')
    }, [])

    // Name, symbol, totalSupply, balanceOf signer, tokens transfers from signer, tokens transfers to signer (https://docs.ethers.org/v5/api/contract/example/#erc20-queryfilter)
    const getERC20Data = (signerAddress: string) => {
        setLoadingErc20data(true)

        const contract = new ethers.Contract((process.env.REACT_APP_GOERLI_ERC20_TOKEN_ADDRESS || ""), ABI, rpcProvider)

        // Name
        contract.name().then((name: string) => {

            setErc20(prev => ({...prev, name}))
            // Symbol
            contract.symbol().then((symbol: string) => {
                setErc20(prev => ({...prev, symbol: symbol}))
                // Total supplu
                contract.totalSupply().then((supply: any) => {
                    setErc20(prev => ({...prev, totalSupply: supply}))

                    // Balance of signer
                    contract.balanceOf(signerAddress).then((balance: any) => {

                        setErc20(prev => ({...prev, balanceOfConnectedAccount: balance}))

                        // Transfers from signer
                        const filterTransferFrom = contract.filters.Transfer(signerAddress, null) // Tokens sent from signer
                        const filterTransferTo = contract.filters.Transfer(null, signerAddress) // Tokens sent to signer
                        contract.queryFilter(filterTransferFrom).then((r: Event[]) => {
                            setErc20(prev => ({...prev, events: {...prev?.events, transferFrom: r}}))


                            contract.queryFilter(filterTransferTo).then((r: Event[]) => {

                                setErc20(prev => ({...prev, events: {...prev?.events, transferTo: r}}))

                                // Listen to incoming events from signer:
                                contract.on(filterTransferFrom, (from, to, amount, event) => {
                                    setErc20(prev => ({
                                        ...prev,
                                        events: {...prev?.events, transferFrom: prev?.events?.transferFrom ? [...prev.events.transferFrom, event] : []},
                                        balanceOfConnectedAccount: prev?.balanceOfConnectedAccount?.sub(amount),
                                        totalSupply: prev?.totalSupply?.sub(amount)
                                    }))
                                });
                                // Listen to incoming events to signer:
                                contract.on(filterTransferTo, (from, to, amount, event) => {
                                    setErc20(prev => ({
                                        ...prev,
                                        events: {...prev?.events, transferTo: prev?.events?.transferTo ? [...prev.events.transferTo, event] : []},
                                        balanceOfConnectedAccount: prev?.balanceOfConnectedAccount?.add(amount),
                                        totalSupply: prev?.totalSupply?.add(amount)
                                    }))
                                });

                                setLoadingErc20data(false)
                            })
                        })
                    })
                })
            })
        })
    }

    const handleAddGoerliErc20 = async () => {
        await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: process.env.REACT_APP_GOERLI_ERC20_TOKEN_ADDRESS,
                    symbol: process.env.REACT_APP_GOERLI_ERC20_TOKEN_SYMBOL,
                    decimals: 18,
                    image: ''
                }
            }
        })
    }

    const formMint = useFormik<{ value: number }>({
        initialValues: {
            value: 1000,
        },
        onSubmit: (values, {setSubmitting}) => {
            setSubmitting(true)

            const contract = new ethers.Contract((process.env.REACT_APP_GOERLI_ERC20_TOKEN_ADDRESS || ""), ABI, web3Provider.getSigner())

            contract.mint(values.value).then((r: Transaction) => {
                toast.info(<span>Minting in progress ... <a href={`https://goerli.etherscan.io/tx/${r.hash}`} target={"_blank"}>See transaction</a></span>, {autoClose: false})
                refreshBalance(connectedWallet?.address || '')
            }).catch(() => {
                toast.error("Mint failed!")
            }).finally(() => {
                setSubmitting(false)
                setActiveWriteContractAction(undefined)
            })
        },
    });

    const formBurn = useFormik<{ value: number }>({
        initialValues: {
            value: 1000,
        },
        onSubmit: (values, {setSubmitting}) => {
            setSubmitting(true)

            const contract = new ethers.Contract((process.env.REACT_APP_GOERLI_ERC20_TOKEN_ADDRESS || ""), ABI, web3Provider.getSigner())

            contract.burn(values.value).then((r: Transaction) => {
                toast.info(<span>Burning in progress ... <a href={`https://goerli.etherscan.io/tx/${r.hash}`} target={"_blank"}>See transaction</a></span>, {autoClose: false})
                refreshBalance(connectedWallet?.address || '')
            }).catch(() => {
                toast.error("Burn failed!")
            }).finally(() => {
                setSubmitting(false)
                setActiveWriteContractAction(undefined)
            })
        },
    });

    const formTransfer = useFormik<{ amount: number, recipient: string }>({
        initialValues: {
            recipient: '',
            amount: 1000,
        },
        onSubmit: (values, {setSubmitting}) => {
            setSubmitting(true)

            const contract = new ethers.Contract((process.env.REACT_APP_GOERLI_ERC20_TOKEN_ADDRESS || ""), ABI, web3Provider.getSigner())

            contract.transfer(values.recipient, values.amount).then((r: Transaction) => {
                toast.info(<span>Transfer in progress ... <a href={`https://goerli.etherscan.io/tx/${r.hash}`} target={"_blank"}>See transaction</a></span>, {autoClose: false})
                refreshBalance(connectedWallet?.address || '')
            }).catch(() => {
                toast.error("Transfer failed!")
            }).finally(() => {
                setSubmitting(false)
                setActiveWriteContractAction(undefined)
            })
        },
    });


    return <>
        {loadingErc20data && <span>Loading ERC20 data & events...</span>}

        {!loadingErc20data && erc20 && <div className={"container mt-3"}>
            <div className="card">
                <div className="card-header">
                    <div className="text-center">
                        ERC20 {erc20.name}
                    </div>

                </div>
                <div className="card-body">
                    <div className="text-center mb-4">
                        <button className={"btn btn-success"}
                                onClick={() => handleAddGoerliErc20()}>
                            Add {erc20.name} to your Wallet
                        </button>
                    </div>

                    {/* Some basic data */}
                    <div className={"mb-5"}>
                        <h3>Read contract</h3>
                        <ul>
                            <li>What's the name of the token? {erc20.name}</li>
                            <li>How many {erc20.symbol} are they circulating (total supply)? {erc20.totalSupply?.toString()}</li>
                            <li>How many {erc20.symbol} tokens does the connected account have? {erc20.balanceOfConnectedAccount?.toString()}</li>
                        </ul>
                    </div>

                    <div className={"mb-5"}>
                        <h3>Write contract</h3>
                        <div className="row text-center">
                            <div className="col d-grid">
                                <button type="button" className="btn btn-primary" onClick={() => setActiveWriteContractAction("mint")}>Mint</button>
                            </div>
                            <div className="col d-grid">
                                <button type="button" className="btn btn-primary" onClick={() => setActiveWriteContractAction("transfer")}>Transfer</button>
                            </div>
                            <div className="col d-grid">
                                <button type="button" className="btn btn-primary" onClick={() => setActiveWriteContractAction("burn")}>Burn</button>
                            </div>
                        </div>
                        {activeWriteContractAction == "mint" && <>
                            <form className="row d-flex justify-content-center mt-3" onSubmit={formMint.handleSubmit}>
                                <div className="col-auto">
                                    <label className="col-form-label">Value</label>
                                </div>
                                <div className="col-auto">
                                    <input className={"form-control"} value={formMint.values.value} onChange={e => formMint.setFieldValue("value", e.target.value)}/>
                                </div>
                                <div className="col-auto">
                                    <button className={"btn btn-primary"} disabled={formMint.isSubmitting} type={"submit"}>Mint</button>
                                </div>
                            </form>
                        </>}

                        {activeWriteContractAction == "transfer" && <div>
                            <form className="row d-flex justify-content-center mt-3" onSubmit={formTransfer.handleSubmit}>
                                <div className="col-auto">
                                    <label className="col-form-label">Recipient</label>
                                </div>
                                <div className="col-auto">
                                    <input className={"form-control"} value={formTransfer.values.recipient} onChange={e => formTransfer.setFieldValue("recipient", e.target.value)}/>
                                </div>
                                <div className="col-auto">
                                    <label className="col-form-label">Amount</label>
                                </div>
                                <div className="col-auto">
                                    <input className={"form-control"} value={formTransfer.values.amount} onChange={e => formTransfer.setFieldValue("amount", e.target.value)}/>
                                </div>
                                <div className="col-auto">
                                    <button className={"btn btn-primary"} disabled={formTransfer.isSubmitting} type={"submit"}>Transfer</button>
                                </div>
                            </form>
                        </div>}

                        {activeWriteContractAction == "burn" && <div>
                            <form className="row d-flex justify-content-center mt-3" onSubmit={formBurn.handleSubmit}>
                                <div className="col-auto">
                                    <label className="col-form-label">Value</label>
                                </div>
                                <div className="col-auto">
                                    <input className={"form-control"} value={formBurn.values.value} onChange={e => formBurn.setFieldValue("value", e.target.value)}/>
                                </div>
                                <div className="col-auto">
                                    <button className={"btn btn-primary"} disabled={formBurn.isSubmitting} type={"submit"}>Burn</button>
                                </div>
                            </form>
                        </div>}
                    </div>

                    {/* Events */}
                    <>
                        <h3>Events</h3>
                        <hr/>
                        <ul className="nav nav-pills nav-fill">
                            <li className="nav-item">
                                <span className={`nav-link ${activeTabEvent == 'transferFrom' && 'active'}`} style={{cursor: "pointer"}} onClick={() => setActiveTabEvent('transferFrom')}>
                                    Transfers From signer
                                </span>
                            </li>
                            <li className="nav-item">
                                <span className={`nav-link ${activeTabEvent == 'transferTo' && 'active'}`} style={{cursor: "pointer"}} onClick={() => setActiveTabEvent('transferTo')}>
                                    Transfers To signer
                                </span>
                            </li>
                        </ul>


                        {/*Transfer from events*/}
                        {activeTabEvent == 'transferFrom' &&
                            <div className={"pt-2"}>
                                {erc20.events!.transferFrom!.length > 0 ?
                                    <DataTable columns={columnsTransferFrom} data={erc20.events!.transferFrom || []} pagination/> :
                                    <div className={"text-info"}>No Transfers from {connectedWallet.address}</div>
                                }
                            </div>
                        }


                        {/*Transfer to events*/}
                        {activeTabEvent == 'transferTo' &&
                            <div className={"pt-3"}>
                                {erc20.events!.transferTo!.length > 0 ?
                                    <DataTable columns={columnsTransferTo} data={erc20.events!.transferTo || []} pagination/> :
                                    <div className={"text-info"}>No Transfers from {connectedWallet.address}</div>
                                }
                            </div>
                        }
                    </>
                </div>
            </div>
        </div>}
    </>
}


export default App;
