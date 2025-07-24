import { PrismaClient, ContactType } from '@prisma/client'

const prisma = new PrismaClient()

async function createContactInfo() {
  console.log('🌱 Creating contact info...')

  try {
    // Check if contact info already exists
    const existing = await prisma.contactInfo.findMany()
    if (existing.length > 0) {
      console.log('✅ Contact info already exists, skipping...')
      return
    }

    // Create contact info records
    const contactInfoData = [
      {
        id: 'email-primary',
        type: ContactType.EMAIL,
        title: 'Email Utama',
        value: 'hello@perdamistore.com',
        icon: 'mail',
        color: '#3B82F6'
      },
      {
        id: 'phone-primary',
        type: ContactType.PHONE,
        title: 'Telepon',
        value: '+62 22 1234 5678',
        icon: 'phone',
        color: '#10B981'
      },
      {
        id: 'whatsapp-primary',
        type: ContactType.WHATSAPP,
        title: 'WhatsApp',
        value: '+62 812 3456 7890',
        icon: 'message-circle',
        color: '#25D366'
      },
      {
        id: 'address-primary',
        type: ContactType.ADDRESS,
        title: 'Alamat Toko',
        value: 'Jl. Cihampelas No. 123, Bandung, Jawa Barat 40131',
        icon: 'map-pin',
        color: '#EF4444'
      },
      {
        id: 'facebook-primary',
        type: ContactType.SOCIAL_MEDIA,
        title: 'Facebook',
        value: 'https://facebook.com/perdamistore',
        icon: 'facebook',
        color: '#1877F2'
      },
      {
        id: 'instagram-primary',
        type: ContactType.SOCIAL_MEDIA,
        title: 'Instagram',
        value: 'https://instagram.com/perdamistore',
        icon: 'instagram',
        color: '#E4405F'
      },
      {
        id: 'twitter-primary',
        type: ContactType.SOCIAL_MEDIA,
        title: 'Twitter',
        value: 'https://twitter.com/perdamistore',
        icon: 'twitter',
        color: '#1DA1F2'
      }
    ]

    let createdCount = 0

    for (const contactData of contactInfoData) {
      try {
        await prisma.contactInfo.create({
          data: {
            ...contactData,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
        createdCount++
        console.log(`✅ Created contact: ${contactData.title}`)
      } catch (error) {
        console.error(`❌ Error creating contact "${contactData.title}":`, error)
      }
    }

    console.log(`🎉 Successfully created ${createdCount} contact info records!`)

    // Display summary
    const total = await prisma.contactInfo.count()
    console.log(`📊 Total contact info records: ${total}`)

  } catch (error) {
    console.error('❌ Error creating contact info:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createContactInfo()
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
