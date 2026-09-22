import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'وارد شوید' },
                { status: 401 }
            )
        }

        const body = await request.json().catch(() => ({}))
        const { id, unread } = body as { id?: string; unread?: boolean }

        // ═══ حالت ۱: toggle تک‌نوتیف ═══
        if (id) {
            // اول وضعیت فعلی رو بگیر — که بدونیم به کدوم سمت می‌ریم
            const current = await prisma.notification.findFirst({
                where: { id, userId: user.id },
                select: { isRead: true },
            })

            if (!current) {
                return NextResponse.json(
                    { error: 'اعلان یافت نشد' },
                    { status: 404 }
                )
            }

            const newIsRead = unread ? false : !current.isRead

            // آپدیت + شمارنده در یک تراکنش اتمیک
            const [, updatedUser] = await prisma.$transaction([
                prisma.notification.updateMany({
                    where: {
                        id,
                        userId: user.id,   // گارد مالکیت
                    },
                    data: { isRead: newIsRead },
                }),
                prisma.user.update({
                    where: { id: user.id },
                    data: {
                        unreadNotifications: newIsRead
                            ? { decrement: 1 }   // خوانده شد → کم
                            : { increment: 1 },  // برگشت به نخوانده → زیاد
                    },
                }),
            ])

            return NextResponse.json({
                isRead: newIsRead,
                unreadCount: updatedUser.unreadNotifications,
            })
        }

        // ═══ حالت ۲: همه را خوانده کن ═══
        const result = await prisma.notification.updateMany({
            where: {
                userId: user.id,
                isRead: false,
            },
            data: { isRead: true },
        })

        // شمارنده دقیق = به تعداد واقعی تغییر یافته‌ها صفر می‌شود
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { unreadNotifications: { decrement: result.count } },
        })

        return NextResponse.json({
            markedCount: result.count,
            unreadCount: Math.max(0, updatedUser.unreadNotifications),
        })
    } catch (error) {
        console.error('POST /api/notifications/read error:', error)
        return NextResponse.json(
            { error: 'خطا در علامت‌گذاری اعلان‌ها' },
            { status: 500 }
        )
    }
}