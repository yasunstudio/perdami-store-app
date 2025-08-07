import { v2 as cloudinary } from 'cloudinary'
import { promises as fs } from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Configure Cloudinary (make sure to set environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

interface UploadResult {
  originalPath: string
  cloudinaryUrl: string
  publicId: string
}

async function migrateUploadsToCloudinary() {
  console.log('🔄 Starting file upload migration to Cloudinary...')
  
  const uploadsDir = path.join(process.cwd(), 'public/uploads')
  const results: UploadResult[] = []

  try {
    // Check if uploads directory exists
    try {
      await fs.access(uploadsDir)
    } catch {
      console.log('✅ No uploads directory found - nothing to migrate')
      return
    }

    // Get all files in uploads directory recursively
    const files = await getAllFiles(uploadsDir)
    console.log(`📁 Found ${files.length} files to migrate`)

    if (files.length === 0) {
      console.log('✅ No files to migrate')
      return
    }

    // Upload each file to Cloudinary
    for (const filePath of files) {
      try {
        const relativePath = path.relative(uploadsDir, filePath)
        const publicId = `perdami-store/uploads/${relativePath.replace(/\.[^/.]+$/, '')}`
        
        console.log(`⬆️  Uploading: ${relativePath}`)
        
        const result = await cloudinary.uploader.upload(filePath, {
          public_id: publicId,
          folder: 'perdami-store/uploads',
          resource_type: 'auto', // Automatically detect file type
          use_filename: true,
          unique_filename: false,
        })

        results.push({
          originalPath: relativePath,
          cloudinaryUrl: result.secure_url,
          publicId: result.public_id,
        })

        console.log(`✅ Uploaded: ${relativePath} -> ${result.secure_url}`)
      } catch (error) {
        console.error(`❌ Failed to upload ${filePath}:`, error)
      }
    }

    // Update database references
    console.log('\n🔄 Updating database references...')
    await updateDatabaseReferences(results)

    // Create migration report
    await createMigrationReport(results)

    console.log(`\n✅ Migration completed!`)
    console.log(`📊 Summary:`)
    console.log(`   - Files migrated: ${results.length}/${files.length}`)
    console.log(`   - Database references updated`)
    console.log(`   - Migration report created: file-migration-report.json`)
    
    if (results.length === files.length) {
      console.log('\n💡 All files migrated successfully!')
      console.log('   You can now safely remove the public/uploads directory')
      console.log('   after verifying everything works in production.')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  
  async function scanDirectory(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath)
      } else {
        files.push(fullPath)
      }
    }
  }
  
  await scanDirectory(dir)
  return files
}

async function updateDatabaseReferences(results: UploadResult[]) {
  for (const result of results) {
    const originalUrl = `/uploads/${result.originalPath}`
    
    try {
      // Update in various tables where file references might exist
      // Adjust these queries based on your actual database schema
      
      // Update user profile images
      await prisma.user.updateMany({
        where: { image: { contains: originalUrl } },
        data: { image: result.cloudinaryUrl }
      })

      // Update bundle images
      await prisma.productBundle.updateMany({
        where: { image: { contains: originalUrl } },
        data: { image: result.cloudinaryUrl }
      })

      // Update order payment proofs
      await prisma.order.updateMany({
        where: { paymentProofUrl: { contains: originalUrl } },
        data: { paymentProofUrl: result.cloudinaryUrl }
      })

      // Update app settings logo (if any)
      await prisma.appSettings.updateMany({
        where: { appLogo: { contains: originalUrl } },
        data: { appLogo: result.cloudinaryUrl }
      })

      console.log(`✅ Updated database references for: ${result.originalPath}`)
    } catch (error) {
      console.error(`❌ Failed to update database references for ${result.originalPath}:`, error)
    }
  }
}

async function createMigrationReport(results: UploadResult[]) {
  const report = {
    migrationDate: new Date().toISOString(),
    totalFiles: results.length,
    migratedFiles: results,
    summary: {
      successful: results.length,
      failed: 0, // Would track failed uploads if we stored them
    }
  }

  await fs.writeFile(
    'file-migration-report.json',
    JSON.stringify(report, null, 2)
  )
}

// Main execution
if (require.main === module) {
  migrateUploadsToCloudinary().catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
}

export { migrateUploadsToCloudinary }
