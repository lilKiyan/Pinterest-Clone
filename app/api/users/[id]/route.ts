import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const currentUser = await getCurrentUser()

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                bio: true,
                createdAt: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'کاربر یافت نشد' },
                { status: 404 }
            )
        }

        const [followersCount, followingCount, pins] = await Promise.all([
            prisma.follow.count({ where: { followingId: id } }),
            prisma.follow.count({ where: { followerId: id } }),
            prisma.pin.findMany({
                where: { userId: id },
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: {
                    saves: {
                        include: { board: true },
                    },
                },
            }),
        ])

        let isFollowing = false
        if (currentUser) {
            const follow = await prisma.follow.findFirst({
                where: {
                    followerId: currentUser.id,
                    followingId: id,
                },
            })
            isFollowing = !!follow
        }

        const pinsWithMeta = pins.map((pin) => {
            const userSaves = currentUser
                ? pin.saves.filter((s) => s.userId === currentUser.id)
                : []
            return {
                id: pin.id,
                title: pin.title,
                description: pin.description,
                imageUrl: pin.imageUrl,
                createdAt: pin.createdAt,
                updatedAt: pin.updatedAt,
                userId: pin.userId,
                isOwner: currentUser ? pin.userId === currentUser.id : false,
                isSavedByMe: userSaves.length > 0,
                savedBoards: userSaves.map((s) => ({
                    boardId: s.boardId,
                    boardName: s.board?.name || null,
                })),
            }
        })

        return NextResponse.json({
            user: {
                ...user,
                followersCount,
                followingCount,
                isFollowing,
            },
            pins: pinsWithMeta,
        })
    } catch (error) {
        console.error('GET /api/users/[id] error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت پروفایل کاربر' },
            { status: 500 }
        )
    }
}