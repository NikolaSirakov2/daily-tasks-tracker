import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchSheetData } from '@/lib/sheets'

async function runSync() {
  const rows = await fetchSheetData()

  if (rows.length === 0) {
    return NextResponse.json({ synced: 0, message: 'No rows found in sheet' })
  }

  const upsertData = rows.map(row => ({
    task_name: row.task_name,
    description: row.description || null,
    status: row.status || 'Todo',
    priority: row.priority || 'Medium',
    category: row.category || null,
    due_date: row.due_date || null,
    notes: row.notes || null,
    sheet_row: row.row_index,
    synced_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('tasks')
    .upsert(upsertData, {
      onConflict: 'sheet_row',
      ignoreDuplicates: false,
    })

  if (error) throw error

  return NextResponse.json({
    synced: rows.length,
    message: `Successfully synced ${rows.length} tasks`,
    timestamp: new Date().toISOString(),
  })
}

// POST — called by the browser Sync button (no auth needed)
export async function POST() {
  try {
    return await runSync()
  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET — called by Vercel cron job (protected by CRON_SECRET)
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return await runSync()
  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
