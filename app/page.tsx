"use client"

import { useEffect, useState, useRef, useCallback } from 'react'
import PinCard from './components/PinCard'
import { FiAlertCircle, FiImage, FiCheckCircle } from 'react-icons/fi'

const LIMIT = 12

export default function Home() {
  const [pins, setPins] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadingMoreRef = useRef(false) // جلوگیری از درخواست‌های همزمان

  const fetchPins = useCallback(async (pageNum: number) => {
    console.log('fetchPins called with page:', pageNum);
    if (loadingMoreRef.current) return

    loadingMoreRef.current = true
    if (pageNum === 1) setInitialLoading(true)
    else setLoadingMore(true)

    try {
      const res = await fetch(`/api/pins?page=${pageNum}&limit=${LIMIT}`)
      if (!res.ok) throw new Error('خطا در دریافت پین‌ها')
      const data = await res.json()

      if (pageNum === 1) {
        setPins(data.pins)
      } else {
        setPins(prev => [...prev, ...data.pins])
      }
      setHasMore(data.hasMore)
      setPage(pageNum)
      console.log('API Response:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      loadingMoreRef.current = false
      setInitialLoading(false)
      setLoadingMore(false)
    }
  }, [])

  // لود اولیه
  useEffect(() => {
    fetchPins(1)
  }, [fetchPins])

  // تنظیم IntersectionObserver فقط یک‌بار
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0]
        if (firstEntry.isIntersecting && !loadingMoreRef.current) {
          setPage(prevPage => {
            const nextPage = prevPage + 1
            fetchPins(nextPage)
            return nextPage
          })
        }
      },
      { rootMargin: '50px'}
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => observer.disconnect()
  }, [fetchPins, initialLoading]) // fetchPins ثابت است

  if (initialLoading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="w-9 h-9 border-[3px] border-gray-200 border-t-red-500 rounded-full animate-spin" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-2xl text-sm max-w-md">
          <FiAlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      {pins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 ring-1 ring-black/5 flex items-center justify-center mb-4">
            <FiImage className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm">
            هنوز پینی ساخته نشده. اولین پین رو اضافه کن!
          </p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {pins.map((pin) => (
            <PinCard key={pin.id} pin={pin} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />

      {loadingMore && (
        <div className="flex justify-center items-center gap-2.5 py-8">
          <div className="w-6 h-6 border-[3px] border-gray-200 border-t-red-500 rounded-full animate-spin" />
          <span className="text-xs text-gray-400 font-medium">در حال بارگذاری پین‌های بیشتر...</span>
        </div>
      )}

      {!hasMore && pins.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-2.5 py-10">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <FiCheckCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-gray-400 text-sm">به انتهای پین‌ها رسیدی</p>
        </div>
      )}
    </main>
  )
}