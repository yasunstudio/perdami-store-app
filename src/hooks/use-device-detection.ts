import { useState, useEffect } from 'react'

interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isIOS: boolean
  isAndroid: boolean
  isTouchDevice: boolean
  screenWidth: number
  screenHeight: number
  orientation: 'portrait' | 'landscape'
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isIOS: false,
    isAndroid: false,
    isTouchDevice: false,
    screenWidth: 0,
    screenHeight: 0,
    orientation: 'portrait'
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const userAgent = navigator.userAgent

      const isMobile = width < 768
      const isTablet = width >= 768 && width < 1024
      const isDesktop = width >= 1024
      const isIOS = /iPad|iPhone|iPod/.test(userAgent)
      const isAndroid = /Android/.test(userAgent)
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const orientation = width > height ? 'landscape' : 'portrait'

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        isTouchDevice,
        screenWidth: width,
        screenHeight: height,
        orientation
      })
    }

    // Initial detection
    updateDeviceInfo()

    // Listen for resize events
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  return deviceInfo
}

// Hook for keyboard detection on mobile
export function useKeyboardDetection() {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height
        const windowHeight = window.innerHeight
        const keyboardHeight = Math.max(0, windowHeight - currentHeight)
        
        setKeyboardHeight(keyboardHeight)
        setIsKeyboardOpen(keyboardHeight > 150) // Threshold for keyboard detection
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange)
      return () => window.visualViewport?.removeEventListener('resize', handleViewportChange)
    }
  }, [])

  return { keyboardHeight, isKeyboardOpen }
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setPullDistance(0)
  }

  const handleTouchMove = (e: React.TouchEvent, scrollTop: number) => {
    if (!touchStart || scrollTop > 0) return
    
    const touch = e.touches[0]
    const deltaY = touch.clientY - touchStart.y
    
    if (deltaY > 0) {
      e.preventDefault()
      setPullDistance(Math.min(deltaY / 2, 100))
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isPulling) {
      setIsPulling(true)
      try {
        await onRefresh()
      } finally {
        setIsPulling(false)
      }
    }
    setPullDistance(0)
    setTouchStart(null)
  }

  return {
    isPulling,
    pullDistance,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}
