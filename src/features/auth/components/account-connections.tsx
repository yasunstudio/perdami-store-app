'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Github, Link, Unlink, AlertTriangle } from 'lucide-react'
import { signIn } from 'next-auth/react'

interface Account {
  id: string
  provider: string
  providerAccountId: string
  type: string
  createdAt: string
}

interface AccountConnectionsProps {
  userId: string
}

export function AccountConnections({ userId }: AccountConnectionsProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAccounts()
  }, [userId])

  const fetchAccounts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${userId}/accounts`)
      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }
      const data = await response.json()
      setAccounts(data)
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setError('Gagal memuat akun yang terhubung')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async (provider: string) => {
    try {
      setIsConnecting(provider)
      setError('')
      await signIn(provider, { 
        callbackUrl: '/profile?tab=security',
        redirect: true 
      })
    } catch (error) {
      console.error('Error connecting account:', error)
      setError(`Gagal menghubungkan akun ${provider}`)
    } finally {
      setIsConnecting(null)
    }
  }

  const handleDisconnect = async (accountId: string, provider: string) => {
    if (!confirm(`Apakah Anda yakin ingin memutuskan koneksi dengan ${provider}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}/accounts/${accountId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect account')
      }

      await fetchAccounts()
    } catch (error) {
      console.error('Error disconnecting account:', error)
      setError(`Gagal memutuskan koneksi dengan ${provider}`)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )
      case 'github':
        return <Github className="h-5 w-5" />
      default:
        return <Link className="h-5 w-5" />
    }
  }

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google'
      case 'github':
        return 'GitHub'
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1)
    }
  }

  const availableProviders = ['google', 'github']
  const connectedProviders = accounts.map(account => account.provider)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Akun Terhubung</CardTitle>
          <CardDescription>
            Kelola akun media sosial yang terhubung dengan akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Akun Terhubung</CardTitle>
        <CardDescription>
          Kelola akun media sosial yang terhubung dengan akun Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {availableProviders.map((provider) => {
            const isConnected = connectedProviders.includes(provider)
            const account = accounts.find(acc => acc.provider === provider)
            const isConnectingThis = isConnecting === provider

            return (
              <div
                key={provider}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getProviderIcon(provider)}
                  <div>
                    <div className="font-medium">{getProviderName(provider)}</div>
                    {isConnected && account && (
                      <div className="text-sm text-muted-foreground">
                        Terhubung sejak {new Date(account.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <>
                      <Badge variant="secondary" className="text-green-600">
                        Terhubung
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => account && handleDisconnect(account.id, provider)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Unlink className="h-4 w-4 mr-1" />
                        Putuskan
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect(provider)}
                      disabled={isConnectingThis}
                    >
                      {isConnectingThis ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Link className="h-4 w-4 mr-1" />
                      )}
                      Hubungkan
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {accounts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada akun yang terhubung
          </div>
        )}
      </CardContent>
    </Card>
  )
}