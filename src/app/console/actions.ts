'use server'

import { prisma } from '@/lib/prisma'
import { getAuthToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { sign } from 'jsonwebtoken'
import { getPresignedUrlForGet, getPresignedUrlForUpload } from '@/lib/file'

export async function fetchSheets() {
    const { organizationId, userId } = await getAuthToken()
    return await prisma.sheet.findMany({
        where: { organizationId, createdById: userId },
        orderBy: {
            createdAt: "desc"
        }
    })
}

export async function addSheet({ name }: { name: string; }) {
    const { organizationId, userId } = await getAuthToken()
    return await prisma.sheet.create({
        data: {
            name,
            organizationId,
            createdById: userId
        }
    })
}

export async function checkAuth() {
    const { organizationId, userId } = await getAuthToken()
    if (organizationId && userId) {
        return true
    }
    return false
}


export async function getCurrentOrganization() {
    const { userId, organizationId } = await getAuthToken()

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            members: {
                include: {
                    organization: true,
                },
            },
        },
    })

    if (!user) {
        throw new Error('User not found')
    }

    const currentOrganization = user.members.find(
        (member) => member.organizationId === organizationId
    )?.organization

    if (!currentOrganization) {
        throw new Error('Current organization not found')
    }

    const organizations = user.members.map((member) => member.organization)

    return { user, currentOrganization, organizations }
}


export async function updateUserName(name: string) {
    const { userId } = await getAuthToken()
    await prisma.user.update({
        where: { id: userId },
        data: { name },
    })
}

export async function updateOrganizationName(name: string) {
    const { organizationId } = await getAuthToken()
    await prisma.organization.update({
        where: { id: organizationId },
        data: { name },
    })
}

export async function addOrganization(name: string) {
    const { userId } = await getAuthToken()
    const newOrganization = await prisma.organization.create({
        data: { name },
    })
    await prisma.member.create({
        data: {
            userId,
            organizationId: newOrganization.id,
            role: 'ADMIN',
        },
    })
    return newOrganization
}

export async function switchOrganization(organizationId: string) {
    const { userId } = await getAuthToken()

    // Check if the user is a member of the organization
    const member = await prisma.member.findFirst({
        where: {
            userId,
            organizationId,
        },
    })

    if (!member) {
        throw new Error('User is not a member of this organization')
    }

    // Generate new JWT token with the new organizationId
    const token = sign({ userId, organizationId }, process.env.JWT_SECRET || '', { expiresIn: '1d' })

    // Set new cookie
    let store = await cookies()

    store.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400, // 1 day
        path: '/',
    })
}

export async function fetchSources() {
    const { organizationId } = await getAuthToken()
    return await prisma.source.findMany({
        where: { organizationId },
    })
}


export async function getUploadUrlForSource(filename: string) {
    const { organizationId } = await getAuthToken()
    if (!organizationId) {
        throw new Error('User not authenticated')
    }
    const file = await getPresignedUrlForUpload(filename)
    return {
        url: file.url,
        filename: file.filename,
    }
}

export async function addSource(nickName: string, fileName: string, fileType: string) {
    const { organizationId, userId } = await getAuthToken()
    await prisma.source.create({
        data: { nickName, fileName, fileType, organizationId, uploadedById: userId },
    })

    return
}

export async function deleteSource(sourceId: string) {
    const { organizationId } = await getAuthToken()
    await prisma.source.delete({
        where: { id: sourceId, organizationId },
    })
}