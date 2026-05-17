import { useState, useEffect, useRef } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { useTransactions } from '@/hooks/useTransactions'
import { usersApi } from '@/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, CheckCircle2, Search, User, AlertTriangle } from 'lucide-react'

export default function SendPage() {
  const { balanceQuery } = useWallet()
  const { sendMutation } = useTransactions()

  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState([])
  const [searching, setSearching] = useState(false)
  const [recipient, setRecipient] = useState(null)
  const [amount, setAmount]       = useState('')
  const [note, setNote]           = useState('')
  const [tx_pin, setTxPin]        = useState('')
  const [success, setSuccess]     = useState(null)
  const [error, setError]         = useState('')

  const debounceRef = useRef(null)

  // Debounced recipient search
  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await usersApi.search(query)
        setResults(data.data)
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  const selectRecipient = (user) => {
    setRecipient(user)
    setQuery(user.email)
    setResults([])
  }

  const handleSend = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(null)
    try {
      const res = await sendMutation.mutateAsync({
        recipientEmail: recipient.email,
        amount: parseFloat(amount),
        note,
        tx_pin,
      })
      setSuccess(res)
      setAmount('')
      setNote('')
      setTxPin('')
      setRecipient(null)
      setQuery('')
    } catch (err) {
      setError(err.response?.data?.error || 'Transfer failed')
    }
  }

  const balance = parseFloat(balanceQuery.data?.balance || 0)

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <div>
              <h2 className="text-xl font-bold">Transfer Successful!</h2>
              <p className="text-muted-foreground mt-1">
                ₹{parseFloat(success.amount).toLocaleString('en-IN')} sent successfully
              </p>
              {success.flagged && (
                <div className="flex items-center gap-1.5 mt-2 text-yellow-600 text-sm bg-yellow-50 px-3 py-1.5 rounded-md">
                  <AlertTriangle className="h-4 w-4" />
                  This transaction was flagged for review
                </div>
              )}
            </div>
            <Button onClick={() => setSuccess(null)} className="mt-2">Send Another</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Send Money</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Available: ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transfer Details</CardTitle>
          <CardDescription>Search by name, email, or phone</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
            )}

            {/* Recipient search */}
            <div className="space-y-1">
              <Label>Recipient</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search name, email or phone..."
                  value={query}
                  onChange={e => { setQuery(e.target.value); setRecipient(null) }}
                />
                {searching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              {/* Search results dropdown */}
              {results.length > 0 && (
                <div className="border rounded-md mt-1 overflow-hidden shadow-sm">
                  {results.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent text-left transition-colors"
                      onClick={() => selectRecipient(user)}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm shrink-0">
                        {user.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected recipient pill */}
              {recipient && (
                <div className="flex items-center gap-2 mt-2 bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
                  <User className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{recipient.name}</p>
                    <p className="text-xs text-muted-foreground">{recipient.email}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-1">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
              {amount && parseFloat(amount) > balance && (
                <p className="text-destructive text-xs mt-1">Insufficient balance</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                placeholder="What's this for?"
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={255}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="tx_pin">Transaction PIN</Label>
              <Input
                id="tx_pin"
                type="password"
                placeholder="Enter 4-digit PIN"
                value={tx_pin}
                onChange={e => setTxPin(e.target.value)}
                required
                maxLength={4}
                pattern="\d{4}"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!recipient || !amount || parseFloat(amount) <= 0 || !tx_pin || sendMutation.isPending}
            >
              {sendMutation.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                : `Send ₹${amount || '0'}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
