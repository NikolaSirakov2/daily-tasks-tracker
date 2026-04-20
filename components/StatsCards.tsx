'use client'

import { Task } from '@/types/task'
import { CheckCircle2, Clock, AlertCircle, XCircle, ListTodo } from 'lucide-react'
import { isAfter, parseISO } from 'date-fns'

interface StatsCardsProps {
  tasks: Task[]
}

export default function StatsCards({ tasks }: StatsCardsProps) {
  const today = new Date()

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'Todo').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    done: tasks.filter(t => t.status === 'Done').length,
    overdue: tasks.filter(t =>
      t.due_date &&
      t.status !== 'Done' &&
      t.status !== 'Cancelled' &&
      isAfter(today, parseISO(t.due_date))
    ).length,
  }

  const cards = [
    { label: 'Total Tasks', value: stats.total, icon: ListTodo, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { label: 'Completed', value: stats.done, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'bg-red-50 text-red-600 border-red-100' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className={`rounded-xl border p-4 flex items-center gap-4 ${color}`}>
          <div className="p-2 rounded-lg bg-white/60">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs font-medium opacity-75">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
