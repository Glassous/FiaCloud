import { useState, useMemo, useCallback } from 'react'
import type { CustomPreviewRegistration } from './types'
import './CsvPreview.css'

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        current.push(field)
        field = ''
      } else if (ch === '\n') {
        current.push(field)
        field = ''
        rows.push(current)
        current = []
      } else if (ch === '\r') {
        if (next === '\n') {
          i++
        }
        current.push(field)
        field = ''
        rows.push(current)
        current = []
      } else {
        field += ch
      }
    }
  }

  current.push(field)
  if (current.length > 1 || current[0] !== '') {
    rows.push(current)
  }

  return rows
}

interface CellRef {
  row: number
  col: number
}

function CsvPreviewComponent({ content }: { content: string }) {
  const [selectedCell, setSelectedCell] = useState<CellRef | null>(null)
  const [copied, setCopied] = useState(false)

  const rows = useMemo(() => parseCsv(content), [content])

  const headers = rows.length > 0 ? rows[0] : []
  const dataRows = rows.slice(1)
  const maxCols = Math.max(headers.length, ...dataRows.map(r => r.length))

  const handleCellClick = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.stopPropagation()
    setSelectedCell(prev => {
      if (prev && prev.row === row && prev.col === col) return prev
      return { row, col }
    })
    setCopied(false)
  }, [])

  const handleDeselect = useCallback(() => {
    setSelectedCell(null)
  }, [])

  const getCellValue = useCallback((row: number, col: number): string => {
    if (row === 0) {
      return headers[col] ?? ''
    }
    return dataRows[row - 1]?.[col] ?? ''
  }, [headers, dataRows])

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedCell) return
    const value = getCellValue(selectedCell.row, selectedCell.col)
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }, [selectedCell, getCellValue])

  if (rows.length === 0) {
    return <div className="csv-preview__empty">文件内容为空</div>
  }

  return (
    <div className="csv-preview" onClick={handleDeselect}>
      <div className="csv-preview__copy-bar">
        {selectedCell ? (
          <>
            <span className="csv-preview__selection-info">
              行 {selectedCell.row + 1}, 列 {selectedCell.col + 1}
            </span>
            <button className={`csv-preview__copy-btn ${copied ? 'csv-preview__copy-btn--copied' : ''}`} onClick={handleCopy}>
              <span className="material-symbols-outlined">{copied ? 'check' : 'content_copy'}</span>
              {copied ? '已复制' : '复制'}
            </button>
          </>
        ) : (
          <span className="csv-preview__selection-info">
            点击单元格选中并复制
          </span>
        )}
      </div>
      <div className="csv-preview__table-wrapper">
        <table className="csv-preview__table">
          <thead>
            <tr>
              <th className="csv-preview__row-index">#</th>
              {headers.map((h, ci) => {
                const isSelected =
                  selectedCell !== null &&
                  selectedCell.row === 0 &&
                  selectedCell.col === ci
                return (
                  <th
                    key={ci}
                    className={isSelected ? 'csv-preview__cell--selected' : undefined}
                    onClick={(e) => handleCellClick(e, 0, ci)}
                  >
                    {h}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri}>
                <td className="csv-preview__row-index">{ri + 1}</td>
                {Array.from({ length: maxCols }, (_, ci) => {
                  const value = row[ci] ?? ''
                  const isSelected =
                    selectedCell !== null &&
                    selectedCell.row === ri + 1 &&
                    selectedCell.col === ci
                  return (
                    <td
                      key={ci}
                      className={isSelected ? 'csv-preview__cell--selected' : undefined}
                      onClick={(e) => handleCellClick(e, ri + 1, ci)}
                    >
                      {value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const CsvPreview: CustomPreviewRegistration = {
  id: 'csv',
  extensions: ['csv'],
  PreviewComponent: (props) => {
    if (props.isEditing) return null
    return <CsvPreviewComponent content={props.content} />
  },
  handlesEdit: false,
}
