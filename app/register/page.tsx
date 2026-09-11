"use client"

import { useEffect, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import PinCard from '../components/PinCard'
import { FiAlertCircle, FiImage, FiCheckCircle } from 'react-icons/fi'

const LIMIT = 12

export default function Home() {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['pins'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/pins?page=${pageParam}&limit=${LIMIT}`)
      if (!res.ok) throw new Error('خطا در دریافت پین‌ها')
      return res.json()
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 60 * 1000,
  })

  // تشخیص رسیدن به انتهای لیست
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )

    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="w-9 h-9 border-[3px] border-gray-200 border-t-red-500 rounded-full animate-spin" />
      </main>
    )
  }

  if (isError) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-2xl text-sm max-w-md">
          <FiAlertCircle className="w-5 h-5 shrink-0" />
          <span>{(error as Error).message}</span>
        </div>
      </main>
    )
  }

  const pins = data?.pages.flatMap((page) => page.pins) ?? []

  return (
    <main className="p-4 md:p-6">
      {pins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FiImage className="w-6 h-6 text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm">هنوز پینی ساخته نشده.</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {pins.map((pin) => (
            <PinCard key={pin.id} pin={pin} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-[3px] border-gray-200 border-t-red-500 rounded-full animate-spin" />
        </div>
      )}

      {!hasNextPage && pins.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-2.5 py-10">
          <FiCheckCircle className="w-5 h-5 text-red-500" />
          <p className="text-gray-400 text-sm">به انتهای پین‌ها رسیدی</p>
        </div>
      )}
    </main>
  )
}