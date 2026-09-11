import { PrismaClient } from '@prisma/client'
import { imageSize } from 'image-size'
import { readFile } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
    const pins = await prisma.pin.findMany({
        where: {
            OR: [
                { imageWidth: null },
                { imageHeight: null },
            ],
        },
    })

    console.log(`🔍 پیدا شد ${pins.length} پین برای به‌روزرسانی`)

    let success = 0
    let failed = 0

    for (const pin of pins) {
        try {
            const filePath = path.join(process.cwd(), 'public', pin.imageUrl)
            const buffer = await readFile(filePath)
            const dim = imageSize(buffer)

            if (dim.width && dim.height) {
                await prisma.pin.update({
                    where: { id: pin.id },
                    data: {
                        imageWidth: dim.width,
                        imageHeight: dim.height,
                    },
                })
                console.log(`✅ ${pin.title} → ${dim.width}x${dim.height}`)
                success++
            } else {
                console.log(`⚠️  ابعاد خوانده نشد: ${pin.title}`)
                failed++
            }
        } catch (e) {
            console.error(`❌ خطا در ${pin.title}:`, (e as Error).message)
            failed++
        }
    }

    console.log(`\n🎉 تمام شد! موفق: ${success}، ناموفق: ${failed}`)
}

main().finally(() => prisma.$disconnect())