import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای ارسال پین وارد شوید' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { recipientIds } = body as { recipientIds?: string[] }

        // ── ولیدیشن ورودی ──
        if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
            return NextResponse.json(
                { error: 'حداقل یک گیرنده لازم است' },
                { status: 400 }
            )
        }

        // سقف تعداد — ضد اسپم/فشار سرور
        const uniqueRecipients = [...new Set(recipientIds)]
        if (uniqueRecipients.length > 10) {
            return NextResponse.json(
                { error: 'حداکثر ۱۰ نفر در هر ارسال' },
                { status: 400 }
            )
        }

        // ── پین باید وجود داشته باشد ──
        const pin = await prisma.pin.findUnique({
            where: { id },
            select: { id: true, title: true, imageUrl: true, userId: true },
        })

        if (!pin) {
            return NextResponse.json(
                { error: 'پین یافت نشد' },
                { status: 404 }
            )
        }

        // ── گارد رابطه: هر گیرنده یا چت دارد یا فالوشده است ──
        const [chatRecipients, followedIds] = await Promise.all([
            // گیرندگانی که با آنها گفتگو داریم
            prisma.conversation.findMany({
                where: {
                    AND: [
                        { participants: { some: { userId: user.id } } },
                        { participants: { some: { userId: { in: uniqueRecipients } } } },
                    ],
                },
                select: {
                    participants: { select: { userId: true } },
                },
            }),
            // گیرندگانی که فالوشان کرده‌ایم
            prisma.follow.findMany({
                where: {
                    followerId: user.id,
                    followingId: { in: uniqueRecipients },
                },
                select: { followingId: true },
            }),
        ])

        const allowedIds = new Set<string>()
        chatRecipients.forEach((conv) => {
            conv.participants.forEach((p) => {
                if (p.userId !== user.id && uniqueRecipients.includes(p.userId)) {
                    allowedIds.add(p.userId)
                }
            })
        })
        followedIds.forEach((f) => allowedIds.add(f.followingId))

        // تفکیک مجاز / غیرمجاز
        const validRecipients = uniqueRecipients.filter((r) => allowedIds.has(r))
        const rejected = uniqueRecipients.filter((r) => !allowedIds.has(r))

        if (validRecipients.length === 0) {
            return NextResponse.json(
                { error: 'شما با این کاربران گفتگو نداشته یا آنها را دنبال نکرده‌اید' },
                { status: 403 }
            )
        }

        // ── برای هر گیرنده: پیدا/ساخت گفتگو + ارسال پیام پین‌دار ──
        const results = await Promise.all(
            validRecipients.map(async (recipientId) => {
                // ۱. گفتگوی موجود یا جدید (همان منطق POST /api/conversations)
                let conversation = await prisma.conversation.findFirst({
                    where: {
                        AND: [
                            { participants: { some: { userId: user.id } } },
                            { participants: { some: { userId: recipientId } } },
                        ],
                    },
                    select: { id: true },
                })

                if (!conversation) {
                    conversation = await prisma.conversation.create({
                        data: {
                            participants: {
                                create: [
                                    { userId: user.id },
                                    { userId: recipientId },
                                ],
                            },
                        },
                        select: { id: true },
                    })
                }

                // ۲. پیام پین‌دار
                const message = await prisma.message.create({
                    data: {
                        conversationId: conversation.id,
                        senderId: user.id,
                        content: '📌 یک پین برای شما ارسال کرد',
                        pinId: pin.id,
                    },
                    select: { id: true, createdAt: true },
                })

                // ۳. بروزرسانی زمان گفتگو (برای سرچینی لیست چت‌ها)
                await prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { updatedAt: new Date() },
                })

                return { recipientId, conversationId: conversation.id, messageId: message.id }
            })
        )

        return NextResponse.json(
            {
                sent: results.length,
                sentTo: results.map((r) => r.recipientId),
                rejected,   // گیرنده‌های غیرمجاز (اگر بودند)
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('POST /api/pins/[id]/share error:', error)
        return NextResponse.json(
            { error: 'خطا در ارسال پین' },
            { status: 500 }
        )
    }
}