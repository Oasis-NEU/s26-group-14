import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link!')
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: '2rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Budget Tracker</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        {error && <p style={{ color: 'red', marginBottom: '0.5rem' }}>{error}</p>}
        {message && <p style={{ color: 'green', marginBottom: '0.5rem' }}>{message}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.5rem' }}>
          {loading ? 'Loading...' : isLogin ? 'Log In' : 'Sign Up'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <button onClick={() => setIsLogin(!isLogin)} style={{ color: 'var(--accent)',background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          {isLogin ? 'Sign up' : 'Log in'}
        </button>
      </p>
    </div>
  )
}