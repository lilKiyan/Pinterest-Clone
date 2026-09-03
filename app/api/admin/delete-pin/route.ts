import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pinId } = body

    if (!pinId) {
      return NextResponse.json(
        { error: 'شناسه پین الزامی است' },
        { status: 400 }
      )
    }

    // حذف تمام وابستگی‌ها به ترتیب درست
    await prisma.save.deleteMany({ where: { pinId } })
    await prisma.like.deleteMany({ where: { pinId } })
    await prisma.comment.deleteMany({ where: { pinId } })
    // اگر مدل Follow رابطه‌ای با Pin ندارد، نیازی نیست

    // حالا پین را حذف کن
    await prisma.pin.delete({ where: { id: pinId } })

    return NextResponse.json({ success: true, message: 'پین حذف شد' })
  } catch (error) {
    console.error('DELETE PIN ERROR:', error)
    return NextResponse.json(
      { error: 'خطا در حذف پین. لطفاً سرور را بررسی کنید.' },
      { status: 500 }
    )
  }
}