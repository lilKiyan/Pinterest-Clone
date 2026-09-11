import { NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'   // ✅ readFile اضافه شد
import { imageSize } from 'image-size'
import path from 'path'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json(
                { error: 'فایلی ارسال نشده' },
                { status: 400 }
            )
        }

        // بررسی نوع فایل
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'فقط تصویر مجاز است' },
                { status: 400 }
            )
        }

        // ساخت نام یکتا برای فایل
        const ext = path.extname(file.name) || '.jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`

        // تبدیل File به Buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // مسیر ذخیره‌سازی در پوشه‌ی public
        const uploadDir = path.join(process.cwd(), 'public', 'uploads')
        const filePath = path.join(uploadDir, fileName)

        // ذخیره فایل
        await writeFile(filePath, buffer)

        //  استخراج ابعاد تصویر با خواندن فایل به صورت بافر
        let width: number | null = null
        let height: number | null = null

        try {
            const fileBuffer = await readFile(filePath)   //  خواندن بافر
            const dimensions = imageSize(fileBuffer)      //  پاس دادن بافر
            width = dimensions.width || null
            height = dimensions.height || null
        } catch (err) {
            console.warn('خطا در استخراج ابعاد تصویر:', err)
            // ادامه می‌دهیم بدون ابعاد
        }

        // برگردوندن آدرس عمومی فایل + ابعاد
        const imageUrl = `/uploads/${fileName}`

        return NextResponse.json(
            { imageUrl, width, height },
            { status: 201 }
        )
    } catch (error) {
        console.error('POST /api/upload error:', error)
        return NextResponse.json(
            { error: 'خطا در آپلود فایل' },
            { status: 500 }
        )
    }
}