"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateUserName, updateOrganizationName, addOrganization, switchOrganization, getCurrentOrganization, resetOrganizationApiKey } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BillingComponent from "./ee/billing"
import { Billing } from "@prisma/client"
import { getBillingAndCreateIfNotExists } from "./ee/actions"
import { PiArrowsClockwise, PiClipboard } from "react-icons/pi"
import Image from "next/image"

type Organization = {
    id: string
    name: string
}

export default function SettingsPage() {
    const [userName, setUserName] = useState("")
    const [organizationName, setOrganizationName] = useState("")
    const [newOrganizationName, setNewOrganizationName] = useState("")
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [currentOrganizationId, setCurrentOrganizationId] = useState<string>("")
    const [apiKey, setApiKey] = useState<string>("")
    const { toast } = useToast()
    const [billing, setBilling] = useState<Billing | null>(null)


    useEffect(() => {
        const fetchData = async () => {
            const data = await getCurrentOrganization()
            const billing = await getBillingAndCreateIfNotExists()
            setUserName(data.user.name || "")
            setOrganizationName(data.currentOrganization.name)
            setOrganizations(data.organizations)
            setCurrentOrganizationId(data.currentOrganization.id)
            setBilling(billing)
            setApiKey(data.currentOrganization.apiKey)
        }
        fetchData()
    }, [])

    const handleUpdateUserName = async (e: React.FormEvent) => {
        e.preventDefault()
        await updateUserName(userName)
        toast({
            title: "Success",
            description: "User name updated successfully",
        })
    }

    const handleUpdateOrganizationName = async (e: React.FormEvent) => {
        e.preventDefault()
        await updateOrganizationName(organizationName)
        toast({
            title: "Success",
            description: "Organization name updated successfully",
        })
    }

    const handleAddOrganization = async (e: React.FormEvent) => {
        e.preventDefault()
        const newOrg = await addOrganization(newOrganizationName)
        setOrganizations([...organizations, newOrg])
        setNewOrganizationName("")
        toast({
            title: "Success",
            description: "New organization added successfully",
        })
    }

    const handleSwitchOrganization = async (organizationId: string) => {
        await switchOrganization(organizationId)
        window.location.reload()
    }

    const handleCopyApiKey = () => {
        navigator.clipboard.writeText(apiKey)
        toast({
            title: "Success",
            description: "API Key copied to clipboard",
        })
    }

    const resetApiKey = async () => {
        try {
            await resetOrganizationApiKey()
            toast({
                title: "Success",
                description: "API Key reset successfully",
            })
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to reset API Key",
                variant: "destructive"
            })
        }
    }

    return (
        <div className="space-y-5">
            <DialogTitle>
                Settings
            </DialogTitle>
            <Tabs defaultValue="settings" className="w-full">
                <TabsList className="w-full">
                    <TabsTrigger className="w-full" value="settings">General Settings</TabsTrigger>
                    <TabsTrigger className="w-full" value="integrations">Integrations</TabsTrigger>
                    {billing && <TabsTrigger className="w-full" value="billing">Billing</TabsTrigger>}
                </TabsList>
                <TabsContent value="settings">
                    <div className="space-y-5">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">User Settings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateUserName} className="flex flex-col gap-2">
                                    <Label>User Name</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            className="w-2/3"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            placeholder="User Name"
                                        />
                                        <Button className="w-1/3" type="submit">Update Name</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Organization Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-5">
                                <form onSubmit={handleUpdateOrganizationName} className="flex flex-col gap-2">
                                    <Label>Organization Name</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            className="w-2/3"
                                            value={organizationName}
                                            onChange={(e) => setOrganizationName(e.target.value)}
                                            placeholder="Organization Name"
                                        />
                                        <Button className="w-1/3" type="submit">Update Name</Button>
                                    </div>
                                </form>
                                <form onSubmit={handleAddOrganization} className="flex flex-col gap-2">
                                    <Label>New Organization Name</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            className="w-2/3"
                                            value={newOrganizationName}
                                            onChange={(e) => setNewOrganizationName(e.target.value)}
                                            placeholder="New Organization Name"
                                        />
                                        <Button className="w-1/3" type="submit" disabled={!newOrganizationName}>Add Organization</Button>
                                    </div>
                                </form>
                                <div className="flex flex-col gap-2">
                                    <Label>Switch Organization</Label>
                                    <Select onValueChange={handleSwitchOrganization} value={currentOrganizationId}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Switch Organization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {organizations.map((org) => (
                                                <SelectItem key={org.id} value={org.id}>
                                                    {org.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">API Keys</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Label>API Key</Label>
                                <div className="flex items-center gap-2">
                                    <Input value={apiKey} disabled />
                                    <div className="flex gap-2">
                                        <Button onClick={handleCopyApiKey} size="icon"><PiClipboard /></Button>
                                        <Button onClick={resetApiKey} size="icon"><PiArrowsClockwise /></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="integrations">
                    <div className="space-y-5">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Integrations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2">
                                    <Image src="/quickbooks.svg" alt="Quickbooks" width={100} height={100} />
                                    <Label>Quickbooks</Label>
                                    <Button>Connect</Button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Image src="/xero.svg" alt="Xero" width={100} height={100} />
                                    <Label>Xero</Label>
                                    <Button>Connect</Button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Image src="/zohobooks.svg" alt="Zoho Books" width={100} height={100} />
                                    <Label>Zoho Books</Label>
                                    <Button>Connect</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                {billing && <TabsContent value="billing"><BillingComponent billingState={billing} /></TabsContent>}
            </Tabs>
        </div>
    )
}
