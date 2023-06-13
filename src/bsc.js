import { Link } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react'
import { Parallax } from "react-parallax";
import './App.css';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import moment from 'moment';
import { useContract } from 'wagmi'
import wealthMountainABI from './contracts/WealthMountainBSC.json';
import erc20ABI from './contracts/erc20ABI.json';
import styled from "styled-components";
import { Tabs, Tab, TabPanel } from "./components/tabs/tabs";
// import SelectObject from "./components/SelectCoin";
import { FaCopy, FaWallet, FaUserShield, FaSearchDollar } from 'react-icons/fa';
import { GiHamburgerMenu } from "react-icons/gi"
import axios from "axios";
import RealTimeChart from "./chart";
import Web3 from "web3";
import Web3Modal from 'web3modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import WalletConnectProvider from "@walletconnect/web3-provider";
import CoinbaseWalletSDK from "@coinbase/wallet-sdk";
import logoImg from "./assets/logo.png";
import bscImg from "./assets/bsc.png";
import twitterImg from "./assets/twitter.png";
import telegramImg from "./assets/telegram.png";

import {config} from "./config.js";

import abiDecoder from "abi-decoder";
// window.Buffer = window.Buffer || require("buffer").Buffer;
import {
    Button,
    Card,
    ButtonDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    CardDeck,
    Container,
    Col,
    FormGroup,
    Form,
    Input,
    InputGroup,
    Label,
    Table,
    Row
} from "reactstrap";
import { ethers, Contract, providers } from 'ethers';

const TabsContainer = styled.div`
  display: flex;
  padding: 2px;
`;

const Item = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    padding: '5px 5px',
    margin: '0px',
    textAlign: 'center',
    fontSize: "16px",
    color: 'white',
    borderRadius: "1.25rem",
    background: "transparent",
    minWidth: '150px',
    alignSelf: 'center',
    fontFamily: 'Roboto',
}));

// const web3 = new Web3(
//     new Web3.providers.HttpProvider("https://bsc-dataseed1.binance.org/")
// );

let web3Modal;
if (typeof window !== "undefined") {
    web3Modal = new Web3Modal({
        network: "mainnet", // optional
        cacheProvider: true,
        providerOptions: {
            binancechainwallet: {
                package: true,
            },
            walletconnect: {
                package: WalletConnectProvider,
                options: {
                    infuraId: 'e6943dcb5b0f495eb96a1c34e0d1493e',
                    rpc: {
                        97: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
                    },
                },
            },
            coinbasewallet: {
                package: CoinbaseWalletSDK,
                options: {
                    appName: "Coinbase",
                    infuraId: 'e6943dcb5b0f495eb96a1c34e0d1493e',
                    chainId: 97
                },
            },
        }, // required
        theme: "dark",
    });
}

function WealthMountain() {
    const [sliderValue, setSliderValue] = useState('50');
    const [dropdownOpen, setOpen] = React.useState(false);
    const [userInfo, setUserInfo] = useState([]);
    const [investInfo, setInvestInfo] = useState([5]);
    const [activeTab, setActiveTab] = useState(1);
    const [calcTotalDividends, setCalcTotalDividends] = useState(0)
    const [initalStakeAfterFees, setInitalStakeAfterFees] = useState(0)
    const [dailyPercent, setDailyPercent] = useState(1);
    const [dailyValue, setDailyValue] = useState(0);
    const [stakingAmount, setStakingAmount] = useState("");
    const [calculatedDividends, setCalculatedDividends] = useState(0);
    const [contractBalance, setContractBalance] = useState("");
    const [referralAccrued, setReferralAccrued] = useState(0);
    const [referralCount, setReferralCount] = useState("");
    const [totalUsers, setTotalUsers] = useState("");
    const [totalDeposit, setTotalDeposit] = useState("");
    const [totalWithdrawn, setTotalWithdrawn] = useState("");
    // const [totalCompounds, setTotalCompounds] = useState("")
    // const [totalCollections, setTotalCollections] = useState("")
    const [dayValue10, setDayValue10] = useState("864000");
    const [dayValue20, setDayValue20] = useState("1728000");
    const [dayValue30, setDayValue30] = useState("2592000");
    const [dayValue40, setDayValue40] = useState("3456000");
    const [dayValue50, setDayValue50] = useState("4320000");
    const [contract, setContract] = useState(undefined)
    const [signer, setSigner] = useState(undefined)
    const [userWalletAddress, setUserWalletAddress] = useState('');
    const [userStablecoinBalance, setUserStablecoinBalance] = useState(0);
    const [stablecoinAllowanceAmount, setStablecoinAllowanceAmount] = useState(0);
    // const stableCoin = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';
    const stableCoin = '0xe98e93Fde3A05Bc703f307Ee63be9507d1f48554';
    const wealthContract = '0x62130076a24fa502D0029F29167341E5e7908e2d'
    const [refBonusLoading, setRefBonusLoading] = useState(false);
    const [connectButtonText, setConnectButtonText] = useState('Connect Wallet')
    // const videoRef = useRef();

    let contractInfo = [
        { label: 'TVL', value: `$ ${Number(contractBalance).toFixed(0)}` },
        { label: 'Users', value: Number(totalUsers) },
        { label: 'Total Deposit', value: `$ ${Number(totalDeposit).toFixed(0)}` },
        { label: 'Total Withdrawn', value: `$ ${Number(totalWithdrawn).toFixed(0)}` },
    ]

    // const [countdown, setCountdown] = useState({
    //     alive: true,
    //     days: 0,
    //     hours: 0,
    //     minutes: 0,
    //     seconds: 0
    // })

    // const getCountdown = (deadline) => {
    //     const now = Date.now() / 1000;
    //     const total = deadline - now;
    //     const seconds = Math.floor((total) % 60);
    //     const minutes = Math.floor((total / 60) % 60);
    //     const hours = Math.floor((total / (60 * 60)) % 24);
    //     const days = Math.floor(total / (60 * 60 * 24));

    //     return {
    //         total,
    //         days,
    //         hours,
    //         minutes,
    //         seconds
    //     };
    // }

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         try {
    //             const data = getCountdown(1662138120)
    //             setCountdown({
    //                 alive: data.total > 0,
    //                 days: data.days,
    //                 hours: data.hours,
    //                 minutes: data.minutes,
    //                 seconds: data.seconds
    //             })
    //         } catch (err) {
    //             console.log(err);
    //         }
    //     }, 1000);

    //     return () => clearInterval(interval);
    // }, [])

    //**********************web3 modal***************************//

    const [web3, setWeb3] = useState(null);
    const [chainID, setChainID] = useState(0);

    // const loadWeb3 = async () => {
    //     try {
    //       const client = new Web3(config.RPC_URL);
    //       setWeb3(client);
    //       // await getSiteInfo();
    //     } catch (error) {
    //       console.log('[loadWeb3 Error] => ', error);
    //     }
    // }

    const checkNetwork = async (web3Provider) => {
        if (!web3 || !web3Provider) return false;
        const network = await web3Provider.getNetwork();
        setChainID(network.chainId);
        console.log("checkNetwork: ", network, network.chainId);
        if (web3.utils.toHex(network.chainId) !== web3.utils.toHex(97)) {
          await changeNetwork();
          return false;
        } else {
          return true;
        }
    }

    const changeNetwork = async () => {
        if (!web3) return;
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: web3.utils.toHex(config.CHAIN_ID) }],
          });
        }
        catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: web3.utils.toHex(97),
                    chainName: 'BSC Mainnet',
                    rpcUrls: [config.RPC_URL],
                    nativeCurrency: {
                      name: 'BNB',
                      symbol: 'BNB',
                      decimals: 18,
                    },
                    blockExplorerUrls: [config.SCAN_LINK]
                  },
                ],
              });
              return {
                success: true,
                message: "switching succeed"
              }
            } catch (addError) {
              return {
                success: false,
                message: "Switching failed." + addError.message
              }
            }
          }
        }
    }
      
    const connectWallet = async () => {
        try {
            const provider = await web3Modal.connect();
            const client = new Web3(provider);
            setWeb3(client);
            const newProvider = new providers.Web3Provider(provider);
              const res = await checkNetwork(newProvider);
              console.log("checkNetwork result: ", res);
              if (res === false) return;

            const accounts = await client.eth.getAccounts();
            localStorage.setItem('address', accounts[0]);
            setUserWalletAddress(accounts[0]);
            console.log("connectWallet address: ", accounts[0]);
            if (accounts[0] !== 'none') {
                console.log("xxxxxxxxxxx: ", userWalletAddress);
                setConnectButtonText(accounts[0].slice(0, 6) + "..." + accounts[0].slice(38))
                recalculateInfo();
            }

            provider.on("accountsChanged", async function (accounts) {
                if (accounts[0] !== undefined) {
                    setUserWalletAddress(accounts[0]);
                    setConnectButtonText(accounts[0].slice(0, 6) + "..." + accounts[0].slice(38))
                    recalculateInfo();
                } else {
                    setUserWalletAddress('');
                }
            });

              provider.on('chainChanged', async function (chainId) {
                setChainID(chainId);
              });

              provider.on('disconnect', function (error) {
                setUserWalletAddress('');
                // initializeBalance();
              });
        } catch (error) {
            console.log('[connectWallet Error] => ', error);
        }
    }

    const disconnect = async () => {
        await web3Modal.clearCachedProvider();
        const client = new Web3(config.mainNetUrl);
        setWeb3(client);
        localStorage.removeItem("address");
        setChainID('');
        setUserWalletAddress('');
        // initializeBalance();
    }

    async function requestAccount() {
        console.log('Requesting account...');

        // ❌ Check if Meta Mask Extension exists 
        if (window.ethereum) {
            // if (window.ethereum.chainId !== "0x38") {
            //     window.ethereum.request({
            //         method: "wallet_addEthereumChain",
            //         params: [{
            //             chainId: "0x38",
            //             rpcUrls: ["https://bsc-dataseed1.binance.org"],
            //             chainName: "BSC Mainnet",
            //             nativeCurrency: {
            //                 name: "BNB",
            //                 symbol: "BNB",
            //                 decimals: 18
            //             },
            //             blockExplorerUrls: ["https://bscscan.com"]
            //         }]
            //     }).then(() => {
            //         window.location.reload()
            //     });
            // };
            // console.log('detected');

            if (window.ethereum.chainId != "0x61") {
                window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: "0x61",
                        rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
                        chainName: "BSC Mainnet",
                        nativeCurrency: {
                            name: "BNB",
                            symbol: "BNB",
                            decimals: 18
                        },
                        blockExplorerUrls: ["https://testnet.bscscan.com"]
                    }]
                }).then(() => {
                    window.location.reload()
                });
            };
            console.log('detected');

            try {

                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
                });

                setUserWalletAddress(accounts[0]);
                console.log("xxxxxxxxxxx: ", accounts[0]);
                if (accounts[0] !== 'none') {
                    console.log("xxxxxxxxxxx: ", userWalletAddress);
                    setConnectButtonText(accounts[0].slice(0, 6) + "..." + accounts[0].slice(38))
                    recalculateInfo();
                    // getAllBuyAndSellReceipts(wealthContract, userWalletAddress);
                }
            } catch (error) {
                console.log('Error connecting...: ', error);
            }

        } else {
            alert('Meta Mask not detected');
        }
    }

    useEffect(() => {
        const init = async () => {
            var provider = new ethers.providers.Web3Provider(window.ethereum)
            var signer = provider.getSigner()
            setSigner(signer)
            var contract = new Contract(
                wealthContract,
                wealthMountainABI,
                signer
            )
            setContract(contract)
            setUserWalletAddress(provider.provider.selectedAddress);
            getAllBuyAndSellReceipts(wealthContract, userWalletAddress);
            // videoRef.current.play().catch(error => {
            //     console.log("Play error = ", error);
            // });

        };
        init();
    }, []);

    const handleChange = (e, value) => {
        setActiveTab(value);
        recalculateInfo()
    }
    window.addEventListener("focus", function () {
        recalculateInfo();
    })

    const getAllBuyAndSellReceipts = async (address, userAddress) => {
        const totalBuyAndSell = { totalBuy: 0.0, totalSell: 0.0 };
        const returnedData = await fetch(
            `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=21869046&endblock=99999999&apikey=YGKJFMK5FW1H9T9GR9VTGIT2UC5PXUTDTB`
        );
        const parsedData = await returnedData.json();
        // console.log("Transaction history: ", parsedData);
        if (parsedData.status === "1") {
            const transactions = parsedData.result;
            let count = 0;
            let accounts = [];
            let investInfo = [
                {
                    from: '',
                    amountBought: 0,
                    investTime: 0,
                    hash: 0,
                    award: '$1500',
                },
                {
                    from: '',
                    amountBought: 0,
                    investTime: 0,
                    hash: 0,
                    award: '$1000',
                },
                {
                    from: '',
                    amountBought: 0,
                    investTime: 0,
                    hash: 0,
                    award: '$500',
                },
                {
                    from: '',
                    amountBought: 0,
                    investTime: 0,
                    hash: 0,
                    award: '',
                },
                {
                    from: '',
                    amountBought: 0,
                    investTime: 0,
                    hash: 0,
                    award: '',
                }
            ];
            console.log("Contract: ", contract);
            // console.log('all transactions => ', transactions);
            let cc = 0;
            let investors = [];
            let totalInvestAmounts = 0;
            let totalRewardsAmounts = 0;
            for (const tx of transactions) {
                if (accounts.indexOf(tx.from) == -1) {
                    accounts.push(tx.from);
                    count++
                }

                // const busdBalance = await stablecoinBalance.balanceOf(tx.from);
                // if (Number(ethers.utils.formatEther(busdBalance)) > 1000){
                //     console.log(tx.from, " : ", ethers.utils.formatEther(busdBalance));
                // }

                // if (tx.to === wealthContract && tx.isError === "0") { // 14:00, 25th Oct UTC
                //     if (investFunc.test(tx.input)) {
                //         const decodedData = abiDecoder.decodeMethod(tx.input);
                //         // const amountBought = decodedData.params[0].value / 10 ** 18;
                //         const amountBought = decodeFunction(tx.input);
                //         if (amountBought >= 500) {
                //             const investTime = moment(tx.timeStamp * 1000).format("YYYY-MM-DD");
                //             if (investors.indexOf(tx.from) == -1){
                //                 investors.push(tx.from);
                //                 let totalInits = 0;
                //                 await contract.UsersKey(tx.from).then(value => {
                //                     totalInits = Number(ethers.utils.formatEther(value.totalInits.toString())).toFixed(0);
                //                     totalInvestAmounts =  Number(totalInvestAmounts) + totalInits;
                //                 })
                //                 let calcDiv = 0;
                //                 await contract.calcdiv(tx.from).then(value => {
                //                     calcDiv = Number(ethers.utils.formatEther(value)).toFixed(0);
                //                     totalRewardsAmounts = Number(totalRewardsAmounts) + calcDiv;
                //                 })
                //                 console.log(tx.from, " : ", investTime, " invest amount: ", totalInits, " claimable: ", calcDiv);
                //                 cc++;
                //             }

                //             // for (let i = 0; i < investInfo.length; i++) {
                //             //     if (investInfo[i].amountBought < amountBought) {
                //             //         for (let j = investInfo.length-1; j > i; j--) {
                //             //             investInfo[j] = investInfo[j-1]
                //             //         }
                //             //         investInfo[i] = {from: tx.from, amountBought, investTime, hash: tx.hash};
                //             //         break;
                //             //     }
                //             // }

                //         }
                //         // totalBuyAndSell.totalBuy += amountBought;
                //     }

                //     // if (claimFunc.test(tx.input)) {
                //     //     const sellReceipt = await web3.eth.getTransactionReceipt(tx.hash);

                //     //     totalBuyAndSell.totalSell += parseInt(sellReceipt.logs[2].data, 16) / 10 ** 18;
                //     // }
                // }
            }

            console.log("Accounts: ", accounts.length);
            // accounts.map(async (item, index) => {
            //     let calcDiv, totalInits;
            //     await contract.UsersKey(item).then(value => {
            //         totalInits = Number(ethers.utils.formatEther(value.totalInits.toString())).toFixed(0);
            //         totalInvestAmounts =  Number(totalInvestAmounts) + totalInits;
            //     })
            //     await contract.calcdiv(item).then(value => {
            //         calcDiv = Number(ethers.utils.formatEther(value)).toFixed(0);
            //         totalRewardsAmounts = Number(totalRewardsAmounts) + calcDiv;
            //     })
            //     console.log(index, ": ", item, ": ", totalInits, ", ", calcDiv);

            // })

            // console.log("TotalInvestAmounts = ", totalInvestAmounts);
            // console.log("TotalReardsAmounts = ", totalRewardsAmounts);
            // console.log("Invest Counts = ", cc);

            // for (let i = 0; i < investInfo.length; i++) {
            //     if (i == 0) {
            //         investInfo[i].award = '500'
            //     } else if (i == 1) {
            //         investInfo[i].award = '150'
            //     } else if (i == 2) {
            //         investInfo[i].award = '100'
            //     } else {
            //         investInfo[i].award = '0'
            //     }
            // }
            // console.log('investInfo = ', investInfo);
            // setInvestInfo(investInfo);
            // setTotalUsers(count);
            console.log("count = ", count);
        }

        // console.log("investInfo: ", investInfo);
        // const len = investInfo.length;
        // const minLength = 8;
        // if (len < minLength) {
        //     for (let i = 0; i < minLength - len; i++) {
        //         investInfo.push([0, Date.now()/1000 + i * 86400]);
        //     }
        // }
        // setInvestInfo(investInfo);

        return totalBuyAndSell;
    };

    async function recalcAllowance() {
        if (contract === undefined || contract === null) {
            return;
        }
        const userAllowance = await stablecoinAllowance.allowance(userWalletAddress, contract.address);
        setStablecoinAllowanceAmount(Number(ethers.utils.formatEther(userAllowance)));
    }

    async function recalculateInfo() {
        if (contract === undefined || contract === null) {
            return;
        }

        const [balance, userBalance, userAllowance, userInfo, dividends, userKey, mainKey] = await Promise.all([
            stablecoinBalance.balanceOf(contract.address),
            stablecoinBalance.balanceOf(userWalletAddress),
            stablecoinAllowance.allowance(userWalletAddress, contract.address),
            contract.userInfo(),
            contract.calcdiv(userWalletAddress),
            contract.UsersKey(String(userWalletAddress)),
            contract.MainKey(1)
        ]);

        setContractBalance(Number(ethers.utils.formatEther(balance)));
        setUserStablecoinBalance(Number(ethers.utils.formatEther(userBalance)))
        setStablecoinAllowanceAmount(Number(ethers.utils.formatEther(userAllowance)))
        
        setUserInfo(userInfo);
        setCalculatedDividends(Number(ethers.utils.formatEther(dividends)));
        setReferralAccrued(Number(ethers.utils.formatEther(userKey.refBonus)).toFixed(2));
        setReferralCount(Number(userKey.refCount));

        setTotalUsers(Number(mainKey.users));
        setTotalDeposit(Number(ethers.utils.formatEther(mainKey.ovrTotalDeps)));
        setTotalWithdrawn(Number(ethers.utils.formatEther(mainKey.ovrTotalWiths)));

        // const balance = await stablecoinBalance.balanceOf(contract.address);
        // setContractBalance(Number(ethers.utils.formatEther(balance)));

        // const userBalance = await stablecoinBalance.balanceOf(userWalletAddress);
        // setUserStablecoinBalance(Number(ethers.utils.formatEther(userBalance)))

        // const userAllowance = await stablecoinAllowance.allowance(userWalletAddress, contract.address);
        // setStablecoinAllowanceAmount(Number(ethers.utils.formatEther(userAllowance)))

        // const [userInfo, dividends, userKey, mainKey] = await Promise.all([
        //     contract.userInfo(),
        //     contract.calcdiv(userWalletAddress),
        //     contract.UsersKey(String(userWalletAddress)),
        //     contract.MainKey(1)
        // ]);

        

        // contract.userInfo().then(value => {
        //     setUserInfo(value)
        // })
        // contract.calcdiv(userWalletAddress).then(value => {
        //     setCalculatedDividends(Number(ethers.utils.formatEther(value)));
        // })

        // contract.UsersKey(String(userWalletAddress)).then(value => {
        //     setReferralAccrued(Number(ethers.utils.formatEther(value.refBonus)).toFixed(2));
        //     setReferralCount(Number(value.refCount));
        // })
        // contract.MainKey(1).then(value => {
        //     setTotalUsers(Number(value.users));
        //     setTotalDeposit(Number(ethers.utils.formatEther(value.ovrTotalDeps)));
        //     setTotalWithdrawn(Number(ethers.utils.formatEther(value.ovrTotalWiths)));
        // })
    }

    const updateCalc = event => {
        setInitalStakeAfterFees(Number(event.target.value).toFixed(2));
    }

    const [inputAmount, setInputAmount] = useState('');
    const updateStakingAmount = event => {
        console.log(event.target.value);
        setStakingAmount(event.target.value);
        setInputAmount(event.target.value);
    }

    const handleClickMax = () => {
        setStakingAmount(userStablecoinBalance.toFixed(1));
        setInputAmount(userStablecoinBalance.toFixed(1));
    }

    const handleClickCopy = () => {
        navigator.clipboard.writeText("https://fundora.netlify.app/?ref=" + userWalletAddress);
        toast.success('Referral link has been copied!');
        console.log("handleClickCopy>>>>>>>>>>>");
    }

    function calculate(v) {
        setSliderValue(v)
        if (Number(sliderValue) <= "20") {
            const totalReturn = (initalStakeAfterFees * 0.01) * sliderValue
            setCalcTotalDividends(totalReturn.toFixed(2));
            setDailyPercent(1);
            setDailyValue(Number(initalStakeAfterFees * .01).toFixed(2))
        }
        else if ("20" < Number(sliderValue) && Number(sliderValue) <= "30") {
            const totalReturn = (initalStakeAfterFees * 0.02) * sliderValue
            setCalcTotalDividends(totalReturn.toFixed(2));
            setDailyPercent(2);
            setDailyValue(Number(initalStakeAfterFees * .02).toFixed(2))
        }
        else if ("30" < Number(sliderValue) && Number(sliderValue) <= "40") {
            const totalReturn = (initalStakeAfterFees * 0.03) * sliderValue
            setCalcTotalDividends(totalReturn.toFixed(2));
            setDailyPercent(3);
            setDailyValue(Number(initalStakeAfterFees * .03).toFixed(2))
        }
        else if ("40" < Number(sliderValue) && Number(sliderValue) <= "50") {
            const totalReturn = (initalStakeAfterFees * 0.04) * sliderValue
            setCalcTotalDividends(totalReturn.toFixed(2));
            setDailyPercent(4);
            setDailyValue(Number(initalStakeAfterFees * .04).toFixed(2))
        }
        else if ("50" <= Number(sliderValue)) {
            const totalReturn = (initalStakeAfterFees * 0.05) * sliderValue
            setCalcTotalDividends(totalReturn.toFixed(2));
            setDailyPercent(5);
            setDailyValue(Number(initalStakeAfterFees * .05).toFixed(2))
        }
    }

    async function approveButton() {
        const tx = stablecoinContract.approve(contract.address, String(ethers.utils.parseEther(stakingAmount)));
        tx.wait().then(() => {
            recalcAllowance();
            toast.success('Successfully approved!')
        })
    }
    async function stakeAmount() {
        if (Number(stakingAmount) < Number(10)) {
            alert('Minimum stake amount not met.')
        }

        const ref = window.location.search;
        const referralAddress = String(ref.replace('?ref=', ''))
        console.log("referralAddress: ", referralAddress);
        // if (referralAddress === 'null' || referralAddress.includes("0x") === false) {
        //     const tx = await contract.Deposit(
        //         String(ethers.utils.parseEther(stakingAmount)), String("0x7419189d0f5B11A1303978077Ce6C8096d899dAd"));
        // } else {
            const tx = await contract.Deposit(
                String(ethers.utils.parseEther(stakingAmount)), String(referralAddress));
            tx.wait().then(() => { });
        // }

        toast.success('Successfully Deposited!')
    }
    async function stakeRefBonus() {
        const tx = await contract.stakeRefBonus();
        tx.wait().then(() => {
            toast.success('Successfully Staked RefBonus!')
            recalculateInfo();
        })
    }
    async function withdrawRefBonus() {
        const tx = await contract.withdrawRefBonus();
        tx.wait().then(() => {
            toast.success('Successfully Withdrawn RefBonus!')
            recalculateInfo();
        })
    }
    async function Reinvest() {
        const tx = await contract.Reinvest()
        tx.wait().then(() => {
            toast.success('Successfully Compounded!')
            recalculateInfo();
        })
    }
    async function withdrawDivs() {
        const tx = await contract.withdrawDivs()
        tx.wait().then(() => {
            toast.success('Successfully withdraw your rewards!')
            recalculateInfo();
        })
    }
    const stablecoinContract = useContract({
        addressOrName: stableCoin,
        contractInterface: ['function approve(address spender, uint amount) public returns(bool)'],
        signerOrProvider: signer,
    })
    const stablecoinBalance = useContract({
        addressOrName: stableCoin,
        contractInterface: ['function balanceOf(address account) external view returns (uint256)'],
        signerOrProvider: signer,
    })
    const stablecoinAllowance = useContract({
        addressOrName: stableCoin,
        contractInterface: ['function allowance(address _owner, address spender) external view returns (uint256)'],
        signerOrProvider: signer,
    })

    async function withdrawInitial(value) {
        const tx = await contract.withdrawInitial(value);
        tx.wait().then(() => {
            toast.success('Successfully withdrawn your initial deposit!')
            recalculateInfo();
        })
    }
    function TotalStakedValue() {
        var total = 0;
        for (var i = 0; i < userInfo.length; i++) {
            total += Number(ethers.utils.formatEther(userInfo[i].amt))
        }
        return (<>{total.toFixed(2)}</>)
    }
    function TotalEarnedValue() {
        var value = calculatedDividends;

        return (<>{value.toFixed(3)}</>)
    }

    function TotalEarnedPercent() {
        var total = 0;
        for (var i = 0; i < userInfo.length; i++) {
            total += Number(ethers.utils.formatEther(userInfo[i].amt))
        }
        const value = calculatedDividends
        var totalEarnedPercent;
        if (total === 0) {
            totalEarnedPercent = "0%"
        } else {
            totalEarnedPercent = Number((value / total) * 100).toFixed(3) + "%";
        }
        return (<>{totalEarnedPercent}</>)
    }

    function ListOfUserStakes() {
        if (userInfo.length === 0) {
            return (
                <>
                    <small className="font-weight-bold source text-lightblue">Nothing to show here.</small>
                </>
            )
        }
        const listElements = userInfo.map(
            (element) => {
                const depoStart = Number(element.depoTime)
                const depoAmount = Number(ethers.utils.formatEther(element.amt))
                const initialWithdrawn = element.initialWithdrawn;
                var dailyPercent = '';
                var unstakeFee = '';
                const elapsedTime = (Date.now() / 1000 - (depoStart));
                var totalEarned = '0';
                // var daysToMax = Number((dayValue50 - elapsedTime) / 86400).toFixed(1);
                var daysToMax = Number((dayValue50 - elapsedTime) / 86400).toFixed(1)
                if (elapsedTime <= 86400) {
                    dailyPercent = '1'
                    unstakeFee = '1%'
                    totalEarned = (depoAmount * (dailyPercent / 100)) * (elapsedTime / dayValue10 / 10)

                } else if (elapsedTime <= dayValue20) {
                    dailyPercent = '1'
                    unstakeFee = '50%'
                    totalEarned = (depoAmount * (dailyPercent / 100)) * (elapsedTime / dayValue10 / 10)

                } else if (elapsedTime > dayValue20 && elapsedTime <= dayValue30) {
                    dailyPercent = '2'
                    unstakeFee = '50%'
                    totalEarned = (depoAmount * (dailyPercent / 100)) * (elapsedTime / dayValue10 / 10)

                } else if (elapsedTime > dayValue30 && elapsedTime <= dayValue40) {
                    dailyPercent = '3'
                    unstakeFee = '50%'
                    totalEarned = (depoAmount * (dailyPercent / 100)) * (elapsedTime / dayValue10 / 10)

                } else if (elapsedTime > dayValue40 && elapsedTime <= dayValue50) {
                    dailyPercent = '4'
                    unstakeFee = '50%'
                    totalEarned = (depoAmount * (dailyPercent / 100)) * (elapsedTime / dayValue10 / 10)

                } else if (elapsedTime > dayValue50) {
                    dailyPercent = '5'
                    unstakeFee = '0%'
                    totalEarned = depoAmount * (dailyPercent / 100) * (elapsedTime / dayValue10 / 10)
                    daysToMax = 'Max'
                }
                var daysStaked = Number(elapsedTime / 86400).toFixed(2);
                if (daysStaked < 1) {
                    daysStaked = "<1"
                }

                if (initialWithdrawn == false) {
                    return (
                        <>
                            <tr>
                                <td>${depoAmount.toFixed(2)}</td>
                                <td>{daysStaked}</td>
                                <td>{dailyPercent}%</td>
                                <td>{daysToMax}</td>
                                <td style={{ fontStyle: 'italic' }}>{unstakeFee}</td>
                            </tr>
                        </>
                    )
                }
            }
        )
        return (
            <>
                <Table striped>
                    <thead>
                        <tr className="text-lightblue calvino">
                            <th>Amount</th>
                            <th>Days staked</th>
                            <th>Daily (%)</th>
                            <th>Days to Max</th>
                            <th>Unstake fee</th>
                        </tr>
                    </thead>
                    <tbody className="source text-white">
                        {listElements}
                    </tbody>
                </Table>
            </>
        )
    }

    function UnstakeOptions() {
        if (userInfo.length == 0) {
            return (
                <>
                    <Button outline className="custom-button mt-3 source">Start a stake</Button>
                </>
            )
        }
        const listElements = userInfo.map(
            (element) => {
                // const depoStart = new Date(element.depoTime / 1000).toDateString();
                const depoStart = new Date(Number(element.depoTime) * 1000).toDateString()
                const depoAmount = Number(ethers.utils.formatEther(element.amt)).toFixed(2)
                const initialWithdrawn = element.initialWithdrawn;
                const key = Number(element.key);
                if (initialWithdrawn == false) {
                    return (
                        <>
                            <DropdownItem onClick={() => {
                                withdrawInitial(key)
                            }}>
                                <Col className="text-center">
                                    <Row>${depoAmount}</Row>
                                    <Row><small className="text-muted">{depoStart}</small></Row>
                                </Col>
                            </DropdownItem>
                            <div></div>
                        </>
                    )
                }
            }
        )
        return (
            <>
                <ButtonDropdown className="custom-button source" toggle={() => { setOpen(!dropdownOpen) }}
                    isOpen={dropdownOpen}>
                    <DropdownToggle outline caret className="font-weight-bold source">
                        Unstake
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem header style={{ color: 'black' }}>Your current stakes
                        </DropdownItem>
                        {listElements}
                    </DropdownMenu>
                </ButtonDropdown>
            </>
        )
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //    RENDER
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    return (
        <>
            {/* {mobile === true ? (
                <div className="mobile_head">
                    <div className="mobile_herader_content">
                        <div style={{ alignSelf: "center", marginBottom: "30px" }}>
                            <img src="./favicon.png" className='w-[70px]' alt="logoIcon"/>
                        </div>
                        <div className="mobile_four_btn">
                            <div onClick={() => {
                                setMobile(true)
                            }}>
                            </div>
                            <div onClick={() => {
                                setMobile(true)
                            }}>
                                <a href="/whitepaper.pdf" target="_blank" rel="noreferrer"
                                    className="stable_btn"
                                    style={{
                                        color: 'white',
                                        textDecoration: 'none',
                                        fontWeight: "bolder",
                                        fontFamily: 'Roboto'
                                    }}
                                >
                                    <span> Whitepaper </span>
                                </a>
                            </div>
                            <div onClick={() => {
                                setMobile(true)
                            }}>
                                <a href="/" target="__blank"
                                    className="bridge_btn"
                                    style={{
                                        color: 'white',
                                        textDecoration: 'none',
                                        fontWeight: "bolder",
                                        fontFamily: 'Roboto'
                                    }}
                                >
                                    Audit Report
                                </a>
                            </div>
                        </div>
                        <div style={{ flex: 1 }}></div>
                        <div
                            className="mobile_connect w-max self-center"
                        >
                            <Button
                                className='connect-button !text-sm'
                                onClick={requestAccount}>
                                {connectButtonText}
                            </Button>
                        </div>
                    </div>
                    <div
                        className="empty_mobile"
                        onClick={() => {
                            setMobile(false)
                        }}
                    ></div>
                </div>
            )
            : null} */}
            <div className="relative md:fixed w-full md:!bg-[#0E1716] bg-transparent" style={{ zIndex: '2' }}>
                <div className="custom-header">
                    <img alt="..." src={logoImg} className="w-[150px] md:w-[168px] hidden md:block" />
                    <div className="header_menu lg:!flex">
                        <Item>
                            <a href="/whitepaper.pdf" target="_blank"
                                style={{
                                    textDecoration: 'none',
                                    fontWeight: "bolder",
                                    textTransform: 'uppercase'
                                }}
                            >
                                <span>Whitepaper</span>
                            </a>
                        </Item>
                        <Item>
                            <a href="https://bscscan.com/" target="_blank" rel="noreferrer"
                                style={{
                                    textDecoration: 'none',
                                    fontWeight: "bolder",
                                    textTransform: 'uppercase'
                                }}
                            >
                                <span>Audit Report </span>
                                {/* <SiBinance/> */}
                            </a>
                        </Item>
                    </div>
                    <Button className='connect-button !hidden md:!block' onClick={connectWallet}>
                        {connectButtonText}
                    </Button>
                </div>
                {/* <div
                    className='mobile_btn'
                    onClick={() => {
                        setMobile(true)
                    }}
                >
                    <GiHamburgerMenu />
                </div> */}

                <div className='block md:hidden w-full flex flex-col items-center'>
                    <img alt="..." src={logoImg} className="w-[150px] md:w-[168px]" />
                    <Button className='connect-button w-1/2 my-4' onClick={connectWallet}>
                        {connectButtonText}
                    </Button>
                </div>
            </div>

            <div className='main-content' style={{ display: 'flex', flexDirection: 'column' }}>
                <Container className="pt-3">
                    <div className="text-center py-3 md:pb-4 text-[30px] lg:text-[40px] text-white font-bold">Effortless Investing, <span className='text-[#F8C34E]'>Impressive Returns:</span><br />Fundora Makes it Possible</div>
                    <div className="text-center pb-4 md:pb-8 text-lg md:!text-xl text-white leading-6">Effortless wealth growth with Fundora. Our expert traders handle the complexities of trading while you enjoy the profits.Just make a deposit and let us maximize your returns. Sit back, relax and let fundora take care of the hard works so you can effortlessly enjoy the benefits of your investments.</div>
                    <Container>
                        <CardDeck>
                            {
                                contractInfo.map((item, index) => {
                                    return (
                                        <Card body className="text-center card1">
                                            <h5 className="calvino text-white">{item.label}</h5>
                                            <h5 className="source font-weight-bold text-white">
                                                {item.value}
                                            </h5>
                                        </Card>
                                    );
                                })
                            }
                        </CardDeck>
                    </Container>
                    <div className='mt-8'>
                        <CardDeck className="p-3">
                            <Card body className="text-center text-white card1">
                                <h4 className="calvino font-bold">Enter Stake</h4>
                                <p className="source text-center">Approve and stake your BUSD here. You can view your ongoing stakes in the <span className="font-weight-bold">Current Stakes & Yield</span> tab.</p>
                                <Form>
                                    <FormGroup>
                                        <div className='flex justify-between'>
                                            <Label className="source font-weight-bold text-lightblue">Stake Amount</Label>
                                            <small className="flex source text-lightblue text-left">Balance: &nbsp;<span className="text-[#F8C34E] font-weight-bold">{userStablecoinBalance.toFixed(1)} BUSD</span></small>
                                        </div>
                                        <div className='relative !items-center w-full'>
                                            <Input
                                                className="absolute custom-input text-center source min-h-[50px]"
                                                placeholder="Minimum 10 BUSD"
                                                onChange={updateStakingAmount}
                                                value={inputAmount}
                                            >
                                            </Input>
                                            <Button className='absolute right-2 !bg-[#F8C34E] !border-none !text-sm !py-0 !px-2 h-10 float-right top-1' onClick={handleClickMax}>Max</Button>
                                        </div>
                                        <div className='my-2'>
                                            <Button onClick={approveButton} className="custom-button mt-4 font-weight-bold !mr-0 w-full">Approve</Button>
                                            <Button onClick={stakeAmount} className="custom-button mt-4 font-weight-bold !mr-0 w-full">Stake</Button>
                                        </div>
                                    </FormGroup>
                                </Form>
                                <small className="mt-4">Note: Stakes are not locked. You can unstake at any time.</small><br />
                                {/* <small className="source text-lightblue text-left"><FaUserShield size="1.7em" className="pr-2" />Approved amount: <span className="text-white font-weight-bold">{stablecoinAllowanceAmount.toFixed(2)} BUSD</span></small>
                                <a className="source text-left text-underline text-lightblue" href="https://pancakeswap.finance/swap" target="_blank" rel="noreferrer"><small className="source text-lightblue text-left"><FaSearchDollar size="1.7em" className="pr-2" />Swap your tokens for BUSD here. </small></a> */}
                            </Card>
                            <Card body className="text-center text-lightblue card1">
                                <div className='bg-black p-4 rounded-2xl'>
                                    <h4 className="calvino font-bold">Total Staked Value</h4>
                                    <div className='flex flex-row justify-between items-center mt-8'>
                                        <div className="text-white font-semibold text-3xl"><TotalStakedValue /></div>
                                        <UnstakeOptions />
                                    </div>
                                </div>
                                <h4 className="calvino font-bold mt-2">Total Earnings</h4>
                                <CardDeck className='flex !flex-row justify-between'>
                                    <Card style={{ background: "transparent" }}>
                                        <h4 className="source font-weight-bold text-white"><TotalEarnedPercent /></h4>
                                    </Card>
                                    <Card style={{ background: "transparent" }}>
                                        <h4 className="source font-weight-bold text-white">$<TotalEarnedValue /></h4>
                                    </Card>
                                </CardDeck>
                                <Row>
                                    <Col className='flex justify-between'>
                                        <Button className="custom-button source mt-3 w-1/2" outline onClick={Reinvest}>compound</Button>
                                        <Button className="custom-button source mt-3 w-1/2" outline onClick={withdrawDivs}>collect</Button>
                                    </Col>
                                </Row>
                                <small className="mt-4 pt-2 source">Note: Collecting will reset all stakes to 1% daily. Compound will add to your stakes while doing the same.</small>
                            </Card>
                        </CardDeck>
                        <Card body>
                            <dev className="calvino text-left text-white text-3xl font-semibold my-4">Earnings Calculator</dev>
                            <CardDeck>
                                <Card body className="text-center card1">
                                    <h3 className="calvino font-weight-bold text-white">Staking</h3>
                                    <Form>
                                        <FormGroup>
                                            <Label className="source font-weight-bold text-lightblue">Stake Amount</Label>
                                            <InputGroup>
                                                <Input
                                                    className="custom-input text-center source"
                                                    placeholder="Minimum 10 BUSD"
                                                    // onChange={(e) => this.setCalcAmount(`${e.target.value}`)}
                                                    onChange={updateCalc}
                                                ></Input>
                                            </InputGroup>
                                        </FormGroup>
                                    </Form>
                                    <Label className="source font-weight-bold text-white mt-4">Days Staked</Label>
                                    <Col className="text-center">
                                        <Box>
                                            <Slider
                                                defaultValue={50}
                                                aria-label="Default"
                                                valueLabelDisplay="auto"
                                                color='primary'
                                                onChange={(_, v) => calculate(v)} />
                                        </Box>
                                    </Col>
                                </Card>
                                <Card body className="text-center card1">
                                    <h3 className="calvino font-weight-bold text-white">Earnings</h3>
                                    <CardDeck className='flex-row justify-between'>
                                        <Card className='!min-w-[130px]'>
                                            <h3 className="calvino text-white">${calcTotalDividends}</h3>
                                            <small className="source text-white">total dividends earned</small>
                                        </Card>
                                        <Card className='!min-w-[130px]'>
                                            <h3 className="calvino text-white">${initalStakeAfterFees}</h3>
                                            <small className="source text-white">initial stake after fees</small>
                                        </Card>
                                    </CardDeck>
                                    <CardDeck className='flex-row justify-between'>
                                        <Card className='!min-w-[130px]'>
                                            <h3 className="calvino text-white">{dailyPercent}%</h3>
                                            <small className="source text-white">earning daily (%)</small>
                                        </Card>
                                        <Card className='!min-w-[130px]'>
                                            <h3 className="calvino text-white">${dailyValue}</h3>
                                            <small className="source text-white">earning daily ($)</small>
                                        </Card>
                                    </CardDeck>
                                </Card>
                            </CardDeck>
                        </Card>
                        <Card body>
                            <CardDeck>
                                <Card className='card1 text-center'>
                                    <h4 className="calvino font-extrabold text-3xl">Current Stakes</h4>
                                    <small className="pt-0 pb-4 source">Here's a list of all of your current stakes.</small>
                                    <ListOfUserStakes />
                                </Card>
                            </CardDeck>
                        </Card>
                        <CardDeck className="pl-3 pr-3 pb-3 mt-6">
                            <Card body className="text-center text-lightblue card1">
                                <h5 className="calvino font-bold text-2xl mt-2 mb-8">Referrals Earned</h5>
                                {refBonusLoading ? <></> :
                                    <>
                                        <div className='flex justify-between px-16'>
                                            <h4 className="source font-weight-bold text-white">$ {referralAccrued}</h4>
                                            <h4 className="source font-weight-bold text-white">{referralCount}</h4>
                                        </div>
                                        <Row>
                                            <Col className='flex justify-between'>
                                                <Button className="custom-button w-full source mt-2" outline onClick={stakeRefBonus}>STAKE</Button>
                                                <Button className="custom-button w-full source mt-2" outline onClick={withdrawRefBonus}>COLLECT</Button>
                                            </Col>
                                        </Row>
                                    </>}

                            </Card>
                            <Card body className="text-center text-lightblue card1">
                                <h5 className="calvino font-bold text-2xl mt-2 mb-6">Referral Link</h5>
                                <h3 type="button mb-4" onClick={handleClickCopy} className="referralButton source font-weight-bold flex self-center cursor-pointer"><FaCopy size="1.6em" className="pr-3" />COPY LINK</h3>
                                <small className="source text-lg">Earn 8% when someone uses your referral link.</small>
                            </Card>
                        </CardDeck>

                        <Parallax strength={500} className='mt-4 lg:mt-8'>
                            <div className='calvino text-white text-3xl font-semibold px-4 pb-2 pt-4'>
                                Understanding Fundora Investment
                            </div>
                            <div>
                                <Container className="pb-3 pt-3 calvino text-center">
                                    <CardDeck>
                                        <Card /*data-aos="fade-right" data-aos-duration="800" */ className="p-3 card1">
                                            <h3 className='text-2xl font-semibold border-solid border-b-2 border-[#f9c34e] pb-2'>Dividends</h3>
                                            <table className="source" border="2">
                                                <tbody>
                                                    <tr>
                                                        <td className="font-weight-bold">Level</td>
                                                        <td className="font-weight-bold">Stake Length</td>
                                                        <td className="font-weight-bold">Earnings</td>
                                                    </tr>
                                                    <tr>
                                                        <td>1</td>
                                                        <td>Day 1 - 20</td>
                                                        <td>1% daily</td>
                                                    </tr>
                                                    <tr>
                                                        <td>2</td>
                                                        <td>Day 21 - 30</td>
                                                        <td>2% daily</td>
                                                    </tr>
                                                    <tr>
                                                        <td>3</td>
                                                        <td>Day 31 - 40</td>
                                                        <td>3% daily</td>
                                                    </tr>
                                                    <tr>
                                                        <td>4</td>
                                                        <td>Day 41 - 50</td>
                                                        <td>4% daily</td>
                                                    </tr>
                                                    <tr>
                                                        <td>♛ 5 </td>
                                                        <td>Day 51 - ∞</td>
                                                        <td>5% daily</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <br />
                                            <small className="source">Compounding and collecting earnings from dividends reset all stakes to level 1. Creating new stakes has no effect on existing stakes.</small>
                                            <br />

                                            <small className="source">Disclaimer: Dividend payouts are fixed and the TVL fluctuations do not effect the daily yield like in traditional miners.</small>
                                        </Card>
                                        <Card /*data-aos="fade-down" data-aos-duration="800"*/ className="p-3 card1">
                                            <h3 className='text-2xl font-semibold border-solid border-b-2 border-[#f9c34e] pb-2'>Important</h3>
                                            {/* <table className="source" border="2">
                                                <tbody>
                                                    <tr>
                                                        <td className="font-weight-bold">Stake Length</td>
                                                        <td className="font-weight-bold">Unstake Fee</td>
                                                    </tr>
                                                    <tr>
                                                        <td>in Day 1</td>
                                                        <td>No Penalty</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Day 1 - 50</td>
                                                        <td>50% Penalty</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Day 20 - ∞</td>
                                                        <td>No Penalty</td>
                                                    </tr>
                                                </tbody>
                                            </table> */}
                                            <small className="text-white text-left text-sm mb-4">If withdrawal of capital before 50 days, withdrawal tax of 50% and withdrawal fees will apply.</small>
                                            <small className="text-white text-left text-sm mb-4">You can withdraw initial deposit in 24 hours without paying the withdrawal tax</small>
                                            <small className="text-white text-left text-sm mb-4">Dividends earned are also paid out when unstakes take place.</small>
                                        </Card>
                                        <Card /*data-aos="fade-left" data-aos-duration="800"*/ className="p-3 card1">
                                            <h3 className='text-2xl font-semibold border-solid border-b-2 border-[#f9c34e] pb-2'>Staking</h3>
                                            <span className="source text-left pl-2 pb-2 pr-3">
                                                5% fee on intial stakes<br /><br />
                                                Stakes immediately start earning 1% daily<br /><br />
                                                Unstake at any time (earnings included)<br /><br />
                                                1% fee on dividend collections<br /><br />
                                                No fees on compounds
                                            </span>
                                        </Card>
                                    </CardDeck>
                                </Container>
                            </div>
                        </Parallax>

                        <Parallax strength={500} className='mt-4 lg:mt-8'>
                            <div className='calvino text-white text-3xl font-semibold px-4 pb-2 pt-4'>
                                Features
                            </div>
                            <div>
                                <Container className="pb-3 pt-3 calvino text-left">
                                    <CardDeck>
                                        <Card /*data-aos="fade-right" data-aos-duration="800" */ className="p-3 card1">
                                            <h3 className='text-xl font-semibold border-solid border-b-2 border-[#f9c34e] pb-2'>Transparency</h3>
                                            <small className="text-white text-left text-sm">Transparency is at the core of our values. We believe that investors deserve clear and open communication about their investments, which is why we provide comprehensive and real-time reporting on the performance of our trading and staking activities. You can track your earnings, monitor your staked assets, and access detailed analytics on our user-friendly platform. We strive to build trust with our investors by being transparent about our strategies, risks, and results.</small>
                                            <br />
                                        </Card>
                                        <Card /*data-aos="fade-down" data-aos-duration="800"*/ className="p-3 card1">
                                            <h3 className='text-xl font-semibold border-solid border-b-2 border-[#f9c34e] pb-2'>Staking</h3>
                                            <small className="text-white text-left text-sm">Our AI trading bot, powered by advanced algorithms and machine learning, is constantly analyzing market trends, price movements, and other relevant data points to identify profitable trading opportunities. By leveraging the power of artificial intelligence, we aim to achieve consistent and sustainable returns for our investors. Our team of experienced professionals works closely with the AI bot to fine-tune strategies and optimize trading outcomes.</small>
                                        </Card>
                                        <Card /*data-aos="fade-left" data-aos-duration="800"*/ className="p-3 card1">
                                            <h3 className='text-xl font-semibold border-solid border-b-2 border-[#f9c34e] pb-2'>Automation</h3>
                                            <small className="text-white text-left text-sm">From the smart contract to the trading bots, everything is automated, resulting in zero downtime. This also helps us focus on more important things, such as customer service. Everything has been refined to its maximum efficiency, giving investors a smooth experience from deposit to withdrawal.</small>
                                        </Card>
                                    </CardDeck>
                                </Container>
                            </div>
                        </Parallax>
                    </div>
                </Container>
            </div>

            <div className="text-center calvino text-lightblue">
                <Card >
                    <p style={{ fontSize: '20px', color: 'white', paddingTop: '30px', fontWeight: 'bold' }}>© Fundora Team.  All Rights Reserved</p>
                    <CardDeck className="flex flex-row gap-16 justify-center items-end pb-8">
                        <a href="https://testnet.bscscan.com/address/0x62130076a24fa502D0029F29167341E5e7908e2d#code" target="_blank" rel="noreferrer">
                            <img src={bscImg} width='32x' height='32x' alt='bsc' />
                        </a>
                        <a href="https://twitter.com/" target="_blank" rel="noreferrer">
                            <img src={twitterImg} width='32x' height='32x' alt='twitter' />
                        </a>
                        <a href="https://t.me/" target="_blank" rel="noreferrer">
                            <img src={telegramImg} width='32x' height='32x' alt='telegram' />
                        </a>
                    </CardDeck>
                </Card>
            </div>

            <ToastContainer
                position='top-right'
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss={false}
                draggable
                pauseOnHover={false}
            />
        </>

    )
}
export default WealthMountain;