export const MAX_INPUT_SIZE = 10 * 1024 * 1024   // 10MB — فایل خام
export const MAX_OUTPUT_SIZE = 5 * 1024 * 1024   // 5MB — خروجی فشرده
const MAX_DIMENSION = 1920                       
const START_QUALITY = 0.85

export type CompressResult = {
    file: File
    width: number
    height: number
    wasCompressed: boolean
}

export async function compressImage(file: File): Promise<CompressResult> {
    // ── ۱. ولیدیشن نوع و حجم خام ──
    if (!file.type.startsWith('image/')) {
        throw new Error('فقط تصویر مجاز است')
    }
    if (file.size > MAX_INPUT_SIZE) {
        throw new Error('حجم تصویر بیش از ۱۰ مگابایت است')
    }

    if (file.type === 'image/gif') {
        if (file.size > MAX_OUTPUT_SIZE) {
            throw new Error('حجم GIF بیش از ۵ مگابایت است')
        }
        return { file, width: 0, height: 0, wasCompressed: false }
    }

    // ── ۳. Decode + محاسبه ابعاد جدید ──
    const bitmap = await createImageBitmap(file)

    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const targetW = Math.round(bitmap.width * scale)
    const targetH = Math.round(bitmap.height * scale)

    // ── ۴. رسم روی canvas ──
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('پشتیبانی canvas موجود نیست')

    // پس‌زمینه سفید (برای PNG های شفاف)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, targetW, targetH)
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    bitmap.close()

    // ── ۵. خروجی با کیفیت پله‌ای تا زیر سقف حجم ──
    let quality = START_QUALITY
    let blob = await canvasToBlob(canvas, 'image/jpeg', quality)

    while (blob.size > MAX_OUTPUT_SIZE && quality > 0.5) {
        quality -= 0.1
        blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    }

    if (blob.size > MAX_OUTPUT_SIZE) {
        throw new Error('حجم تصویر حتی پس از فشرده‌سازی بیش از حد مجاز است')
    }

    // ── ۶. ساخت File جدید ──
    const compressedFile = new File([blob], makeJpegName(file.name), {
        type: 'image/jpeg',
        lastModified: Date.now(),
    })

    return {
        file: compressedFile,
        width: targetW,
        height: targetH,
        wasCompressed: compressedFile.size < file.size,
    }
}

// ── helper ها ──
function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('خطا در فشرده‌سازی'))),
            type,
            quality
        )
    })
}

function makeJpegName(original: string): string {
    const base = original.replace(/\.[^.]+$/, '')
    return `${base}.jpg`
}