import * as XLSX from 'xlsx'

export interface ExcelExportOptions {
  filename: string
  sheets: Array<{
    name: string
    data: any[][]
    headers?: string[]
  }>
}

export const exportToExcel = async (options: ExcelExportOptions) => {
  try {
    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Add each sheet
    options.sheets.forEach(sheet => {
      let sheetData = sheet.data

      // Add headers if provided
      if (sheet.headers) {
        sheetData = [sheet.headers, ...sheet.data]
      }

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
      
      // Auto-width columns
      const colWidths = sheetData.reduce((widths: number[], row) => {
        row.forEach((cell: any, index: number) => {
          const cellWidth = String(cell).length
          widths[index] = Math.max(widths[index] || 0, cellWidth)
        })
        return widths
      }, [])

      worksheet['!cols'] = colWidths.map(width => ({ width: Math.min(width + 2, 50) }))

      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
    })

    // Save file
    XLSX.writeFile(workbook, options.filename)
    
    return true
  } catch (error) {
    console.error('Excel export error:', error)
    throw error
  }
}

export const formatExcelDate = (date: Date): string => {
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const generateExcelFilename = (reportType: string, dateRange?: { from: Date; to: Date }): string => {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  
  if (dateRange) {
    const fromStr = dateRange.from.toISOString().split('T')[0]
    const toStr = dateRange.to.toISOString().split('T')[0]
    return `${reportType}_${fromStr}_to_${toStr}_exported_${dateStr}.xlsx`
  }
  
  return `${reportType}_${dateStr}.xlsx`
}
