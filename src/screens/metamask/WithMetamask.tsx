import { useState } from 'react'

const DEFAULT_SNAP_ORIGIN = 'npm:@fioprotocol/fio-wallet-snap'
const SNAP_VERSION = '1.0.2'
const FIO_API = 'https://fiotestnet.blockpane.com'
const TRANSACTION = {
  account: 'fio.address',
  action: 'addaddress',
  data: {
    fio_address: 'alice@regtest',
    public_addresses: [
      {
        chain_code: 'ETH',
        token_code: 'ETH',
        public_address: '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
      },
    ],
    max_fee: 0,
    tpid: '',
  },
  derivationIndex: 0,
}

const connectSnap = async (snapId: string, params = {}) => {
  return await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: params,
    },
  })
}

const getPublicKey = async (params = {}) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: DEFAULT_SNAP_ORIGIN,
      request: {
        method: 'showPublicKey',
        params,
      },
    },
  })
}

const signTx = async (params = {}) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: DEFAULT_SNAP_ORIGIN,
      request: {
        method: 'signTransaction',
        params,
      },
    },
  })
}

const pushTransaction = async (signedTxn: any) => {
  try {
    const pushResult = await fetch(`${FIO_API}/v1/chain/push_transaction`, {
      body: JSON.stringify(signedTxn),
      method: 'POST',
    })

    if (
      pushResult.status === 400 ||
      pushResult.status === 403 ||
      pushResult.status === 500
    ) {
      const jsonResult = await pushResult.json()

      if (jsonResult.fields) {
        const fieldErrors = jsonResult.fields.map((field: any) => ({
          name: field.name,
          value: field.value,
          error: field.error,
        }))

        throw new Error(`Error: ${JSON.stringify(fieldErrors)}`)
      } else if (jsonResult.error && jsonResult.error.what) {
        throw new Error(jsonResult.error.what)
      } else {
        throw new Error('Error')
      }
    }

    const jsonResult = await pushResult.json()
    return jsonResult
  } catch (error) {
    console.error('Error pushing transaction', error)
    throw error
  }
}

const WithMetamask = () => {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transactionResults, setTransactionResults] = useState<any>(null)

  const handleConnectSnap = async () => {
    if (window.ethereum) {
      try {
        const connectedSnap = await connectSnap(DEFAULT_SNAP_ORIGIN, {
          version: SNAP_VERSION,
        })

        if (connectedSnap && connectedSnap[DEFAULT_SNAP_ORIGIN]) {
          const snapInfo = connectedSnap[DEFAULT_SNAP_ORIGIN]

          if (
            snapInfo.version === SNAP_VERSION &&
            snapInfo.id === DEFAULT_SNAP_ORIGIN &&
            snapInfo.enabled === true &&
            snapInfo.blocked === false
          ) {
            console.log('Snap connected successfully!')

            // Get the public key
            const publicKey = await getPublicKey({
              derivationIndex: 0,
            })

            // Set the public key in state
            setPublicKey(publicKey)

            // Sign Transaction
            const signedTxnsResponse = await signTx({
              apiUrl: FIO_API,
              actionParams: [TRANSACTION],
            })

            const signedTxns = JSON.parse(signedTxnsResponse)

            // Push Transactions
            const results = await Promise.allSettled(
              signedTxns.successed.map(pushTransaction),
            )

            setTransactionResults(results)
            console.log('Transaction results:', results)
          } else {
            console.log('Incorrect snap version')
          }
        } else {
          console.log('Snap not found')
        }
      } catch (error) {
        // Assert error type
        // if (error.code === 4001) {
        //   console.log('User rejected the connection')
        // } else {
        //   console.log('MetaMask snap connection error', error)
        //   setError('MetaMask snap connection error')
        // }
      }
    } else {
      console.log('MetaMask not detected')
      setError('MetaMask not detected')
    }
  }

  const handleSignTransaction = async () => {
    try {
      const signedTxnsResponse = await signTx({
        apiUrl: FIO_API,
        actionParams: [TRANSACTION],
      })

      const signedTxns = JSON.parse(signedTxnsResponse)

      // Push Transactions
      const results = await Promise.allSettled(
        signedTxns.successed.map(pushTransaction),
      )

      setTransactionResults(results)
      console.log('Transaction results:', results)
    } catch (error) {
      console.error('Error signing transaction', error)
      setError('Error signing transaction')
    }
  }

  return (
    <div className="p-[100px]">
      <h1>With MetaMask</h1>
      <div className="mb-[50px]">
        <button onClick={handleConnectSnap}>Connect Snap</button>
        {publicKey && <p>FIO Public Key: {publicKey}</p>}
      </div>

      <div>
        <button onClick={handleSignTransaction}>Sign Transaction</button>{' '}
        {/* New button */}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {transactionResults && (
          <div>
            <h2>Transaction Results:</h2>
            <pre>{JSON.stringify(transactionResults, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default WithMetamask
