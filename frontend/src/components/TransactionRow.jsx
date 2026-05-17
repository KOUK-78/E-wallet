import { ArrowUpRight, ArrowDownLeft, RefreshCw, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

function txIcon(type) {
  if (type === 'debit')  return <ArrowUpRight className="h-4 w-4 text-red-500" />
  if (type === 'credit') return <ArrowDownLeft className="h-4 w-4 text-green-600" />
  return <RefreshCw className="h-4 w-4 text-blue-500" />
}

function txColor(type) {
  if (type === 'debit')  return 'text-red-600'
  if (type === 'credit') return 'text-green-600'
  return 'text-blue-600'
}

function txLabel(tx) {
  if (tx.type === 'topup')  return 'Added to wallet'
  if (tx.type === 'debit')  return `To ${tx.receiver_name}`
  return `From ${tx.sender_name}`
}

function txSign(type) {
  if (type === 'debit') return '−'
  return '+'
}

export default function TransactionRow({ tx }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
        {txIcon(tx.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{txLabel(tx)}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(tx.created_at), 'dd MMM yyyy, hh:mm a')}
          {tx.note && ` · ${tx.note}`}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${txColor(tx.type)}`}>
          {txSign(tx.type)}₹{parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
        {tx.flagged && (
          <Badge variant="warning" className="text-[10px] gap-0.5 mt-0.5">
            <AlertTriangle className="h-2.5 w-2.5" /> Flagged
          </Badge>
        )}
      </div>
    </div>
  )
}
