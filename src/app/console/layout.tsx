"use client"

import { useEffect, useState } from 'react'
import { redirect, usePathname, useRouter } from 'next/navigation'
import { PiDatabaseBold, PiGearBold, PiMagnifyingGlass, PiPlusBold, PiTableBold } from 'react-icons/pi'
import { Button } from "@/components/ui/button"
import { AddSheetDialog } from './sheetsDialog'
import { checkAuth, fetchSheets } from './actions'
import { Billing, Sheet } from '@prisma/client'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import SettingsPage from './settingsDialog'
import { useSheetStore } from './shared'
import Image from 'next/image'
import { getBillingAndCreateIfNotExists } from './ee/actions'

export default function ConsoleLayoutContent({ children }: { children: React.ReactNode }) {
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [sheets, setSheets] = useState<Sheet[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const { dueForRefresh, setDueForRefresh } = useSheetStore()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [billing, setBilling] = useState<Billing | null>(null)

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    // Check if /sheets/slug pattern is in the pathname
    if (sheets.length > 0 && !pathname.includes('/sheets/')) {
      router.push(`/console/sheets/${sheets[0].id}`)
    }
  }, [sheets.length])

  // Refresh sheets when dueForRefresh is set
  useEffect(() => {
    if (dueForRefresh) {
      handleFetchSheets()
      setDueForRefresh("")
    }
  }, [dueForRefresh])

  const init = async () => {
    const auth = await checkAuth()
    if (!auth) {
      redirect('/auth/login')
    }
    setBilling(await getBillingAndCreateIfNotExists())
    await handleFetchSheets()
  }

  const handleFetchSheets = async () => {
    const fetchedSheets = await fetchSheets()
    setSheets(fetchedSheets)
  }

  return (
    <div className="flex h-screen">
      <div className="w-[250px] border-r-[1px] border-gray-200 p-4">
        <div className="flex flex-col gap-2 items-stretch justify-between h-full">
          <div className="flex flex-col gap-2">
            <Image className="mb-2" src="/logo-full.svg" alt="Rowfill Logo" width={120} height={50} />
            <Button className="w-full mb-1 flex items-center justify-start gap-2" onClick={() => setIsAddProjectOpen(true)}>
              <PiPlusBold /> Add New Sheet
            </Button>
            <div className="flex flex-col gap-2">
              {sheets.map((sheet) => (
                <button
                  onClick={() => router.push(`/console/sheets/${sheet.id}`)}
                  className={`py-2 px-2 rounded-md flex gap-2 items-center justify-start hover:bg-gray-200 transition-all ${pathname.includes(sheet.id) ? 'bg-gray-200' : ''}`}
                  key={sheet.id}
                >
                  <PiTableBold className="text-lg font-bold" />
                  <span className="text-[14px] font-medium text-gray-700 w-[90%] text-left overflow-hidden text-ellipsis whitespace-nowrap">{sheet.name}</span>
                </button>
              ))}
              {sheets.length === 0 && <div className="text-sm text-gray-600">No sheets found</div>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Separator className="my-2" />
            {billing && <p className="text-sm font-bold mb-2">Available Credits: {billing.credits}</p>}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full flex justify-start">
                  <PiGearBold />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <SettingsPage />
              </DialogContent>
            </Dialog>
            <AddSheetDialog isOpen={isAddProjectOpen} onClose={() => { handleFetchSheets(); setIsAddProjectOpen(false) }} />
          </div>
        </div>
      </div>
      {sheets.length > 0 && <div style={{ height: "100vh", width: 'calc(100vw - 250px)' }}>{children}</div>}
      {sheets.length === 0 && <div className="text-sm text-gray-800 h-screen flex items-center justify-center overflow-auto" style={{ width: 'calc(100vw - 250px)' }}>No sheets found</div>}
    </div>
  )
}