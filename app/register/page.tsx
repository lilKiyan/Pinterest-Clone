"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    FiUserPlus, FiUser, FiAtSign, FiMail, FiLock,
    FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiX,
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/authStore'
import {
    validateEmail, validateUsername, validateName, validatePassword,
    getPasswordStrength,
} from '@/lib/validations'

type FieldErrors = {
    name?: string
    username?: string
    email?: string
    password?: string
}

export default function RegisterPage() {
    const [name, setName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
    const [serverError, setServerError] = useState('')
    const [loading, setLoading] = useState(false)

    const router = useRouter()
    const setUser = useAuthStore((state) => state.setUser)

    const strength = getPasswordStrength(password)

    // اعتبارسنجی تکی هر فیلد (blur موقع)
    const validateField = (field: keyof FieldErrors, value: string) => {
        let error: string | null = null
        if (field === 'name') error = validateName(value)
        if (field === 'username') error = validateUsername(value)
        if (field === 'email') error = validateEmail(value)
        if (field === 'password') error = validatePassword(value)

        setFieldErrors((prev) => ({ ...prev, [field]: error || undefined }))
        return !error
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setServerError('')

        // چک همه فیلدها
        const nameOk = validateField('name', name)
        const usernameOk = validateField('username', username)
        const emailOk = validateField('email', email)
        const passwordOk = validateField('password', password)

        if (!nameOk || !usernameOk || !emailOk || !passwordOk) return

        setLoading(true)
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, email, password }),
            })

            const data = await res.json()
            if (!res.ok) {
                if (data.field) {
                    setFieldErrors((prev) => ({ ...prev, [data.field]: data.error }))
                } else {
                    setServerError(data.error || 'خطا در ثبت‌نام')
                }
                return
            }

            if (data.user) setUser(data.user)
            router.push('/')
            router.refresh()
        } catch (err) {
            setServerError('خطای شبکه. لطفاً دوباره تلاش کنید')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-red-50 via-white to-orange-50">
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-red-200/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-md mb-20">
                {/* هدر */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-red-200 ring-4 ring-white">
                        P
                    </div>
                    <h1 className="md:text-3xl text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">
                        ایجاد حساب کاربری
                    </h1>
                    <p className="text-gray-500 text-xs md:text-sm mt-2">!به خانواده Pinterest بپیوندید</p>
                </div>

                {/* فرم */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-100/60 border border-white/60 space-y-4"
                >
                    {serverError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                            <FiAlertCircle className="w-5 h-5 shrink-0" />
                            {serverError}
                        </div>
                    )}

                    {/* نام کامل */}
                    <InputField
                        label="نام کامل"
                        icon={FiUser}
                        value={name}
                        onChange={setName}
                        onBlur={() => validateField('name', name)}
                        placeholder="مثال: علی محمدی"
                        error={fieldErrors.name}
                    />

                    {/* نام کاربری */}
                    <InputField
                        label="نام کاربری"
                        icon={FiAtSign}
                        value={username}
                        onChange={setUsername}
                        onBlur={() => validateField('username', username)}
                        placeholder="ali_dev"
                        error={fieldErrors.username}
                        dir="ltr"
                        hint="فقط حروف کوچک انگلیسی، عدد و _"
                    />

                    {/* ایمیل */}
                    <InputField
                        label="ایمیل"
                        icon={FiMail}
                        value={email}
                        onChange={setEmail}
                        onBlur={() => validateField('email', email)}
                        placeholder="you@example.com"
                        error={fieldErrors.email}
                        dir="ltr"
                        type="email"
                    />

                    {/* رمز عبور */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">رمز عبور</label>
                        <div className="relative">
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-400 pointer-events-none">
                                <FiLock className="w-4 h-4" />
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() => validateField('password', password)}
                                placeholder="••••••••"
                                className={`w-full border-2 rounded-xl pr-12 pl-12 py-3 text-gray-900 placeholder-gray-400 focus:outline-none transition-all bg-white/50 ${
                                    fieldErrors.password
                                        ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100/70'
                                        : 'border-gray-200 focus:border-red-400 focus:ring-4 focus:ring-red-100/70'
                                }`}
                                dir="ltr"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                            >
                                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Strength Meter */}
                        {password && (
                            <div className="mt-2">
                                <div className="flex items-center gap-1.5 mb-1">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                i <= strength.score ? strength.barColor : 'bg-gray-200'
                                            }`}
                                        />
                                    ))}
                                    <span className={`text-[11px] font-bold ml-1 ${strength.color}`}>
                                        {strength.label}
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-400">
                                    حداقل ۸ کاراکتر با حرف بزرگ، کوچک، عدد و علامت خاص
                                </p>
                            </div>
                        )}
                        {fieldErrors.password && (
                            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                <FiAlertCircle className="w-3 h-3" />
                                {fieldErrors.password}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-red-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <FiUserPlus className="text-lg" />
                                ثبت‌نام
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    حساب دارید؟{' '}
                    <Link href="/login" className="text-red-600 font-bold hover:underline underline-offset-4 transition-all">
                        وارد شوید
                    </Link>
                </p>
            </div>
        </main>
    )
}

// ─── کامپوننت Input قابل استفاده مجدد ───
function InputField({
    label, icon: Icon, value, onChange, onBlur, placeholder, error, dir, type = 'text', hint,
}: {
    label: string
    icon: any
    value: string
    onChange: (v: string) => void
    onBlur: () => void
    placeholder: string
    error?: string
    dir?: 'ltr' | 'rtl'
    type?: string
    hint?: string
}) {
    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">{label}</label>
            <div className="relative">
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-400 pointer-events-none">
                    <Icon className="w-4 h-4" />
                </span>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    dir={dir}
                    className={`w-full border-2 rounded-xl pr-12 pl-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none transition-all bg-white/50 ${
                        error
                            ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100/70'
                            : 'border-gray-200 focus:border-red-400 focus:ring-4 focus:ring-red-100/70'
                    }`}
                />
            </div>
            {error ? (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <FiAlertCircle className="w-3 h-3" />
                    {error}
                </p>
            ) : hint ? (
                <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
            ) : null}
        </div>
    )
}