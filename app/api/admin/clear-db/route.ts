import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  // یه کلید ساده برای امنیت (تا کسی تصادفی این آدرس رو باز نکنه)
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (key !== 'clear-db-secret-2026') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }

  try {
    console.log('🗑️ شروع پاک‌سازی دیتابیس...')

    // ⚠️ ترتیب حذف بسیار مهمه (اول فرزندها، بعد والدها)
    await prisma.message.deleteMany()
    await prisma.conversationParticipant.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.like.deleteMany()
    await prisma.save.deleteMany()
    await prisma.follow.deleteMany()
    
    // حالا که داده‌های وابسته حذف شدن، می‌تونیم بریم سراغ جدول‌های اصلی
    await prisma.conversation.deleteMany()
    await prisma.pin.deleteMany()
    await prisma.board.deleteMany()
    await prisma.user.deleteMany()

    console.log('🎉 دیتابیس کامل پاک شد!')
    return NextResponse.json({ 
      success: true, 
      message: '✅ دیتابیس پروداکشن با موفقیت پاک شد!' 
    })

  } catch (error) {
    console.error('❌ خطا در پاک‌سازی:', error)
    return NextResponse.json({ 
      error: 'خطا در پاک‌سازی دیتابیس', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}