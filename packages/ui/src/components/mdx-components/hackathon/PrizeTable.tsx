import * as React from 'react'
import { Card } from '../../card'
import { Badge } from '../../badge'

interface Prize { rank: string; reward: string; count: number }
interface PrizeTableProps { prizes: Prize[] }

export function PrizeTable({ prizes }: PrizeTableProps) {
  if (!prizes?.length) return null
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rank</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reward</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Count</th>
          </tr>
        </thead>
        <tbody>
          {prizes.map((prize, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{prize.rank}</td>
              <td className="px-4 py-3 text-foreground">{prize.reward}</td>
              <td className="px-4 py-3 text-right"><Badge variant="outline">{prize.count}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
