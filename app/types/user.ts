import { User } from '@prisma/client'

// برای جاهایی که کامپوننت‌ها فقط این ۴ فیلد کاربر رو لازم دارن
// (مثل آواتار و اسم تو PinComments و کامنت‌ها)

export type CurrentUser = Pick<User, 'id' | 'email' | 'username' | 'name'> & {
    avatar: string | null
    bio: string | null
    unreadNotifications: number  
}

export type UserMini = Pick<CurrentUser, 'id' | 'name' | 'username' | 'avatar'>