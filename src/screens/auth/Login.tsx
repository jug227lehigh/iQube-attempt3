import { FormEvent, useState } from 'react'
import axios from 'axios'

const Login = () => {
  const [fioAddress, setFioAddress] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      // Simulating a login process
      const response = await axios.post('http://localhost:3000/login', {
        fioAddress,
        publicKey,
      })
      if (response.data.success) {
        window.location.href = '/dashboard'
      } else {
        setMessage('Login failed')
      }
    } catch (error) {
      window.location.href = '/dashboard'

      setMessage('Error logging in')
    }
  }

  return (
    <div className="center-container">
      <div className="form-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="FIO Address"
            value={fioAddress}
            onChange={(e) => setFioAddress(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Public Key"
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        <p>{message}</p>
      </div>
    </div>
  )
}

export default Login
