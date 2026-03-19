import AWS from 'aws-sdk'
import dotenv from 'dotenv'

dotenv.config()

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'eu-west-2'
})

interface UploadResponse {
  url: string
  key: string
  bucket: string
}

/**
 * Upload file to AWS S3
 */
export const uploadToS3 = async (
  file: any,
  folderPath: string = 'ram-photos'
): Promise<UploadResponse> => {
  if (!file) {
    throw new Error('No file provided')
  }

  const bucket = process.env.AWS_S3_BUCKET
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET not configured')
  }

  // Generate unique key
  const timestamp = Date.now()
  const fileExtension = file.originalname.split('.').pop()
  const key = `${folderPath}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`

  const params = {
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
    Metadata: {
      'uploaded-at': new Date().toISOString()
    }
  }

  try {
    const data = await s3.upload(params).promise()
    return {
      url: data.Location,
      key: data.Key,
      bucket: data.Bucket
    }
  } catch (error: any) {
    console.error('S3 upload error:', error)
    throw new Error(`Failed to upload to S3: ${error.message}`)
  }
}

/**
 * Delete file from S3
 */
export const deleteFromS3 = async (key: string): Promise<void> => {
  const bucket = process.env.AWS_S3_BUCKET
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET not configured')
  }

  const params = {
    Bucket: bucket,
    Key: key
  }

  try {
    await s3.deleteObject(params).promise()
  } catch (error: any) {
    console.error('S3 delete error:', error)
    throw new Error(`Failed to delete from S3: ${error.message}`)
  }
}

/**
 * Generate signed URL for temporary access
 */
export const getSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  const bucket = process.env.AWS_S3_BUCKET
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET not configured')
  }

  const params = {
    Bucket: bucket,
    Key: key,
    Expires: expiresIn
  }

  try {
    return await s3.getSignedUrlPromise('getObject', params)
  } catch (error: any) {
    console.error('S3 signed URL error:', error)
    throw new Error(`Failed to generate signed URL: ${error.message}`)
  }
}

/**
 * Compress and optimize image before upload
 * Note: This is a placeholder - use sharp library for actual image compression
 */
export const optimizeImage = async (file: any): Promise<Buffer> => {
  // In production, use 'sharp' npm package to:
  // - Resize large images
  // - Convert to optimized format (WebP)
  // - Reduce file size
  // For now, return buffer as-is
  return file.buffer
}
