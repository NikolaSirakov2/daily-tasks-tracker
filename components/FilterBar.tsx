'use client'

import { Search, X } from 'lucide-react'
import { TaskStatus, TaskPriority } from '@/types/task'

export interface Filters {
  search: string
  status: TaskStatus | ''
  priority: TaskPriority | ''
  category: string
}

interface FilterBarProps {
  filters: Filters
  categories: string[]
  onChange: (filters: Filters) => void
}

const statusOptions: TaskStatus[] = ['Todo', 'In Progress', 'Done', 'Cancelled']
const priorityOptions: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical']

export default function FilterBar({ filters, categories, onChange }: FilterBarProps) {
  const hasActiveFilters = filters.search || filters.status || filters.priority || filters.category

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <select
        value={filters.status}
        onChange={e => onChange({ ...filters, status: e.target.value as TaskStatus | '' })}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">All Status</option>
        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <select
        value={filters.priority}
        onChange={e => onChange({ ...filters, priority: e.target.value as TaskPriority | '' })}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">All Priority</option>
        {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
      </select>

      {categories.length > 0 && (
        <select
          value={filters.category}
          onChange={e => onChange({ ...filters, category: e.target.value })}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}

      {hasActiveFilters && (
        <button
          onClick={() => onChange({ search: '', status: '', priority: '', category: '' })}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      )}
    </div>
  )
}
