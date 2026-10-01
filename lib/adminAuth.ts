import { prisma } from './prisma'
import { getCurrentUser } from './auth'
import type { CurrentUser } from '../app/types/user'


export type AdminUser = CurrentUser & {
    roles: string[]
    permissions: string[]
    banned: boolean
}

export async function hasPermission(userId: string, permissionKey: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            banned: true,
            roles: {
                select: {
                    role: {
                        select: {
                            name: true,
                            permissions: {
                                select: {
                                    permission: { select: { key: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    if (!user || user.banned) return false

    for (const userRole of user.roles) {
        if (userRole.role.name === 'admin') return true

        for (const rp of userRole.role.permissions) {
            if (rp.permission.key === permissionKey) return true
        }
    }

    return false
}

export async function requireAdmin(
    permissionKey: string
): Promise<AdminUser | null> {
    const user = await getCurrentUser()

    if (!user) return null

    const basic = await prisma.user.findUnique({
        where: { id: user.id },
        select: { banned: true, roles: { select: { role: { select: { name: true } } } } },
    })

    if (!basic || basic.banned) return null
    if (!basic.roles.some((r) => r.role.name === 'admin')) return null

    const allowed = await hasPermission(user.id, permissionKey)
    if (!allowed) return null

    return { ...user, roles: ['admin'], permissions: [permissionKey], banned: false }
}