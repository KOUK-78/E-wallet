import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import TransactionRow from '@/components/TransactionRow'
import { Loader2, History, ChevronLeft, ChevronRight } from 'lucide-react'

const TYPE_OPTIONS = [
  { value: '',       label: 'All' },
  { value: 'debit',  label: 'Sent' },
  { value: 'credit', label: 'Received' },
  { value: 'topup',  label: 'Top-up' },
]

export default function HistoryPage() {
  const [page, setPage]           = useState(1)
  const [type, setType]           = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  const filters = {
    page,
    limit: 10,
    ...(type      && { type }),
    ...(minAmount && { minAmount }),
    ...(maxAmount && { maxAmount }),
  }

  const { historyQuery } = useTransactions(filters)
  const data       = historyQuery.data?.data       || []
  const pagination = historyQuery.data?.pagination || {}

  const resetFilters = () => {
    setType('')
    setMinAmount('')
    setMaxAmount('')
    setPage(1)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground text-sm mt-1">All your payments and top-ups</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Type pills */}
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setType(opt.value); setPage(1) }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  type === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-input hover:bg-accent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Amount range */}
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="min-amount" className="text-xs">Min ₹</Label>
              <Input
                id="min-amount"
                type="number"
                min="0"
                placeholder="0"
                value={minAmount}
                onChange={(e) => { setMinAmount(e.target.value); setPage(1) }}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="max-amount" className="text-xs">Max ₹</Label>
              <Input
                id="max-amount"
                type="number"
                min="0"
                placeholder="Any"
                value={maxAmount}
                onChange={(e) => { setMaxAmount(e.target.value); setPage(1) }}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Transactions
            </CardTitle>
            {pagination.total !== undefined && (
              <CardDescription>{pagination.total} total</CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {historyQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No transactions found</p>
            </div>
          ) : (
            <div className="divide-y">
              {data.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || historyQuery.isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages || historyQuery.isLoading}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
