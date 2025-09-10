import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useAuth } from '../hooks/useAuth'
import DarkVeil from './DarkVeil'
import { Loader2 } from 'lucide-react'

interface AuthScreenProps {
  onAuthSuccess: () => void
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        } else {
          setMessage('Successful login!')
          onAuthSuccess()
        }
      } else {
        const { error } = await signUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          setMessage('Registration successful! Check your email for confirmation.')
        }
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Background for the whole screen */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        zIndex: -1 
      }}>
        <DarkVeil 
          hueShift={30}
          noiseIntensity={0.02}
          scanlineIntensity={0.1}
          speed={1}
          scanlineFrequency={2.0}
          warpAmount={0.1}
        />
      </div>
      
      <div className="reflecta-gradient min-h-screen flex items-center justify-center p-4 bg-[rgba(135,206,235,1)] rounded-[12px]">
        <Card className="w-full max-w-md bg-transparent border-none">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Reflecta</h1>
              <p className="text-white/70">
                {isLogin ? 'Login to your account' : 'Create new account'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {message && (
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-200 text-sm">{message}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive py-2 has-[>svg]:px-3 w-full bg-white text-[#1C2526] hover:bg-white/90 h-12 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-sm">{isLogin ? 'Enter' : 'Register'}</span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError(null)
                  setMessage(null)
                }}
                className="text-white/70 hover:text-white text-sm underline"
              >
                {isLogin ? 'No account? Register' : 'Have account? Login'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}