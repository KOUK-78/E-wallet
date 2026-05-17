import { useState, useEffect } from 'react'
import { adminApi } from '@/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ShieldAlert, Users, TrendingUp, AlertTriangle } from 'lucide-react'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminApi.stats(),
        adminApi.users()
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleFreeze = async (id) => {
    try {
      await adminApi.toggleFreeze(id)
      fetchData()
    } catch (err) {
      console.error(err)
      alert("Failed to freeze user")
    }
  }

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldAlert className="h-8 w-8 text-primary" /> Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Manage users and platform analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{parseFloat(stats?.total_volume || 0).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Fraud Flags</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.fraud_flags || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Users</CardTitle>
          <CardDescription>View user balances and manage accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-md">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-tr-md">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{u.name} {u.role === 'admin' && <Badge variant="outline" className="ml-2 text-[10px]">ADMIN</Badge>}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">₹{parseFloat(u.balance).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      {u.is_frozen 
                        ? <Badge variant="destructive">Frozen</Badge> 
                        : <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && (
                        <Button 
                          size="sm" 
                          variant={u.is_frozen ? "outline" : "destructive"}
                          onClick={() => handleFreeze(u.id)}
                        >
                          {u.is_frozen ? "Unfreeze" : "Freeze Account"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
