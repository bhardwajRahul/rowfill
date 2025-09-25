import { Column } from "@prisma/client"

export interface SheetType {
    id: string
    name: string
    columns: Column[]
    cells: { [key: string]: string }
}
