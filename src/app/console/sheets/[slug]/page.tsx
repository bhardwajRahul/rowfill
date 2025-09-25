"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSheetState } from "./state"
import { PiSpinner } from "react-icons/pi"
import { SpreadsheetGrid } from "./components/SpreadsheetGrid"
import { ChatWindow } from "./components/ChatWindow"

export default function SheetPage() {
    const { slug } = useParams()
    const {
        sheet,
        isNameEdit,
        fetchSheet,
        updateName,
        setIsNameEdit,
        updateSheetName,
        addColumn,
        updateCell,
        moveColumn
    } = useSheetState()

    useEffect(() => {
        if (slug && typeof slug === 'string') {
            fetchSheet(slug).catch((error: Error) => {
                console.error("Error fetching sheet data:", error)
            })
        }
    }, [slug])

    if (!sheet) {
        return (
            <div className="flex flex-col gap-2 justify-center items-center h-full w-full text-muted-foreground">
                <PiSpinner className="animate-spin text-2xl" />
            </div>
        )
    }

    const handleNameEdit = () => {
        if (sheet.name === "" || sheet.name.length < 3) {
            updateSheetName("Untitled")
            updateName(sheet.id, "Untitled")
        } else {
            updateName(sheet.id, sheet.name)
        }
        setIsNameEdit(false)
    }

    return (
        <div className="h-full w-full" onClick={() => handleNameEdit()}>
            <div className="w-full border-b-[1px] border-gray-200 h-[50px] flex justify-between items-center px-2">
                <div>
                    {isNameEdit ? (
                        <Input
                            className="w-[250px]"
                            placeholder="Enter a name"
                            value={sheet.name}
                            onKeyDown={(e) => e.key === 'Enter' && handleNameEdit()}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateSheetName(e.target.value)}
                        />
                    ) : (
                        <p onDoubleClick={() => setIsNameEdit(true)} className="text-gray-700 font-medium">
                            {sheet.name}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex w-full">
                <ScrollArea className="overflow-y-auto overflow-x-auto w-[calc(100%-350px)] h-[calc(100vh-50px)]">
                    <SpreadsheetGrid
                        columns={sheet.columns}
                        cells={sheet.cells}
                        onUpsertColumn={async (name, columnId) => {
                            await addColumn(name, columnId)
                        }}
                        onUpdateCell={updateCell}
                        onMoveColumn={moveColumn}
                    />
                </ScrollArea>
                <div className="h-[calc(100vh-50px)] w-[350px] border-l border-gray-200">
                    <ChatWindow />
                </div>
            </div>

        </div>
    )
}
