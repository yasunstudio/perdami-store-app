// Password utility functions compatible with Edge Runtime

/**
 * Compare a plain text password with a hashed password
 * This function dynamically imports bcryptjs to avoid Edge Runtime issues
 */
export async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    // Dynamic import to avoid Edge Runtime issues during build
    const bcrypt = await import('bcryptjs')
    return await bcrypt.compare(plainPassword, hashedPassword)
  } catch (error) {
    console.error('Password comparison error:', error)
    return false
  }
}

/**
 * Hash a password using bcrypt
 * This function dynamically imports bcryptjs to avoid Edge Runtime issues
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Dynamic import to avoid Edge Runtime issues during build
    const bcrypt = await import('bcryptjs')
    return await bcrypt.hash(password, 12)
  } catch (error) {
    console.error('Password hashing error:', error)
    throw new Error('Failed to hash password')
  }
}