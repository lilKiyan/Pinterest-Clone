
// اطلاعات ذخیره‌شدن پین در برد
export type SavedBoardInfo = {
    boardId: string
    boardName: string | null   // API می‌فرسته: s.board?.name || null
}

// پین استاندارد — شکل مشترک همه‌ی APIهایی که پین برمی‌گردونن
// (لیست خانه، سرچ، سیوها، پروفایل کاربر، مرتبط‌ها)
// ⚠️ فیلدهای اختیاری = بسته به منبع ممکنه فرستاده نشن (مثل پین‌های صفحه برد)
export type PinDTO = {
    // هسته — همیشه هستن
    id: string
    title: string
    description: string | null
    imageUrl: string
    imageWidth: number | null
    imageHeight: number | null
    userId: string
    createdAt: string
    isReportedByMe?: boolean
    // بسته به API ممکنه باشن یا نباشن
    updatedAt?: string
    link?: string | null
    isOwner?: boolean
    isSavedByMe?: boolean
    savedBoards?: SavedBoardInfo[]
}