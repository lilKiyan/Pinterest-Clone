import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function GET(request: Request) {
    try {
        const admin = await requireAdmin('categories.manage')
        if (!admin) {
            return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
        }

        const categories = await prisma.category.findMany({
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                slug: true,
                name: true,
                icon: true,
                color: true,
                sortOrder: true,
                isActive: true,
                _count: { select: { pins: true } },
            },
        })

        return NextResponse.json({ categories })
    } catch (error) {
        console.error('GET /api/admin/categories error:', error)
        return NextResponse.json({ error: 'خطا' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const admin = await requireAdmin('categories.manage')
        if (!admin) {
            return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
        }

        const rl = rateLimit(getClientIp(request), { limit: 20, windowMs: 60_000 })
        if (!rl.ok) {
            return NextResponse.json({ error: 'کمی آرام‌تر!' }, { status: 429 })
        }

        const body = await request.json()
        const { name, slug, icon, color, sortOrder } = body as {
            name?: string
            slug?: string
            icon?: string
            color?: string
            sortOrder?: number
        }

        if (!name?.trim() || !slug?.trim()) {
            return NextResponse.json(
                { error: 'نام و slug الزامی است' },
                { status: 400 }
            )
        }

        const slugRegex = /^[a-z0-9-]+$/
        const cleanSlug = slug.trim().toLowerCase()
        if (!slugRegex.test(cleanSlug)) {
            return NextResponse.json(
                { error: 'slug فقط می‌تواند شامل حروف انگلیسی کوچک، عدد و خط تیره باشد' },
                { status: 400 }
            )
        }

        const taken = await prisma.category.findUnique({
            where: { slug: cleanSlug },
            select: { id: true },
        })
        if (taken) {
            return NextResponse.json(
                { error: 'این slug قبلاً استفاده شده است' },
                { status: 409 }
            )
        }

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                slug: cleanSlug,
                icon: icon?.trim() || '🏷️',
                color: color?.trim() || '#9ca3af',
                sortOrder: sortOrder ?? 50,
            },
        })

        return NextResponse.json({ category }, { status: 201 })
    } catch (error) {
        console.error('POST /api/admin/categories error:', error)
        return NextResponse.json({ error: 'خطا در ساخت دسته' }, { status: 500 })
    }
}