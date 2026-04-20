'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, RefreshCw, Download, Sheet } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { format } from 'date-fns'
import { Task, TaskFormData } from '@/types/task'
import StatsCards from '@/components/StatsCards'
import FilterBar, { Filters } from '@/components/FilterBar'
import TaskTable from '@/components/TaskTable'
import TaskModal from '@/components/TaskModal'

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID}/edit`

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [filters, setFilters] = useState<Filters>({ search: '', status: '', priority: '', category: '' })

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      if (Array.isArray(data)) setTasks(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const syncNow = async () => {
    setSyncing(true)
    const toastId = toast.loading('Syncing from Google Sheets...')
    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Synced ${data.synced} tasks`, { id: toastId })
      setLastSync(new Date().toISOString())
      await loadTasks()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed', { id: toastId })
    } finally {
      setSyncing(false)
    }
  }

  const handleSave = async (formData: TaskFormData) => {
    if (editTask) {
      const res = await fetch(`/api/tasks/${editTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to update task')
      toast.success('Task updated')
    } else {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to create task')
      toast.success('Task created')
    }
    await loadTasks()
    setEditTask(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Task deleted')
      setTasks(prev => prev.filter(t => t.id !== id))
    }
  }

  const handleStatusChange = async (task: Task, status: Task['status']) => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, status }),
    })
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status } : t))
    }
  }

  const categories = useMemo(() =>
    [...new Set(tasks.map(t => t.category).filter(Boolean) as string[])].sort(),
    [tasks]
  )

  const filtered = useMemo(() => tasks.filter(t => {
    const s = filters.search.toLowerCase()
    if (s && !t.task_name.toLowerCase().includes(s) && !t.description?.toLowerCase().includes(s)) return false
    if (filters.status && t.status !== filters.status) return false
    if (filters.priority && t.priority !== filters.priority) return false
    if (filters.category && t.category !== filters.category) return false
    return true
  }), [tasks, filters])

  const exportCSV = () => {
    const headers = ['Task Name', 'Description', 'Status', 'Priority', 'Category', 'Due Date', 'Notes']
    const rows = filtered.map(t => [
      t.task_name, t.description ?? '', t.status, t.priority,
      t.category ?? '', t.due_date ?? '', t.notes ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Sheet className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Daily Tasks Tracker</h1>
              {lastSync && (
                <p className="text-xs text-gray-400">
                  Last sync: {format(new Date(lastSync), 'h:mm a')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID && (
              <a href={SHEET_URL} target="_blank" rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Sheet className="w-3.5 h-3.5" />
                Open Sheet
              </a>
            )}
            <button onClick={exportCSV}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button onClick={syncNow} disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <button onClick={() => { setEditTask(null); setModalOpen(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <StatsCards tasks={tasks} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-50">
            <FilterBar filters={filters} categories={categories} onChange={setFilters} />
          </div>

          <div className="px-6 py-2 text-xs text-gray-400 border-b border-gray-50">
            Showing {filtered.length} of {tasks.length} tasks
            {filtered.length > 0 && ' · Click a status badge to advance it'}
          </div>

          <div className="p-4">
            {loading ? (
              <div className="py-16 text-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading tasks...</p>
              </div>
            ) : (
              <TaskTable
                tasks={filtered}
                onEdit={task => { setEditTask(task); setModalOpen(true) }}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            )}
          </div>
        </div>
      </main>

      {modalOpen && (
        <TaskModal
          task={editTask}
          onClose={() => { setModalOpen(false); setEditTask(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
