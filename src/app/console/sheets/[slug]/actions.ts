"use server"

import { prisma } from "@/lib/prisma"
import { getAuthToken } from "@/lib/auth"
import { SheetType } from "./types"

export const fetchSheet = async (id: string): Promise<SheetType> => {
    const { organizationId, userId } = await getAuthToken()
    const sheet = await prisma.sheet.findFirstOrThrow({
        where: {
            id,
            organizationId,
            createdById: userId
        },
        include: {
            columns: true
        }
    })

    return {
        id: sheet.id,
        name: sheet.name,
        columns: sheet.columns,
        cells: sheet.cells as { [key: string]: string }
    }

}

export const updateSheetName = async (id: string, name: string) => {
    const { organizationId, userId } = await getAuthToken()
    await prisma.sheet.update({
        where: {
            id,
            organizationId,
            createdById: userId
        },
        data: { name }
    })
    return
}

export const upsertColumn = async (id: string, name: string, columnId?: string) => {
    const { organizationId, userId } = await getAuthToken()

    if (columnId) {
        // Update existing column
        const column = await prisma.column.update({
            where: {
                id: columnId,
                sheetId: id,
                organizationId
            },
            data: { name }
        })
        return column
    } else {
        // Create new column
        const column = await prisma.$transaction(async (tx) => {
            // Find the last column's position
            const lastColumn = await tx.column.findFirst({
                where: { sheetId: id },
                orderBy: { position: "desc" }
            })

            // Create the new column
            const column = await tx.column.create({
                data: {
                    sheetId: id,
                    organizationId,
                    name,
                    position: lastColumn ? lastColumn.position + 1 : 0
                }
            })
            
            return column
        })
        
        return column
    }
}

export const updateColumnPosition = async (id: string, columnId: string, newPosition: number) => {
    const { organizationId, userId } = await getAuthToken()

    await prisma.$transaction(async (tx) => {
        // Get the current column
        const currentColumn = await tx.column.findFirstOrThrow({
            where: { 
                id: columnId,
                sheetId: id,
                organizationId
            }
        })

        // Get all other columns to reposition
        const columns = await tx.column.findMany({
            where: { 
                sheetId: id,
                organizationId,
                NOT: { id: columnId }
            },
            orderBy: { position: 'asc' }
        })

        // Update positions
        let pos = 0
        for (const col of columns) {
            if (pos === newPosition) pos++
            if (col.position !== pos) {
                await tx.column.update({
                    where: { id: col.id },
                    data: { position: pos }
                })
            }
            pos++
        }

        // Update the moved column's position
        await tx.column.update({
            where: { id: columnId },
            data: { position: newPosition }
        })
    })

    return true
}

export const updateCell = async (id: string, columnId: string, rowIndex: number, value: string | null) => {
    const { organizationId, userId } = await getAuthToken()

    const sheet = await prisma.sheet.findFirstOrThrow({
        where: {
            id,
            organizationId,
            createdById: userId
        },
        include: {
            columns: true
        }
    })

    const cellKey = `${columnId}-${rowIndex}`
    const currentCells = sheet.cells as { [key: string]: string }
    const updatedCells = { ...currentCells }

    if (value === null || value === "") {
        // Remove the cell if value is empty
        delete updatedCells[cellKey]
    } else {
        // Update the cell with new value
        updatedCells[cellKey] = value
    }

    await prisma.sheet.update({
        where: { 
            id,
            organizationId,
            createdById: userId
        },
        data: { 
            cells: updatedCells
        }
    })

    return {
        id: sheet.id,
        name: sheet.name,
        columns: sheet.columns,
        cells: updatedCells
    }
}
