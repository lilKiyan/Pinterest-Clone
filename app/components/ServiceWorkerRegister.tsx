"use client"

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('✅ SW registered, scope:', registration.scope)
                })
                .catch((err) => {
                    console.error('❌ SW registration failed:', err)
                })
        }
    }, [])

    return null
}