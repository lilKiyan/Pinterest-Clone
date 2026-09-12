import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// نرمال‌سازی متن فارسی (یکسان‌سازی حروف عربی و فارسی)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/ي/g, 'ی') // ي عربی → ی فارسی
    .replace(/ك/g, 'ک') // ك عربی → ک فارسی
    .replace(/\u200c/g, ' ') // نیم‌فاصله → فاصله
    .replace(/\s+/g, ' ') // چند فاصله پشت‌سرهم → یک فاصله
}

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    let q = searchParams.get('q')?.trim() || ''

    if (!q) {
      return NextResponse.json({ users: [] })
    }

    // اگه با @ شروع شده بود، حذفش کن (مثلاً @kiyan → kiyan)
    if (q.startsWith('@')) {
      q = q.slice(1)
    }

    const qNormalized = normalizeText(q)

    console.log('🔍 Search query:', q, '→', qNormalized)

    // همه‌ی کاربرا رو می‌گیریم و در JS فیلتر می‌کنیم
    // (چون SQLite case-sensitive هست و از نرمال‌سازی پشتیبانی نمی‌کنه)
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
      },
      orderBy: { username: 'asc' },
    })

    const matchedUsers = allUsers
      .filter((u) => {
        const nameNorm = normalizeText(u.name || '')
        const usernameNorm = normalizeText(u.username || '')

        return (
          nameNorm.includes(qNormalized) ||
          usernameNorm.includes(qNormalized)
        )
      })
      .slice(0, 20) // حداکثر ۲۰ نتیجه

    // اگه کاربر لاگین باشه، بفهم کدوم‌ها رو فالو کرده
    let followingIds = new Set<string>()
    if (currentUser && matchedUsers.length > 0) {
      const follows = await prisma.follow.findMany({
        where: {
          followerId: currentUser.id,
          followingId: { in: matchedUsers.map((u) => u.id) },
        },
        select: { followingId: true },
      })
      followingIds = new Set(follows.map((f) => f.followingId))
    }

    const result = matchedUsers
      .filter((u) => u.id !== currentUser?.id) // خود کاربر رو نشون نده
      .map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        avatar: u.avatar,
        bio: u.bio,
        followersCount: 0, // موقت - بعداً با _count درستش می‌کنیم
        isFollowing: followingIds.has(u.id),
      }))

    console.log('✅ Matched users:', result.length)

    return NextResponse.json({ users: result })
  } catch (error) {
    console.error('GET /api/search/users error:', error)
    return NextResponse.json(
      { error: 'خطا در جستجوی کاربران', details: (error as Error).message },
      { status: 500 }
    )
  }
}