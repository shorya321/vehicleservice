'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle } from 'lucide-react'
import { RevenueMetrics } from '@/app/admin/dashboard/actions'
import { formatCurrency } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface RevenueWidgetProps {
  data: RevenueMetrics
}

export function RevenueWidget({ data }: RevenueWidgetProps) {
  const pendingPercentage = data.pendingPayments > 0 && (data.pendingPayments + data.monthRevenue) > 0
    ? (data.pendingPayments / (data.pendingPayments + data.monthRevenue)) * 100
    : 0

  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const weekTrend = getTrend(data.weekRevenue, data.weekRevenue * 0.9) // Simulated previous week

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.todayRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            From {data.completedPayments} completed payments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Week Revenue</CardTitle>
          {weekTrend > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.weekRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            <span className={weekTrend > 0 ? 'text-green-600' : 'text-red-600'}>
              {weekTrend > 0 ? '+' : ''}{weekTrend.toFixed(1)}%
            </span>
            {' '}from last week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Month Revenue</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.monthRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            Avg transaction: {formatCurrency(data.averageTransactionValue)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.pendingPayments)}</div>
          <div className="mt-2">
            <Progress value={100 - pendingPercentage} className="h-1" />
            <p className="text-xs text-muted-foreground mt-1">
              {pendingPercentage.toFixed(1)}% of total
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function RevenueChart({ data }: { data: RevenueMetrics['revenueData'] }) {
  if (!data || data.length === 0) return null

  const maxRevenue = Math.max(...data.map(d => d.revenue))
  const minRevenue = Math.min(...data.map(d => d.revenue))

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <CardDescription>Last 30 days revenue performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] relative">
          <div className="absolute inset-0 flex items-end justify-between gap-1">
            {data.map((item, index) => {
              const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
              const isToday = index === data.length - 1
              return (
                <div
                  key={item.date}
                  className="flex-1 flex flex-col justify-end group relative"
                >
                  <div
                    className={`
                      ${isToday ? 'bg-primary' : 'bg-primary/60'}
                      rounded-t transition-all duration-300 hover:bg-primary
                      relative
                    `}
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                      {formatCurrency(item.revenue)}
                      <br />
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground mt-2">
            <span>{new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}