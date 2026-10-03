import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const PROTECTED_SLUG = 'other' 

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin('categories.manage')
        if (!admin) {
            return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
        }

        const rl = rateLimit(getClientIp(request), { limit: 30, windowMs: 60_000 })
        if (!rl.ok) {
            return NextResponse.json({ error: 'کمی آرام‌تر!' }, { status: 429 })
        }

        const { id } = await params
        const body = await request.json()
        const { name, icon, color, sortOrder, isActive } = body as {
            name?: string
            icon?: string
            color?: string
            sortOrder?: number
            isActive?: boolean
        }

        const category = await prisma.category.findUnique({
            where: { id },
            select: { id: true, slug: true },
        })

        if (!category) {
            return NextResponse.json({ error: 'دسته یافت نشد' }, { status: 404 })
        }

        const data: {
            name?: string
            icon?: string
            color?: string
            sortOrder?: number
            isActive?: boolean
        } = {}

        if (name !== undefined) {
            if (!name.trim()) {
                return NextResponse.json({ error: 'نام نمی‌تواند خالی باشد' }, { status: 400 })
            }
            data.name = name.trim()
        }
        if (icon !== undefined) data.icon = icon.trim() || '🏷️'
        if (color !== undefined) data.color = color.trim() || '#9ca3af'
        if (sortOrder !== undefined && typeof sortOrder === 'number') data.sortOrder = sortOrder
        if (isActive !== undefined && typeof isActive === 'boolean') data.isActive = isActive

        const updated = await prisma.category.update({
            where: { id },
            data,
        })

        return NextResponse.json({ category: updated, message: 'دسته به‌روزرسانی شد' })
    } catch (error) {
        console.error('PATCH /api/admin/categories/[id] error:', error)
        return NextResponse.json({ error: 'خطا در ویرایش دسته' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin('categories.manage')
        if (!admin) {
            return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
        }

        const rl = rateLimit(getClientIp(request), { limit: 10, windowMs: 300_000 })
        if (!rl.ok) {
            return NextResponse.json({ error: 'کمی آرام‌تر!' }, { status: 429 })
        }

        const { id } = await params

        const category = await prisma.category.findUnique({
            where: { id },
            select: { id: true, slug: true, name: true },
        })

        if (!category) {
            return NextResponse.json({ error: 'دسته یافت نشد' }, { status: 404 })
        }

        if (category.slug === PROTECTED_SLUG) {
            return NextResponse.json(
                { error: 'دسته «سایر» قابل حذف نیست' },
                { status: 400 }
            )
        }

        await prisma.$transaction(async (tx) => {
            const fallback = await tx.category.findUnique({
                where: { slug: PROTECTED_SLUG },
                select: { id: true },
            })

            if (!fallback) throw new Error('دسته پیش‌فرض «سایر» یافت نشد')

            await tx.pin.updateMany({
                where: { categoryId: id },
                data: { categoryId: fallback.id },
            })

            await tx.category.delete({ where: { id } })
        })

        return NextResponse.json({
            message: `دسته «${category.name}» حذف شد و پین‌های آن به «سایر» منتقل شدند`,
        })
    } catch (error) {
        console.error('DELETE /api/admin/categories/[id] error:', error)
        return NextResponse.json({ error: 'خطا در حذف دسته' }, { status: 500 })
    }
}