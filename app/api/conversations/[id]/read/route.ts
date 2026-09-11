import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    await prisma.message.updateMany({
        where: {
            conversationId: id,
            senderId: { not: user.id },
            isRead: false,
        },
        data: { isRead: true },
    });

    return NextResponse.json({ success: true });
}