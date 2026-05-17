import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useWallet } from '@/hooks/useWallet'
import { useTransactions } from '@/hooks/useTransactions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import TransactionRow from '@/components/TransactionRow'
import { SendHorizonal, PlusCircle, Loader2, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const { user } = useAuth()
  const { balanceQuery } = useWallet()
  const { historyQuery, analyticsQuery } = useTransactions({ page: 1, limit: 5 })

  const balance = balanceQuery.data?.balance
  const recent  = historyQuery.data?.data || []
  const analytics = analyticsQuery.data || []

  // format dates for the chart (e.g. "2026-05-17" to "May 17")
  const chartData = analytics.map(a => {
    const d = new Date(a.date)
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: parseFloat(a.total_spent)
    }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Good day, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">Here's your wallet overview</p>
      </div>

      {/* Top Cards: Balance & Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary text-primary-foreground border-0 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary-foreground/70">Wallet Balance</CardDescription>
          </CardHeader>
          <CardContent>
            {balanceQuery.isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <p className="text-4xl font-bold tracking-tight">
                ₹{parseFloat(balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" size="sm" asChild className="bg-white/20 hover:bg-white/30 text-white border-0">
                <Link to="/send"><SendHorizonal className="h-4 w-4 mr-1.5" />Send</Link>
              </Button>
              <Button variant="secondary" size="sm" asChild className="bg-white/20 hover:bg-white/30 text-white border-0">
                <Link to="/topup"><PlusCircle className="h-4 w-4 mr-1.5" />Add Money</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spending Analytics (30 Days)</CardTitle>
            <CardDescription>Your daily spending trend</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsQuery.isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[120px] text-sm text-muted-foreground">
                No spending data yet.
              </div>
            ) : (
              <div className="h-[120px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <Tooltip 
                      formatter={(value) => [`₹${value}`, 'Spent']}
                      labelStyle={{ color: '#000' }}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <CardDescription>Your last 5 activities</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/history">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {historyQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : recent.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs mt-1">Add money or send to someone to get started</p>
            </div>
          ) : (
            <div className="divide-y">
              {recent.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
