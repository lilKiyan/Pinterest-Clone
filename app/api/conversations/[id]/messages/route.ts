import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { validateMessageLength } from '@/lib/validations'

// دریافت پیام‌های یک گفتگو
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'برای مشاهده پیام‌ها وارد شوید' },
                { status: 401 }
            )
        }

        const { id } = await params

        // بررسی اینکه کاربر عضو این گفتگو باشد
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId: id,
                    userId: user.id,
                },
            },
        })

        if (!participant) {
            return NextResponse.json(
                { error: 'شما عضو این گفتگو نیستید' },
                { status: 403 }
            )
        }

        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        })

        return NextResponse.json({ messages })
    } catch (error) {
        console.error('GET /api/conversations/[id]/messages error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت پیام‌ها' },
            { status: 500 }
        )
    }
}

// ارسال پیام جدید
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'برای ارسال پیام وارد شوید' },
                { status: 401 }
            )
        }

        const { id } = await params

        // بررسی عضویت در گفتگو
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId: id,
                    userId: user.id,
                },
            },
        })

        if (!participant) {
            return NextResponse.json(
                { error: 'شما عضو این گفتگو نیستید' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { content } = body

        // ۱. خالی نبودن
        if (!content || !content.trim()) {
            return NextResponse.json(
                { error: 'متن پیام نمی‌تواند خالی باشد' },
                { status: 400 }
            )
        }

        const trimmed = content.trim()

        // ۲. اعتبارسنجی طول پیام (قبل از ساخت)
        const contentError = validateMessageLength(trimmed)
        if (contentError) {
            return NextResponse.json({ error: contentError }, { status: 400 })
        }

        // ۳. ساخت پیام
        const newMessage = await prisma.message.create({
            data: {
                conversationId: id,
                senderId: user.id,
                content: trimmed,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        })

        // ۴. به‌روزرسانی زمان آخرین فعالیت گفتگو
        await prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() },
        })

        // ۵. برگرداندن پیام ساخته‌شده
        return NextResponse.json({ message: newMessage }, { status: 201 })
    } catch (error) {
        console.error('POST /api/conversations/[id]/messages error:', error)
        return NextResponse.json(
            { error: 'خطا در ارسال پیام' },
            { status: 500 }
        )
    }
}