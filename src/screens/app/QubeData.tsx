import { useState } from 'react'
import axios from 'axios'

const QubeData = () => {
  const [message, setMessage] = useState('')

  const handlePackageData = async () => {
    try {
      const response = await axios.post('http://localhost:3000/manage-cube', {
        fioAddress: 'your-fio-address', // Replace with actual FIO address
        publicKey: 'your-public-key', // Replace with actual public key
      })
      setMessage(response.data)
    } catch (error) {
      setMessage('Error packaging data')
    }
  }

  return (
    <div className="cube-data">
      <h2>Package and Post Data</h2>
      <button onClick={handlePackageData}>Package Data</button>
      <p>{message}</p>
    </div>
  )
}

export default QubeData
