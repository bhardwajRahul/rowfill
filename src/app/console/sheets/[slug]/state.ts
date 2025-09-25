import { create } from "zustand"
import { upsertColumn, fetchSheet, updateSheetName, updateColumnPosition, updateCell } from "./actions"
import { SheetType } from "./types"

export interface CellPosition {
    columnId: string
    rowIndex: number
}

interface SheetState {
    // Sheet data
    sheet: SheetType | null
    isNameEdit: boolean
    
    // Cell states
    focusedCell: CellPosition | null
    selectedCells: CellPosition[]
    editingCell: CellPosition | null
    editValue: string
    rowCount: number

    // Sheet actions
    fetchSheet: (id: string) => Promise<void>
    updateName: (id: string, name: string) => Promise<void>
    setSheet: (sheet: SheetType) => void
    setIsNameEdit: (value: boolean) => void
    updateSheetName: (name: string) => void
    addColumn: (name: string, columnId?: string) => Promise<void>
    updateCell: (columnId: string, rowIndex: number, value: string) => void
    moveColumn: (columnId: string, newPosition: number) => Promise<void>

    // Cell actions
    setFocusedCell: (value: CellPosition | null) => void
    setSelectedCells: (value: CellPosition[]) => void
    setEditingCell: (value: CellPosition | null) => void
    setEditValue: (value: string) => void
    clearFocus: () => void
    addRow: () => void
    saveCell: (columnId: string, rowIndex: number, value: string | null) => Promise<void>
}

export const useSheetState = create<SheetState>((set, get) => ({
    // Sheet data
    sheet: null,
    isNameEdit: false,
    selectedCells: [],
    
    // Cell states
    focusedCell: null,
    editingCell: null,
    editValue: "",
    rowCount: 10,

    // Sheet actions
    fetchSheet: async (id: string) => {
        const sheet = await fetchSheet(id)
        set({ sheet })
    },
    updateName: async (id: string, name: string) => {
        await updateSheetName(id, name)
    },
    setSheet: (sheet) => set({ sheet }),
    setIsNameEdit: (value) => set({ isNameEdit: value }),
    updateSheetName: (name) => {
        const { sheet } = get()
        if (!sheet) return
        set({ sheet: { ...sheet, name } })
    },
    addColumn: async (name, columnId?: string) => {
        const { sheet } = get()
        if (!sheet) return
        try {
            const column = await upsertColumn(sheet.id, name, columnId)
            
            if (columnId) {
                // Update existing column
                set({ 
                    sheet: {
                        ...sheet,
                        columns: sheet.columns.map(col => 
                            col.id === columnId ? column : col
                        )
                    }
                })
            } else {
                // Add new column
                set({ 
                    sheet: {
                        ...sheet,
                        columns: [...sheet.columns, column]
                    }
                })
            }
        } catch (error) {
            console.error("Error updating column:", error)
        }
    },
    updateCell: (columnId, rowIndex, value) => {
        const { sheet, editingCell, clearFocus } = get()
        if (!sheet) return
        
        // Update local state immediately for responsiveness
        const cellKey = `${columnId}-${rowIndex}`
        const updatedCells = { ...sheet.cells }

        if (!value || !value.trim()) {
            // Remove empty cells
            delete updatedCells[cellKey]
            set({
                sheet: {
                    ...sheet,
                    cells: updatedCells
                }
            })
            // Save to server immediately for empty cells
            get().saveCell(columnId, rowIndex, null)
        } else {
            // Update cell with new value
            updatedCells[cellKey] = value.trim()
            set({
                sheet: {
                    ...sheet,
                    cells: updatedCells
                }
            })
            // Save non-empty values to server
            get().saveCell(columnId, rowIndex, value.trim())
        }

        // Clear focus if this was an editing cell
        if (editingCell?.columnId === columnId && editingCell?.rowIndex === rowIndex) {
            clearFocus()
        }
    },
    moveColumn: async (columnId, newPosition) => {
        const { sheet, fetchSheet } = get()
        if (!sheet) return
        try {
            await updateColumnPosition(sheet.id, columnId, newPosition)
            await fetchSheet(sheet.id)
        } catch (error) {
            console.error("Error moving column:", error)
        }
    },

    // Cell actions
    setFocusedCell: (value) =>
        set({ focusedCell: value, editingCell: null }),
    setSelectedCells: (value) =>
        set({ selectedCells: value }),
    setEditingCell: (value) =>
        set({ editingCell: value, focusedCell: value }),
    setEditValue: (value) =>
        set({ editValue: value }),
    clearFocus: () =>
        set({ focusedCell: null, editingCell: null, editValue: "" }),
    addRow: () => {
        const { sheet } = get()
        if (!sheet) return

        // Get the current highest row index
        const currentRows = Object.keys(sheet.cells)
            .map(key => parseInt(key.split('-')[1]))
            .filter(index => !isNaN(index))
        
        const maxRow = currentRows.length > 0 ? Math.max(...currentRows) : -1
        const newRowCount = Math.max(maxRow + 2, get().rowCount + 1)
        
        set({ rowCount: newRowCount })
    },
    saveCell: async (columnId, rowIndex, value: string | null) => {
        const { sheet } = get()
        if (!sheet) return
        await updateCell(sheet.id, columnId, rowIndex, value)
    },
}))
