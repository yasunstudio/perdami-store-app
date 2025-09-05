import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return new Response('Admin access required', { status: 403 })
    }

    // Create SSE response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const data = `data: ${JSON.stringify({ type: 'connected', message: 'Connected to admin notifications' })}\n\n`
        controller.enqueue(encoder.encode(data))

        // Set up polling for new notifications
        const pollNotifications = async () => {
          try {
            const notifications = await prisma.inAppNotification.findMany({
              where: {
                userId: session.user.id,
                isRead: false,
                createdAt: {
                  gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 10
            })

            if (notifications.length > 0) {
              const data = `data: ${JSON.stringify({ 
                type: 'notifications', 
                notifications,
                unreadCount: notifications.length 
              })}\n\n`
              controller.enqueue(encoder.encode(data))
            }

            // Send heartbeat
            const heartbeat = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`
            controller.enqueue(encoder.encode(heartbeat))

          } catch (error) {
            console.error('Error polling notifications:', error)
          }
        }

        // Poll every 10 seconds
        const interval = setInterval(pollNotifications, 10000)

        // Cleanup function
        return () => {
          clearInterval(interval)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error('SSE Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
