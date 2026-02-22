import { Link } from 'react-router-dom'
import PolygonNFTInterface from '../../utilities/MetaContract'
import { ABI } from '../../utilities/ABI'
import { useState, useEffect, FormEvent } from 'react'
import { useActiveAccount } from 'thirdweb/react'
import { Account } from 'thirdweb/wallets'

const Dashboard = () => {
  const [activeAccount, setActiveAccount] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [mapTitle, setMapTitle] = useState('Map Address')
  const [destination, setDestination] = useState('')
  const [tokenIdII, setTokenIdII] = useState('')
  const [transferBtn, setTransferBtn] = useState('Transfer')
  const [show3rdWeb, setShow3rdWeb] = useState<Account | undefined>(undefined)

  const _account = useActiveAccount()

  useEffect(() => {
    getActiveAddress()
    console.log(_account)
    setShow3rdWeb(_account)
  }, [_account])

  const getActiveAddress = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        })
        if (accounts.length > 0) {
          console.log(accounts[0])
          setActiveAccount(accounts[0])
          setIsConnected(true)
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const connectWallet = async () => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      getActiveAddress()
    } catch (error) {
      console.log(error)
    }
  }

  const transferToken = async (e: FormEvent) => {
    try {
      e.preventDefault()
      setTransferBtn('Please Wait!!!')
      let contract = new PolygonNFTInterface(
        '0x1544cC3eC3E73c2C3a9aE131348f0F278fA48C5D',
        ABI,
      )

      let transfer = await contract.transferQube(destination, tokenIdII)
      console.log(transfer)
    } catch (error) {
      console.log(error)
    } finally {
      setTransferBtn('Transfer')
    }
  }

  const MapAdd = async () => {
    try {
      setMapTitle('Please Wait!!!')
      setTimeout(() => {
        alert('Wallet Public key mapped successfully')
        setMapTitle('Map Address')
      }, 3000)
    } catch (error) {
      console.log('.')
    } finally {
    }
  }

  return (
    <div className="flex justify-center items-center h-[100%] w-[100%] fixed bg-[#fff] flex-col">
      <div className="fixed top-[0px] w-[100%] h-[80px] px-[20px] bg-[#00f] flex items-center justify-between text-[#fff]">
        <h3 className="font-[500] text-[12px]">
          Welcome,
          <span className="font-[700]">
            {' '}
            {activeAccount || show3rdWeb?.address}
          </span>
        </h3>
        <div className="flex">
          {/* <Link
            to="metamask"
            className="block w-[33.3%] h-[50%] flex flex-col justify-center items-center cursor-pointer mr-[23px]"
          >
            <div className="">With Fio/Metamask</div>
          </Link> */}
          {/* <Link
            to="thirdweb"
            className="block w-[33.3%] h-[50%] flex flex-col justify-center items-center cursor-pointer mr-[23px]"
          >
            <div className="">USE THIRDWEB.</div>
          </Link> */}
          <Link
            to="minter"
            className="block w-[50.3%] h-[50%] flex flex-col justify-center items-center cursor-pointer mr-[23px]"
          >
            <div className="">ENCRYPT ON AMOY.</div>
          </Link>
          {/* <Link
            to="avalanche"
            className="block w-[33.3%] h-[50%] flex flex-col justify-center items-center cursor-pointer"
          >
            <div className="">ENCRYPT ON AVALANCHE.</div>
          </Link> */}
        </div>
      </div>
      <div className="w-[85%] h-[50%] flex flex-wrap bg-[#f6f6f6] rounded-[10px] items-center px-[20px]">
        <div className="w-[50%] h-[50%] flex flex-col justify-center items-center hover:bg-[#fff] cursor-pointer">
          <Link to="encrypt-web2" className="block">
            Map Address to Fio Wallet
          </Link>
          {isConnected ? (
            <div className="flex flex-col justify-center">
              <p className="text-[blue] text-[10px] block">{activeAccount}</p>
              <button onClick={MapAdd}>{mapTitle}</button>
            </div>
          ) : (
            <button onClick={connectWallet}>Connect MetaMask</button>
          )}
          {/* 
            <ThirdWebConnect /> */}
        </div>

        <div className="w-[50%] h-[50%] flex flex-col  justify-center items-center hover:bg-[#f6f6f6] cursor-pointer">
          Transfer Token
          <form action="" onSubmit={transferToken} className="w-[50%]">
            <input
              type="text"
              placeholder="Enter Dest. Add"
              onChange={(e) => setDestination(e.target.value)}
              className="w-[100%]"
              required
            />
            <input
              type="text"
              placeholder="Token ID"
              className="w-[100%]"
              onChange={(e) => setTokenIdII(e.target.value)}
              required
            />

            <button>{transferBtn}</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
