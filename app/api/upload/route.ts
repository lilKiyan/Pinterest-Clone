import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'فایلی ارسال نشده' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'فقط تصویر مجاز است' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // آپلود به Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'pinterest-clone',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary Stream Error:', error)
            reject(error)
          } else {
            resolve(result)
          }
        }
      ).end(buffer)
    })

    return NextResponse.json({
      imageUrl: result.secure_url,
      width: result.width,
      height: result.height,
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ POST /api/upload error:', error)
    return NextResponse.json(
      { error: 'خطا در آپلود فایل', details: error.message || error },
      { status: 500 }
    )
  }
}