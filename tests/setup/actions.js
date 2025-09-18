// Setup for server action tests

// Global test utilities for Node environment
global.createMockFile = (name = 'test.txt', type = 'text/plain', size = 1024) => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

global.createMockFormData = (data = {}) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}