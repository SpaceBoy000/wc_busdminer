import { Link } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react'
import { Parallax } from "react-parallax";
import './App.css';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import { useContract } from 'wagmi';
import wealthMountainABI from './contracts/WealthMountainBSC.json';
import styled from "styled-components";
import { FaCopy, FaWallet, FaUserShield, FaSearchDollar } from 'react-icons/fa';
import Web3 from "web3";
import Web3Modal from 'web3modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import WalletConnectProvider from "@walletconnect/web3-provider";
import logoImg from "./assets/logo.png";
import bscImg from "./assets/bsc.png";
import twitterImg from "./assets/twitter.png";
import telegramImg from "./assets/telegram.png";
import {config} from "./config.js";

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

const providerOptions = {
    walletconnect: {
        display: {
            name: "Mobile"
        },
        package: WalletConnectProvider,
        options: {
            // infuraId: "e6943dcb5b0f495eb96a1c34e0d1493e", // required
            rpc: {
                // 56: "https://bsc-dataseed.binance.org/",
                97: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
            },
            network: 'binance'
        }
    }
}



let web3Modal;
if (typeof window !== "undefined") {
    web3Modal = new Web3Modal({
        // network: "mainnet", // optional
        cacheProvider: true,
        providerOptions: providerOptions, // required
        theme: "dark",
    });
}

function WealthMountain() {
    
    const [sliderValue, setSliderValue] = useState('50');
    const [dropdownOpen, setOpen] = React.useState(false);
    const [userInfo, setUserInfo] = useState([]);
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
    const [dayValue10, setDayValue10] = useState("864000");
    const [dayValue20, setDayValue20] = useState("1728000");
    const [dayValue30, setDayValue30] = useState("2592000");
    const [dayValue40, setDayValue40] = useState("3456000");
    const [dayValue50, setDayValue50] = useState("4320000");
    const [contract, setContract] = useState(undefined)
    const [signer, setSigner] = useState(undefined)
    const [userWalletAddress, setUserWalletAddress] = useState("");
    const [userStablecoinBalance, setUserStablecoinBalance] = useState(0);
    const [stablecoinAllowanceAmount, setStablecoinAllowanceAmount] = useState(0);
    // const stableCoin = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';
    const stableCoin = "0xe98e93Fde3A05Bc703f307Ee63be9507d1f48554";
    const wealthContract = "0xdB51665E24e977a6816fC81E7681085167A38Ea9";
    const [refBonusLoading, setRefBonusLoading] = useState(false);
    const [connectButtonText, setConnectButtonText] = useState('Connect Wallet')

    let contractInfo = [
        { label: 'TVL', value: `$ ${Number(contractBalance).toFixed(0)}` },
        { label: 'Users', value: Number(totalUsers) },
        { label: 'Total Deposit', value: `$ ${Number(totalDeposit).toFixed(0)}` },
        { label: 'Total Withdrawn', value: `$ ${Number(totalWithdrawn).toFixed(0)}` },
    ]

    const [web3, setWeb3] = useState(null);
    const [chainID, setChainID] = useState(0);

    const shorten = (str) => {
        return (str.slice(0, 6) + "..." + str.slice(38))
    }
    const [loading, setLoading] = useState(false);
    // useEffect(() => {
    //     recalculateInfo();
    // }, [chainID]);
    
    useEffect(() => {
        init();
        recalculateInfo();
    }, [userWalletAddress, chainID]);
    
    const checkNetwork = async (web3Provider) => {
        if (!web3 || !web3Provider) return false;
        const network = await web3Provider.getNetwork();
        setChainID(web3.utils.toHex(network.chainId));
        console.log("checkNetwork: ", web3.utils.toHex(network.chainId));
        if (web3.utils.toHex(network.chainId) !== web3.utils.toHex(config.CHAIN_ID)) {
          return false;
            let res = await changeNetwork();
          console.log("res: ", res);
          return res.success;
        } else {
          return true;
        }
    }
    
    const changeNetwork = async () => {
        if (!web3) return {
            success: false,
            message: "web3 error"
        };
        console.log("0");
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: web3.utils.toHex(config.CHAIN_ID) }],
            });
            console.log("1");
            return {
                success: true,
                message: "switching succeed"
            }
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask.
            console.log("2");
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                            chainId: web3.utils.toHex(config.CHAIN_ID),
                            chainName: 'PulseChain',
                            rpcUrls: [config.RPC_URL],
                            nativeCurrency: {
                                name: 'tPLS',
                                symbol: 'tPLS',
                                decimals: 18,
                            },
                            blockExplorerUrls: [config.SCAN_LINK]
                            },
                        ],
                    });
                    console.log("3");
                    return {
                        success: true,
                        message: "switching succeed"
                    }
                } catch (addError) {
                    console.log("4");
                    return {
                        success: false,
                        message: "Switching failed." + addError.message
                    }
                }
            }
            console.log("5");
            return {
                success: false,
                message: "unknow error"
            }
        }
    }

    const connectWallet = async () => {
        if (!window.ethereum) {
            toast.info("Please install your Metamask first");
            return;
        }

        setLoading(true);
        
        try {
            const provider = await web3Modal.connect();
            const client = new Web3(provider);
            setWeb3(client);
            const newProvider = new providers.Web3Provider(provider);
            const res = await checkNetwork(newProvider);
            console.log("checkNetwork result: ", res);
            if (res == false) {
                toast.info("Please connect your wallet to Binance Smart Chain Testnet!");
                return;
            }
            setChainID(config.CHAIN_ID);

            const accounts = await client.eth.getAccounts();
            console.log("connectWallet address: ", accounts[0]);
            localStorage.setItem('address', accounts[0]);
            setUserWalletAddress(accounts[0]);
            if (accounts[0] !== 'none') {
                setConnectButtonText(shorten(accounts[0]))
            }

            console.log("provider: ", provider);

            provider.on("accountsChanged", async function (accounts) {
                if (accounts[0] !== undefined) {
                    console.log("accountchanged: ", accounts[0]);
                    setUserWalletAddress(accounts[0]);
                    setConnectButtonText(shorten(accounts[0]))
                } else {
                    setUserWalletAddress('');
                }
            });

              provider.on('chainChanged', async function (chainId) {
                console.log("chainChanged:", chainId);
                setChainID(chainId);
              });

              provider.on('disconnect', function (error) {
                setUserWalletAddress('');
              });
        } catch (error) {
            console.log('[connectWallet Error] => ', error);
        }

        setLoading(false);
    }

    const disconnect = async () => {
        console.log("disconnect: ");
        await web3Modal.clearCachedProvider();
        const client = new Web3(config.mainNetUrl);
        localStorage.removeItem("address");
        setWeb3(client);
        setChainID('');
        setUserWalletAddress('');
        setConnectButtonText("Connect Wallet");
    }

    const init = async () => {
        console.log("init: ", web3Modal);
        const client = new Web3(config.RPC_URL);
        setWeb3(client);
        // const instant = await web3Modal.connect();
        // const client = new Web3(instant);
        // setWeb3(client);
        // const provider = new ethers.providers.Web3Provider(instant);
        if (!window.ethereum) {
            // toast.info("Please install your Metamask first");
            return;
        }
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        // const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);
        var signer = provider.getSigner()
        setSigner(signer)
        console.log("init signer: ", signer);
        const contract = new Contract(wealthContract, wealthMountainABI, signer);
        setContract(contract)

        // if (provider.provider.selectedAddress != null) {
        //     setUserWalletAddress(provider.provider.selectedAddress);
        //     console.log("init address: ", provider.provider.selectedAddress);
        //     setConnectButtonText(shorten(provider.provider.selectedAddress));
        // }
    };

    useEffect(() => {
        init();
    }, []);

    // window.addEventListener("focus", function () {
    //     recalculateInfo();
    // })

    async function recalcAllowance() {
        if (contract === undefined || contract === null) {
            return;
        }
        const userAllowance = await stablecoinAllowance.allowance(userWalletAddress, contract.address);
        setStablecoinAllowanceAmount(Number(ethers.utils.formatEther(userAllowance)));
    }

    async function recalculateInfo() {
        console.log("recalculateInfo: ", chainID);
        if (contract === undefined || contract === null || !userWalletAddress.includes("0x") || chainID != web3.utils.toHex(config.CHAIN_ID)) {
            setContractBalance(0);
            setUserStablecoinBalance(0)
            setStablecoinAllowanceAmount(0)
            
            setUserInfo([]);
            setCalculatedDividends(0);
            setReferralAccrued(0);
            setReferralCount(0);
    
            setTotalUsers(0);
            setTotalDeposit(0);
            setTotalWithdrawn(0);

            return;
        }
        
        try {
            const [balance, userBalance, userAllowance, userInfo, dividends, userKey, mainKey] = await Promise.all([
                stablecoinBalance.balanceOf(contract.address),
                stablecoinBalance.balanceOf(userWalletAddress),
                stablecoinAllowance.allowance(userWalletAddress, contract.address),
                contract.userInfo(),
                contract.calcdiv(userWalletAddress),
                contract.UsersKey(userWalletAddress),
                contract.MainKey(1)
            ]);

            console.log("balance: ", balance);
    
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
        } catch (err) {
            console.error("recalculateInfo error: ", err);
        }
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
        const tx = await stablecoinContract.approve(contract.address, String(ethers.utils.parseEther(stakingAmount)));
        tx.wait().then(() => {
            recalcAllowance();
            toast.success('Successfully approved!')
        }).catch((err) => {
            console.error("approve fail: ", err);
            toast.warn('Aapprove Failed!');
        }) 
    }
    async function stakeAmount() {
        if (Number(stakingAmount) < Number(10)) {
            alert('Minimum stake amount not met.')
        }

        console.log("stakeAmount: ", stakingAmount);
        const ref = window.location.search;
        const referralAddress = String(ref.replace('?ref=', ''))
        console.log("referralAddress: ", referralAddress);
        let tx;
        if (referralAddress === 'null' || referralAddress.includes("0x") === false) {
            tx = await contract.Deposit(String(ethers.utils.parseEther(stakingAmount)), String("0x0000000000000000000000000000000000000000"));
        } else {
            tx = await contract.Deposit(String(ethers.utils.parseEther(stakingAmount)), String(referralAddress));
        }

        tx.wait().then(() => { 
            recalculateInfo();    
            toast.success('Successfully Deposited!')
        });
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
                    unstakeFee = '50%'
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
            <div className='overflow-x-scroll md:overflow-x-hidden'>
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
            </div>
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
            (element, index) => {
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
                    <Button className='connect-button !hidden md:!block' onClick={() => {userWalletAddress === "" ? connectWallet() : disconnect()}}>
                        {connectButtonText}
                    </Button>
                </div>
                <div className='block md:hidden w-full flex flex-col items-center'>
                    <img alt="..." src={logoImg} className="w-[150px] md:w-[168px]" />
                    <Button className='connect-button w-1/2 my-4' onClick={() => {userWalletAddress === "" ? connectWallet() : disconnect()}}>
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
                                        <Card body className="text-center card1" key={index}>
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
                                <p className="source text-center">Approve and stake your BUSD here. You can view your ongoing stakes in the <span className="font-weight-bold">Current Stakes & Yield</span> table.</p>
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
                            <div className="calvino text-left text-white text-3xl font-semibold my-4">Earnings Calculator</div>
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
                                            <small className="text-white text-left text-sm mb-4">If withdrawal of capital before 50 days, withdrawal tax of 50% and withdrawal fees will apply.</small>
                                            {/* <small className="text-white text-left text-sm mb-4">You can withdraw initial deposit in 24 hours without paying the withdrawal tax</small> */}
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
                        <a href="https://testnet.bscscan.com/address/0xdB51665E24e977a6816fC81E7681085167A38Ea9#code" target="_blank" rel="noreferrer">
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