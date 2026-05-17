import { useState } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, PlusCircle } from 'lucide-react'

const PRESETS = [100, 500, 1000, 5000]

export default function TopUpPage() {
  const { balanceQuery, topUpMutation } = useWallet()
  const [amount, setAmount] = useState('')
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  const balance = parseFloat(balanceQuery.data?.balance || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(null)
    try {
      const res = await topUpMutation.mutateAsync(parseFloat(amount))
      setSuccess(res)
      setAmount('')
    } catch (err) {
      setError(err.response?.data?.error || 'Top-up failed')
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <div>
              <h2 className="text-xl font-bold">Money Added!</h2>
              <p className="text-muted-foreground mt-1">
                New balance: ₹{parseFloat(success.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Button onClick={() => setSuccess(null)} className="mt-2">Add More</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Add Money</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Current balance: ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Top Up Wallet
          </CardTitle>
          <CardDescription>Simulated deposit — funds appear instantly</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
            )}

            {/* Quick presets */}
            <div className="space-y-1">
              <Label>Quick amounts</Label>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(p))}
                  >
                    ₹{p}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="topup-amount">Or enter amount (₹)</Label>
              <Input
                id="topup-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!amount || parseFloat(amount) <= 0 || topUpMutation.isPending}
            >
              {topUpMutation.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</>
                : `Add ₹${amount || '0'}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
