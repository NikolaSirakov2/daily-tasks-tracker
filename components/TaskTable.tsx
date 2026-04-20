'use client'

import { useState } from 'react'
import { Task } from '@/types/task'
import { Pencil, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { format, parseISO, isAfter } from 'date-fns'
import clsx from 'clsx'

interface TaskTableProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (task: Task, status: Task['status']) => void
}

type SortKey = 'task_name' | 'status' | 'priority' | 'category' | 'due_date' | 'created_at'
type SortDir = 'asc' | 'desc'

const statusColors: Record<string, string> = {
  'Todo': 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Done': 'bg-emerald-100 text-emerald-700',
  'Cancelled': 'bg-red-100 text-red-600',
}

const priorityColors: Record<string, string> = {
  'Low': 'bg-slate-100 text-slate-600',
  'Medium': 'bg-amber-100 text-amber-700',
  'High': 'bg-orange-100 text-orange-700',
  'Critical': 'bg-red-100 text-red-700',
}

const priorityOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300" />
  return sortDir === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
    : <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
}

const statusCycle: Record<Task['status'], Task['status']> = {
  'Todo': 'In Progress',
  'In Progress': 'Done',
  'Done': 'Todo',
  'Cancelled': 'Todo',
}

export default function TaskTable({ tasks, onEdit, onDelete, onStatusChange }: TaskTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...tasks].sort((a, b) => {
    let va: string | number = ''
    let vb: string | number = ''
    if (sortKey === 'priority') {
      va = priorityOrder[a.priority] ?? 99
      vb = priorityOrder[b.priority] ?? 99
    } else if (sortKey === 'due_date') {
      va = a.due_date ?? '9999'
      vb = b.due_date ?? '9999'
    } else {
      va = (a[sortKey] ?? '') as string
      vb = (b[sortKey] ?? '') as string
    }
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const today = new Date()

  const cols: { key: SortKey; label: string }[] = [
    { key: 'task_name', label: 'Task' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'category', label: 'Category' },
    { key: 'due_date', label: 'Due Date' },
  ]

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg font-medium">No tasks found</p>
        <p className="text-sm mt-1">Add a task or adjust your filters</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {cols.map(({ key, label }) => (
              <th key={key}
                onClick={() => toggleSort(key)}
                className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:text-gray-900 select-none whitespace-nowrap">
                <span className="flex items-center gap-1">
                  {label}
                  <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                </span>
              </th>
            ))}
            <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map(task => {
            const overdue = task.due_date && task.status !== 'Done' && task.status !== 'Cancelled'
              && isAfter(today, parseISO(task.due_date))
            return (
              <tr key={task.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-4 py-3 max-w-xs">
                  <p className={clsx('font-medium text-gray-900 truncate', task.status === 'Done' && 'line-through text-gray-400')}>
                    {task.task_name}
                  </p>
                  {task.description && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{task.description}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onStatusChange(task, statusCycle[task.status])}
                    title="Click to advance status"
                    className={clsx(
                      'px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity',
                      statusColors[task.status]
                    )}>
                    {task.status}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', priorityColors[task.priority])}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {task.category && (
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                      {task.category}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {task.due_date ? (
                    <span className={clsx('text-xs font-medium', overdue ? 'text-red-600' : 'text-gray-500')}>
                      {overdue && '⚠ '}
                      {format(parseISO(task.due_date), 'MMM d, yyyy')}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(task)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(task.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
