import {
  fileUploadSchema,
  fileDeleteSchema,
  fileSearchSchema,
  imageUploadSchema,
  validateFormData,
} from '@/lib/validation/file-schemas'

describe('File Validation Schemas - Simple Tests', () => {
  describe('fileUploadSchema', () => {
    it('should validate a valid file upload', () => {
      const validData = {
        file: createMockFile('test.txt', 'text/plain', 1024),
        teamId: 'team-123',
        projectId: 'project-456'
      }

      const result = fileUploadSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject files larger than 100MB', () => {
      const invalidData = {
        file: createMockFile('large.txt', 'text/plain', 101 * 1024 * 1024), // 101MB
      }

      const result = fileUploadSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty files', () => {
      const invalidData = {
        file: createMockFile('empty.txt', 'text/plain', 0), // 0 bytes
      }

      const result = fileUploadSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('fileDeleteSchema', () => {
    it('should validate a valid file delete request', () => {
      const validData = {
        fileId: 'file-123',
        teamId: 'team-456',
        isTeamFile: true
      }

      const result = fileDeleteSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require fileId', () => {
      const invalidData = {
        teamId: 'team-456'
      }

      const result = fileDeleteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('fileSearchSchema', () => {
    it('should validate a valid search request', () => {
      const validData = {
        query: 'test search',
        teamId: 'team-123'
      }

      const result = fileSearchSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require search query', () => {
      const invalidData = {
        teamId: 'team-123'
      }

      const result = fileSearchSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('imageUploadSchema', () => {
    it('should validate valid image files', () => {
      const validData = {
        images: [
          createMockFile('image1.jpg', 'image/jpeg', 1024),
          createMockFile('image2.png', 'image/png', 2048)
        ]
      }

      const result = imageUploadSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require at least one image', () => {
      const invalidData = {
        images: []
      }

      const result = imageUploadSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('validateFormData helper', () => {
    it('should validate form data successfully', () => {
      const formData = createMockFormData({
        query: 'test search',
        teamId: 'team-123'
      })

      const result = validateFormData(fileSearchSchema, formData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.query).toBe('test search')
        expect(result.data.teamId).toBe('team-123')
      }
    })

    it('should return validation error for invalid data', () => {
      const formData = createMockFormData({
        // Missing required query field
        teamId: 'team-123'
      })

      const result = validateFormData(fileSearchSchema, formData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(typeof result.error).toBe('string')
        expect(result.error.length).toBeGreaterThan(0)
      }
    })
  })
})