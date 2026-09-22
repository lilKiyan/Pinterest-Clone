import type { UserMini } from './user'

export type CommentDTO = {
    id: string
    content: string
    createdAt: string
    userId: string
    pinId: string
    user: UserMini
}