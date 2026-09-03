"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FiSearch,
  FiChevronDown,
  FiUser,
  FiSettings,
  FiLogOut,
  FiGrid,
  FiLogIn,
  FiUserPlus,
  FiX,
  FiLoader,
  FiArrowLeft,
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/authStore'

type Board = {
  id: string
  name: string
}

type SearchSuggestion = {
  id: string
  title: string
  imageUrl: string
}

const DROPDOWN_ANIMATION_MS = 220
const STAGGER_MS = 35
const SEARCH_DEBOUNCE_MS = 300
const MAX_SUGGESTIONS = 6

const Navbar = () => {
  const { user, setUser } = useAuthStore()
  const [boards, setBoards] = useState<Board[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)
  const router = useRouter()

  // ── جستجوی لایو ──
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // دریافت اولیه کاربر اگر store خالی باشد
  useEffect(() => {
    const fetchUser = async () => {
      if (user) return
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.user) setUser(data.user)
        }
      } catch (error) {
        console.error(error)
      }
    }
    fetchUser()
  }, [user, setUser])

  // دریافت بردها
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await fetch('/api/boards')
        if (!res.ok) return
        const data = await res.json()
        setBoards(data)
      } catch (error) {
        console.error(error)
      }
    }
    fetchBoards()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setBoards([])
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('خطا در خروج:', error)
    }
  }

  // توابع باز و بسته کردن دراپ‌داون
  const openDropdown = () => {
    setIsDropdownOpen(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsDropdownVisible(true))
    })
  }

  const closeDropdown = () => {
    setIsDropdownVisible(false)
    setTimeout(() => setIsDropdownOpen(false), DROPDOWN_ANIMATION_MS)
  }

  const toggleDropdown = () => {
    if (isDropdownOpen) closeDropdown()
    else openDropdown()
  }

  // بستن دراپ‌داون پروفایل با اسکرول
  useEffect(() => {
    if (!isDropdownOpen) return
    const handleScroll = () => closeDropdown()
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [isDropdownOpen])

  // ── توابع جستجوی لایو ──

  // بستن پیشنهادها با کلیک بیرون از باکس سرچ
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // debounce برای جستجوی زنده
  useEffect(() => {
    // پاک کردن تایمر قبلی
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    const trimmed = searchQuery.trim()

    if (!trimmed) {
      setSuggestions([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        if (!res.ok) throw new Error('خطا')
        const data = await res.json()
        // فقط ۶ پیشنهاد اول
        setSuggestions(
          (data.pins || []).slice(0, MAX_SUGGESTIONS).map((pin: any) => ({
            id: pin.id,
            title: pin.title,
            imageUrl: pin.imageUrl,
          }))
        )
      } catch (error) {
        console.error(error)
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [searchQuery])

  // باز کردن خودکار پیشنهادها وقتی کاربر تایپ می‌کند
  useEffect(() => {
    if (searchQuery.trim()) {
      setShowSuggestions(true)
    }
    setHighlightedIndex(-1)
  }, [searchQuery])

  const goToPin = useCallback((pinId: string) => {
    setShowSuggestions(false)
    setSearchQuery('')
    setSuggestions([])
    router.push(`/pin/${pinId}`)
  }, [router])

  const goToFullSearch = useCallback(() => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    setShowSuggestions(false)
    setSearchQuery('')
    setSuggestions([])
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }, [router, searchQuery])

  // ناوبری با کیبورد
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        goToFullSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev + 1) % suggestions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          goToPin(suggestions[highlightedIndex].id)
        } else {
          goToFullSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setHighlightedIndex(-1)
        break
    }
  }

  // هایلایت عبارت جستجو در عنوان (بدون خرابکاری — split ساده)
  const highlightMatch = (title: string, query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return title
    const index = title.toLowerCase().indexOf(trimmed.toLowerCase())
    if (index === -1) return title
    return (
      <>
        {title.slice(0, index)}
        <mark className="bg-red-100 text-red-700 rounded px-0.5">
          {title.slice(index, index + trimmed.length)}
        </mark>
        {title.slice(index + trimmed.length)}
      </>
    )
  }

  const userInitial = user?.username?.trim().charAt(0) || '؟'

  const loggedInItems = [
    { href: '/profile', icon: FiUser, label: 'پروفایل' },
    { href: '/myboards', icon: FiGrid, label: 'بردها' },
    { href: '/settings', icon: FiSettings, label: 'تنظیمات' },
  ]

  const loggedOutItems = [
    { href: '/login', icon: FiLogIn, label: 'ورود' },
    { href: '/register', icon: FiUserPlus, label: 'ثبت‌نام' },
  ]

  const showSuggestionBox = showSuggestions && searchQuery.trim().length > 0

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between px-4 h-16 gap-4">
        {/* ═══ جستجوی لایو ═══ */}
        <div ref={searchContainerRef} className="relative flex-1 w-full min-w-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              goToFullSearch()
            }}
          >
            <div className="relative">
              <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="جستجو"
                className="w-full bg-gray-100 border border-transparent rounded-full pr-10 pl-10 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100 transition-all duration-200"
              />

              {/* اسپینر یا دکمه پاک کردن داخل input */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {isSearching ? (
                  <FiLoader className="w-4 h-4 text-red-500 animate-spin" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setSuggestions([])
                      setShowSuggestions(false)
                    }}
                    className="w-5 h-5 rounded-full bg-gray-300 hover:bg-gray-400 text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="پاک کردن جستجو"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                ) : null}
              </div>
            </div>
          </form>

          {/* ═══ باکس پیشنهادهای زنده ═══ */}
          {showSuggestionBox && (
            <div className="absolute top-[calc(100%+8px)] right-0 left-0 md:right-auto md:left-auto md:w-full max-w-[480px] bg-white rounded-2xl shadow-lg ring-1 ring-black/5 overflow-hidden z-50 animate-[fadeInDown_0.18s_ease-out]">
              {/* لیست پیشنهادها */}
              {suggestions.length > 0 ? (
                <div className="py-2 max-h-[min(60vh,420px)] overflow-y-auto pt-0">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onClick={() => goToPin(suggestion.id)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors cursor-pointer ${highlightedIndex === index
                          ? 'bg-red-50'
                          : 'hover:bg-gray-50'
                        }`}
                    >
                      {/* تصویر کوچک پین */}
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 ring-1 ring-black/5 shrink-0">
                        <img
                          src={suggestion.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      {/* عنوان با هایلایت */}
                      <span className="flex-1 text-sm font-semibold text-gray-800 truncate">
                        {highlightMatch(suggestion.title, searchQuery)}
                      </span>
                      <FiSearch
                        className={`w-3.5 h-3.5 shrink-0 transition-opacity ${highlightedIndex === index
                            ? 'text-red-400 opacity-100'
                            : 'text-gray-300 opacity-0'
                          }`}
                      />
                    </button>
                  ))}
                </div>
              ) : !isSearching ? (
                // بدون نتیجه
                <div className="px-4 py-8 text-center">
                  <FiSearch className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 font-medium">
                    نتیجه‌ای برای «{searchQuery.trim()}» پیدا نشد
                  </p>
                </div>
              ) : null}

              {/* فوتر: مشاهده همه نتایج */}
              <button
                onClick={goToFullSearch}
                className="w-full flex items-center justify-between px-4 py-5 border-t border-gray-100 bg-gray-50/60 hover:bg-red-50/70 transition-colors cursor-pointer group"
              >
                <span className="text-sm font-bold text-red-600 group-hover:text-red-700">
                  مشاهده همه‌ی نتایج
                </span>
                <FiArrowLeft className="w-4 h-4 text-red-500 transition-transform group-hover:-translate-x-1" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

          {/* ═══ پروفایل و دراپ‌داون (بدون تغییر) ═══ */}
          <div className="relative">
            <div className="flex items-center gap-0.5 pl-1 pr-0.5 py-0.5 rounded-full hover:bg-gray-100 transition-colors duration-200">
              <button
                onClick={toggleDropdown}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer transition-transform hover:scale-105 active:scale-95 ${user
                  ? 'bg-gradient-to-br from-red-500 to-red-600 ring-2 ring-white shadow-sm'
                  : 'bg-gray-200 text-gray-500 ring-1 ring-gray-300 hover:bg-gray-300'
                  }`}
              >
                {user ? (
                  <span className="h-[18px]">{userInitial}</span>
                ) : (
                  <FiUser className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={toggleDropdown}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 cursor-pointer transition-all duration-200 hover:bg-gray-100"
              >
                <FiChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isDropdownVisible ? 'rotate-180' : ''
                    }`}
                />
              </button>
            </div>

            {isDropdownOpen && (
              <>
                {/* بک‌دراپ نامرئی */}
                <div className="fixed inset-0 z-40" onClick={closeDropdown} />

                <div
                  className={`absolute left-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl shadow-black/5 ring-1 ring-black/5 z-50 overflow-hidden origin-top-left transition-all ease-out ${isDropdownVisible
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-2'
                    }`}
                  style={{ transitionDuration: `${DROPDOWN_ANIMATION_MS}ms` }}
                >
                  <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-400">
                      {user ? 'حساب کاربری' : 'خوش آمدید'}
                    </p>
                  </div>

                  {user ? (
                    <>
                      {loggedInItems.map((item, index) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeDropdown}
                            style={{
                              transitionDelay: isDropdownVisible ? `${index * STAGGER_MS}ms` : '0ms',
                            }}
                            className={`group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all no-underline ${isDropdownVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                              }`}
                          >
                            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                              <Icon className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                            </span>
                            {item.label}
                          </Link>
                        )
                      })}

                      <div className="h-px bg-gray-50 mx-2" />

                      <button
                        onClick={() => {
                          closeDropdown()
                          handleLogout()
                        }}
                        style={{
                          transitionDelay: isDropdownVisible ? `${loggedInItems.length * STAGGER_MS}ms` : '0ms',
                        }}
                        className={`group rounded-b-2xl w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-all cursor-pointer ${isDropdownVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                          }`}
                      >
                        <span className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                          <FiLogOut className="w-4 h-4" />
                        </span>
                        خروج
                      </button>
                    </>
                  ) : (
                    <>
                      {loggedOutItems.map((item, index) => {
                        const Icon = item.icon
                        const isLast = index === loggedOutItems.length - 1
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeDropdown}
                            style={{
                              transitionDelay: isDropdownVisible ? `${index * STAGGER_MS}ms` : '0ms',
                            }}
                            className={`group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all no-underline ${isLast ? 'rounded-b-2xl' : ''
                              } ${isDropdownVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                              }`}
                          >
                            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                              <Icon className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                            </span>
                            {item.label}
                          </Link>
                        )
                      })}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ردیف بردها (بدون تغییر) */}
      {boards.length > 0 && (
        <div className="flex items-center gap-2 px-4 pb-3 pt-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Link
            href="/"
            className="flex-shrink-0 px-4 py-1.5 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 shadow-sm shadow-red-100 transition-colors no-underline"
          >
            همه
          </Link>

          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/board/${board.id}`}
              className="flex-shrink-0 px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-200 no-underline"
            >
              {board.name}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </header>
  )
}

export default Navbar