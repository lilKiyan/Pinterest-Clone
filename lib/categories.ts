import {
    LuPalette, LuUtensils, LuPlane, LuMonitor, LuShirt,
    LuDumbbell, LuSprout, LuCamera, LuLightbulb,
    LuMusic, LuTag,
    LuHeart, LuStar, LuGamepad, LuBook, LuCar, LuDog, LuFlower,
    LuCoffee, LuShoppingBag, LuWrench, LuPencil, LuBriefcase,
    LuGift, LuGlobe, LuBell, LuAperture,
} from 'react-icons/lu'
import type { IconType } from 'react-icons' 

export type CategoryMeta = {
    slug: string
    name: string
    icon: string               
    iconComponent: IconType   
    color: string
}

export const CATEGORIES: CategoryMeta[] = [
    { slug: 'art',         name: 'هنر و طراحی',     icon: 'LuPalette',   iconComponent: LuPalette,   color: '#8b5cf6' },
    { slug: 'cooking',     name: 'آشپزی',            icon: 'LuUtensils',  iconComponent: LuUtensils,  color: '#f59e0b' },
    { slug: 'travel',      name: 'سفر و مکان‌ها',    icon: 'LuPlane',     iconComponent: LuPlane,     color: '#0ea5e9' },
    { slug: 'technology',  name: 'تکنولوژی',         icon: 'LuMonitor',   iconComponent: LuMonitor,   color: '#3b82f6' },
    { slug: 'fashion',     name: 'مد و استایل',      icon: 'LuShirt',     iconComponent: LuShirt,     color: '#ec4899' },
    { slug: 'sports',      name: 'ورزش و تناسب',     icon: 'LuDumbbell',  iconComponent: LuDumbbell,  color: '#22c55e' },
    { slug: 'garden',      name: 'گیاهان و باغبانی', icon: 'LuSprout',    iconComponent: LuSprout,    color: '#10b981' },
    { slug: 'photography', name: 'عکاسی',            icon: 'LuCamera',    iconComponent: LuCamera,    color: '#64748b' },
    { slug: 'ideas',       name: 'ایده‌های خلاقانه', icon: 'LuLightbulb', iconComponent: LuLightbulb, color: '#eab308' },
    { slug: 'music',       name: 'موسیقی',           icon: 'LuMusic',     iconComponent: LuMusic,     color: '#f43f5e' },
    { slug: 'other',       name: 'سایر',             icon: 'LuTag',       iconComponent: LuTag,       color: '#9ca3af' },
]

export const DEFAULT_CATEGORY = 'other'

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
    return CATEGORIES.find((c) => c.slug === slug)
}

export function getCategoryMeta(slug: string | null | undefined): CategoryMeta {
    return getCategoryBySlug(slug ?? '') ?? getCategoryBySlug(DEFAULT_CATEGORY)!
}

export const ICON_REGISTRY: Record<string, IconType> = {
    LuPalette, LuUtensils, LuPlane, LuMonitor, LuShirt, LuDumbbell,
    LuSprout, LuCamera, LuLightbulb, LuMusic, LuTag,
    LuHeart, LuStar, LuGamepad, LuBook, LuCar, LuDog, LuFlower,
    LuCoffee, LuShoppingBag, LuWrench, LuPencil, LuBriefcase,
    LuGift, LuGlobe, LuBell, LuAperture,
}

export function getCategoryIcon(iconName: string | null | undefined): IconType {
    return ICON_REGISTRY[iconName ?? ''] ?? LuTag
}