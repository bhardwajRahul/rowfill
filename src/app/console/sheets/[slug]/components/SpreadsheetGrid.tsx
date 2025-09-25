import { Column } from "@prisma/client"
import { useEffect, useRef, useState } from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core"
import { useSheetState, CellPosition } from "../state"
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { PiPlus } from "react-icons/pi"
import { UpsertColumnDialog } from "./UpsertColumnDialog"

interface SortableColumnProps {
    column: Column
    cells: { [key: string]: string }
    editValue: string
    inputRef: React.RefObject<HTMLInputElement | null>
    onCellClick: (columnId: string, rowIndex: number, e: React.MouseEvent) => void
    onCellKeyDown: (e: React.KeyboardEvent, columnId: string, rowIndex: number) => void
    onEditValueChange: (value: string) => void
    onUpdateCell: (columnId: string, rowIndex: number, value: string) => void
    setEditingColumn: (column: Column | null) => void
    setDialogOpen: (open: boolean) => void
}

function Cell({
    columnId,
    rowIndex,
    value,
    editValue,
    inputRef,
    onCellClick,
    onCellKeyDown,
    onEditValueChange,
    onUpdateCell,
    setIsSelecting,
}: {
    columnId: string
    rowIndex: number
    value: string
    editValue: string
    inputRef: React.RefObject<HTMLInputElement | null>
    onCellClick: (columnId: string, rowIndex: number, e: React.MouseEvent) => void
    onCellKeyDown: (e: React.KeyboardEvent, columnId: string, rowIndex: number) => void
    onEditValueChange: (value: string) => void
    onUpdateCell: (columnId: string, rowIndex: number, value: string) => void
    setIsSelecting: (value: boolean) => void
}) {
    const { focusedCell, editingCell, selectedCells, setFocusedCell } = useSheetState()
    const isFocused = focusedCell?.columnId === columnId && focusedCell?.rowIndex === rowIndex
    const isEditing = editingCell?.columnId === columnId && editingCell?.rowIndex === rowIndex

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isEditing])

    const isSelected = selectedCells.some(
        cell => cell.columnId === columnId && cell.rowIndex === rowIndex
    )

    const isLastSelected = isSelected && selectedCells[selectedCells.length - 1]?.columnId === columnId && 
        selectedCells[selectedCells.length - 1]?.rowIndex === rowIndex

    const className = `relative px-4 py-2 border-b border-gray-200 min-h-[40px] cursor-cell
        ${isFocused || isEditing ? 'ring-2 ring-blue-500 ring-inset z-10 border-blue-500' : ''}
        ${isSelected ? 'bg-blue-50 border border-blue-500' : ''}`

    const handleClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        e.preventDefault()
        e.stopPropagation()
        onCellClick(columnId, rowIndex, e)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setFocusedCell(null)
            return
        }
        onCellKeyDown(e, columnId, rowIndex)
    }

    return (
        <div 
            className={className} 
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="gridcell"
            tabIndex={0}
            data-column-id={columnId}
            data-row-index={rowIndex}
        >
            {isEditing ? (
                <input
                    ref={inputRef}
                    className="w-full h-full outline-none bg-transparent absolute inset-0 px-4 py-2"
                    value={editValue}
                    onChange={(e) => onEditValueChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => {
                        // Always update cell, even if empty
                        onUpdateCell(columnId, rowIndex, editValue.trim())
                        setFocusedCell(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <>
                    <div className="w-full min-h-[24px]">
                        {value}
                    </div>
                    {isLastSelected && (
                        <div 
                            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize -mb-1 -mr-1"
                            onMouseDown={(e) => {
                                e.stopPropagation()
                                setIsSelecting(true)
                            }}
                        />
                    )}
                </>
            )}
        </div>
    )
}

function SortableColumn({
    column,
    cells,
    editValue,
    inputRef,
    onCellClick,
    onCellKeyDown,
    onEditValueChange,
    onUpdateCell,
    setIsSelecting,
    setEditingColumn,
    setDialogOpen,
}: SortableColumnProps & {
    setIsSelecting: (value: boolean) => void
    setEditingColumn: (column: Column | null) => void
    setDialogOpen: (open: boolean) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: column.id })

    const { focusedCell, setFocusedCell, rowCount } = useSheetState()

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex-shrink-0 w-[200px] border-r border-gray-200"
        >
            <div
                {...attributes}
                {...listeners}
                className="px-4 py-2 font-medium bg-gray-50 border-b border-gray-200 cursor-move"
                onDoubleClick={(e) => {
                    e.stopPropagation()
                    setEditingColumn(column)
                    setDialogOpen(true)
                }}
            >
                {column.name}
            </div>
            <div>
                {Array.from({ length: rowCount }).map((_, rowIndex) => {
                    const cellKey = `${column.id}-${rowIndex}`
                    const isFocused = focusedCell?.columnId === column.id && focusedCell?.rowIndex === rowIndex
                    const isSelected = false
                    
                    return (
                        <Cell
                            key={cellKey}
                            columnId={column.id}
                            rowIndex={rowIndex}
                            value={cells[cellKey] || ""}
                            editValue={editValue}
                            inputRef={inputRef}
                                onCellClick={onCellClick}
                                onCellKeyDown={onCellKeyDown}
                                onEditValueChange={onEditValueChange}
                                onUpdateCell={onUpdateCell}
                                setIsSelecting={setIsSelecting}
                        />
                    )
                })}
            </div>
        </div>
    )
}

interface SpreadsheetGridProps {
    columns: Column[]
    cells: { [key: string]: string }
    onUpsertColumn: (name: string, columnId?: string) => void
    onUpdateCell: (columnId: string, rowIndex: number, value: string) => void
    onMoveColumn: (columnId: string, newPosition: number) => void
}

export function SpreadsheetGrid({ columns, cells, onUpsertColumn, onUpdateCell, onMoveColumn }: SpreadsheetGridProps) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingColumn, setEditingColumn] = useState<Column | null>(null)
    const [editValue, setEditValue] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    const { 
        focusedCell, 
        editingCell,
        selectedCells,
        setFocusedCell, 
        setEditingCell,
        setSelectedCells,
        rowCount, 
        addRow,
        clearFocus
    } = useSheetState()

    const [selectionStart, setSelectionStart] = useState<CellPosition | null>(null)
    const [isSelecting, setIsSelecting] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Sort columns by position
    const sortedColumns = [...columns].sort((a, b) => a.position - b.position)

    const handleCellClick = (columnId: string, rowIndex: number, e: React.MouseEvent) => {
        const cellKey = `${columnId}-${rowIndex}`
        
        // Handle selection with shift key
        if (e.shiftKey && selectionStart) {
            const endCell = { columnId, rowIndex }
            updateSelection(selectionStart, endCell)
            return
        }

        // Handle double click to edit
        if (focusedCell?.columnId === columnId && focusedCell?.rowIndex === rowIndex) {
            setEditingCell({ columnId, rowIndex })
            return
        }

        // Start new selection
        const startCell = { columnId, rowIndex }
        setSelectionStart(startCell)
        setSelectedCells([startCell])
        
        // Focus the cell
        setFocusedCell({ columnId, rowIndex })
        setEditValue(cells[cellKey] || "")
    }

    const handleCellKeyDown = (e: React.KeyboardEvent, columnId: string, rowIndex: number) => {
        // Handle Escape key
        if (e.key === 'Escape') {
            e.preventDefault()
            clearFocus()
            return
        }

        // Start editing on any printable character
        if (!editingCell && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            setEditingCell({ columnId, rowIndex })
            setEditValue(e.key)
            return
        }

        if (e.key === 'Enter') {
            e.preventDefault()
            const value = editValue.trim()
            // Always update cell, even if empty
            onUpdateCell(columnId, rowIndex, value)
            
            // Move to next row
            const nextRowIndex = rowIndex + 1
            if (nextRowIndex >= rowCount) {
                // Add a new row and clear the current cell
                addRow()
                // Clear the current cell if we're moving to a new row
                if (value) {
                    onUpdateCell(columnId, nextRowIndex, "")
                }
            }
            // Focus the next row in the same column
            setFocusedCell({ columnId, rowIndex: nextRowIndex })
            setEditValue("")
            return
        }

        // Handle arrow keys for navigation
        if (e.key.startsWith('Arrow')) {
            e.preventDefault()
            const currentColIndex = sortedColumns.findIndex(col => col.id === columnId)
            let newColIndex = currentColIndex
            let newRowIndex = rowIndex

            switch (e.key) {
                case 'ArrowUp':
                    newRowIndex = Math.max(0, rowIndex - 1)
                    break
                case 'ArrowDown':
                    newRowIndex = Math.min(rowCount - 1, rowIndex + 1)
                    break
                case 'ArrowLeft':
                    newColIndex = Math.max(0, currentColIndex - 1)
                    break
                case 'ArrowRight':
                    newColIndex = Math.min(sortedColumns.length - 1, currentColIndex + 1)
                    break
            }

            const newColumnId = sortedColumns[newColIndex].id

            if (e.shiftKey && selectionStart) {
                // Extend selection
                updateSelection(selectionStart, { columnId: newColumnId, rowIndex: newRowIndex })
            } else {
                // Move focus
                setFocusedCell({ columnId: newColumnId, rowIndex: newRowIndex })
                setSelectionStart({ columnId: newColumnId, rowIndex: newRowIndex })
                setSelectedCells([{ columnId: newColumnId, rowIndex: newRowIndex }])
                setEditValue(cells[`${newColumnId}-${newRowIndex}`] || "")
            }
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over) return

        const oldIndex = sortedColumns.findIndex(col => col.id === active.id)
        const newIndex = sortedColumns.findIndex(col => col.id === over.id)

        if (oldIndex !== newIndex) {
            onMoveColumn(active.id as string, newIndex)
        }
    }

    useEffect(() => {
        if (focusedCell && inputRef.current) {
            inputRef.current.focus()
        }
    }, [focusedCell])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isSelecting || !selectionStart) return

            const target = document.elementFromPoint(e.clientX, e.clientY)
            if (!target) return

            const cell = target.closest('[data-column-id]')
            if (!cell) return

            const columnId = cell.getAttribute('data-column-id')
            const rowIndex = cell.getAttribute('data-row-index')
            
            if (columnId && rowIndex) {
                const endCell = { columnId, rowIndex: parseInt(rowIndex, 10) }
                updateSelection(selectionStart, endCell)
            }
        }

        const handleMouseUp = () => {
            setIsSelecting(false)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isSelecting, selectionStart])

    const updateSelection = (start: CellPosition, end: CellPosition) => {
        const startColIndex = sortedColumns.findIndex(col => col.id === start.columnId)
        const endColIndex = sortedColumns.findIndex(col => col.id === end.columnId)
        const startRow = Math.min(start.rowIndex, end.rowIndex)
        const endRow = Math.max(start.rowIndex, end.rowIndex)
        
        const newSelection = []
        for (let i = Math.min(startColIndex, endColIndex); i <= Math.max(startColIndex, endColIndex); i++) {
            for (let j = startRow; j <= endRow; j++) {
                newSelection.push({ columnId: sortedColumns[i].id, rowIndex: j })
            }
        }
        setSelectedCells(newSelection)
    }

    return (
        <div className="w-full">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="flex">
                    <SortableContext
                        items={sortedColumns.map(col => col.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {sortedColumns.map((column) => (
                            <SortableColumn
                                key={column.id}
                                column={column}
                                cells={cells}
                                editValue={editValue}
                                inputRef={inputRef}
                                onCellClick={handleCellClick}
                                onCellKeyDown={handleCellKeyDown}
                                onEditValueChange={setEditValue}
                                onUpdateCell={onUpdateCell}
                                setIsSelecting={setIsSelecting}
                                setEditingColumn={setEditingColumn}
                                setDialogOpen={setDialogOpen}
                            />
                        ))}
                    </SortableContext>
                    <div className="flex-shrink-0 w-[50px] flex items-center justify-center">
                        <button
                            onClick={() => {
                                setEditingColumn(null)
                                setDialogOpen(true)
                            }}
                            className="p-2 text-gray-500 hover:text-gray-700"
                        >
                            <PiPlus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </DndContext>
            <UpsertColumnDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) {
                        setEditingColumn(null)
                    }
                }}
                onUpsert={onUpsertColumn}
                column={editingColumn}
            />
        </div>
    )
}
