import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { Column } from "@prisma/client"

interface UpsertColumnDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onUpsert: (name: string, columnId?: string) => void
    column?: Column | null
}

export function UpsertColumnDialog({ open, onOpenChange, onUpsert, column }: UpsertColumnDialogProps) {
    const [name, setName] = useState("")

    useEffect(() => {
        if (column) {
            setName(column.name)
        } else {
            setName("")
        }
    }, [column])

    const handleUpsert = () => {
        if (name.trim()) {
            onUpsert(name, column?.id)
            setName("")
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{column ? 'Edit Column' : 'Add New Column'}</DialogTitle>
                    <DialogDescription>
                        {column ? 'Edit the column name' : 'Enter a name for the new column'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input
                        placeholder="Column name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpsert()}
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleUpsert}>
                        {column ? 'Save Changes' : 'Add Column'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
