export interface SheetRow {
  task_name: string
  description: string
  status: string
  priority: string
  category: string
  due_date: string
  notes: string
  row_index: number
}

export async function fetchSheetData(): Promise<SheetRow[]> {
  const sheetId = process.env.GOOGLE_SHEET_ID
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY

  if (!sheetId || !apiKey) {
    throw new Error('GOOGLE_SHEET_ID and GOOGLE_SHEETS_API_KEY must be set')
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:G?key=${apiKey}`
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Sheets API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  const rows: string[][] = data.values ?? []

  if (rows.length < 2) return []

  // First row is header
  return rows.slice(1).map((row, index) => ({
    task_name: row[0] ?? '',
    description: row[1] ?? '',
    status: row[2] ?? 'Todo',
    priority: row[3] ?? 'Medium',
    category: row[4] ?? '',
    due_date: row[5] ?? '',
    notes: row[6] ?? '',
    row_index: index + 2,
  })).filter(r => r.task_name.trim() !== '')
}
