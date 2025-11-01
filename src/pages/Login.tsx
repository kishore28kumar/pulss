import React, { useState } from 'react'
import { useAuth } from '@/lib/useAuth'

const LoginPage = () => {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn(email, password)
    if (result.error) setError(result.error.message)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{maxWidth: 400, margin: "2rem auto", padding: "2rem", border: "1px solid #eee", borderRadius: "8px", background: "#fff"}}>
      <h1 style={{textAlign: 'center'}}>Login</h1>
      {error && <div style={{color:'red', marginBottom: 12}}>{error}</div>}
      <div style={{marginBottom: 12}}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{width: "100%", padding: 8}}
        />
      </div>
      <div style={{marginBottom: 12}}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{width: "100%", padding: 8}}
        />
      </div>
      <button type="submit" disabled={loading} style={{width: "100%", padding: 10, background: "#6366F1", color: "#fff", border: "none", borderRadius: "4px"}}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}

export default LoginPage
