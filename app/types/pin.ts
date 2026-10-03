
// اطلاعات ذخیره‌شدن پین در برد
export type SavedBoardInfo = {
    boardId: string
    boardName: string | null   // API می‌فرسته: s.board?.name || null
}

export type CategoryInfo = {
    slug: string
    name: string
    icon: string
    color: string
}

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
    category?: CategoryInfo | null 
    savedBoards?: SavedBoardInfo[]
}

// پیش‌نمایش پینی که در چت share شده
export type SharedPinInfo = Pick<PinDTO, 'id' | 'title' | 'imageUrl' | 'imageWidth' | 'imageHeight'>