# Jest Testing Strategy & Implementation

This document outlines our comprehensive testing approach for the unified API and Server Actions architecture.

## 🎯 Testing Philosophy

Our testing strategy focuses on **three core layers**:

1. **Validation Layer**: Ensuring data integrity and type safety
2. **Business Logic Layer**: Testing server actions and API functionality
3. **Presentation Layer**: Validating React components and user interactions

Each layer is tested in isolation with appropriate mocking to ensure fast, reliable, and maintainable tests.

## 📁 Test Structure

```
tests/
├── setup/                      # Environment-specific test configurations
│   ├── validation.js          # Node.js setup for validation tests
│   ├── actions.js             # Node.js setup for server action tests
│   └── components.js          # JSDOM setup for React component tests
├── validation/                 # Data validation and schema tests
├── actions/                   # Server action and business logic tests
└── components/                # React component and UI tests
```

## 🧪 Testing Environments

### Environment Isolation Strategy

We use **Jest Projects** to create isolated testing environments:

```javascript
// jest.config.unified.js
module.exports = {
  projects: [
    {
      displayName: 'validation',
      testEnvironment: 'node',           // Pure Node.js for fast execution
      setupFilesAfterEnv: ['<rootDir>/tests/setup/validation.js'],
    },
    {
      displayName: 'actions',
      testEnvironment: 'node',           // Node.js for server-side code
      setupFilesAfterEnv: ['<rootDir>/tests/setup/actions.js'],
    },
    {
      displayName: 'components',
      testEnvironment: 'jsdom',          // Browser-like environment for React
      setupFilesAfterEnv: ['<rootDir>/tests/setup/components.js'],
    },
  ],
}
```

**Why This Approach?**
- ✅ **Fast Execution**: Node.js tests run significantly faster than JSDOM tests
- ✅ **Environment Accuracy**: Each test runs in its appropriate environment
- ✅ **Isolated Dependencies**: Different setups don't interfere with each other
- ✅ **Targeted Testing**: Run specific test suites independently

## 🔍 What We Test

### 1. Validation Layer Tests (`tests/validation/`)

**Purpose**: Ensure data integrity and type safety across the application.

```typescript
// Example: File upload validation
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
      file: createMockFile('large.txt', 'text/plain', 101 * 1024 * 1024),
    }
    const result = fileUploadSchema.safeParse(validData)
    expect(result.success).toBe(false)
  })
})
```

**What We Validate**:
- ✅ **File Upload Constraints**: Size limits, required fields, file types
- ✅ **Form Data Parsing**: FormData to object conversion accuracy
- ✅ **Search Parameters**: Query validation and sanitization
- ✅ **Image Processing**: Image-specific validation rules
- ✅ **Team Context**: Team and project ID validation

**Testing Strategy**:
- **Positive Cases**: Valid data passes validation
- **Boundary Cases**: Edge cases like maximum file sizes
- **Negative Cases**: Invalid data is properly rejected
- **Error Messages**: Validation errors are meaningful and actionable

### 2. Server Action Tests (`tests/actions/`)

**Purpose**: Validate business logic, authentication, and data flow in server actions.

```typescript
// Example: Server action structure test
describe('Server Actions Structure', () => {
  it('should export uploadFileAction function', () => {
    expect(typeof uploadFileAction).toBe('function')
  })

  it('should return proper result structure from uploadFileAction', async () => {
    const formData = new FormData()
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    formData.append('file', file)

    const result = await uploadFileAction(formData)

    expect(result).toHaveProperty('success')
    expect(typeof result.success).toBe('boolean')

    if (result.success) {
      expect(result).toHaveProperty('data')
    } else {
      expect(result).toHaveProperty('error')
    }
  })
})
```

**What We Test**:
- ✅ **Function Exports**: All server actions are properly exported
- ✅ **Return Structures**: Consistent result format across actions
- ✅ **Authentication**: Unauthorized access is properly rejected
- ✅ **Error Handling**: Graceful failure handling and error messages
- ✅ **Service Integration**: Actions properly call underlying services

**Mocking Strategy**:
```typescript
// Mock external dependencies
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(() => Promise.resolve({
    user: { id: 'test-user', email: 'test@example.com' }
  }))
}))

jest.mock('@/lib/services/user-files', () => ({
  userFilesService: {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    // ... other methods
  }
}))
```

### 3. Component Tests (`tests/components/`)

**Purpose**: Ensure UI components render correctly and handle user interactions properly.

```typescript
// Example: Component rendering and state management
describe('FileUploadForm', () => {
  beforeEach(() => {
    // Mock React hooks
    mockUseActionState.mockReturnValue([
      null,      // state
      jest.fn(), // formAction
      false      // isPending
    ])
  })

  it('should render form elements', () => {
    render(<FileUploadForm />)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText(/maximum file size/i)).toBeInTheDocument()
  })

  it('should show loading state', () => {
    mockUseActionState.mockReturnValue([null, jest.fn(), true]) // isPending = true
    render(<FileUploadForm />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Uploading...')
  })
})
```

**What We Test**:
- ✅ **Component Rendering**: Essential elements are present
- ✅ **State Management**: Loading, success, and error states display correctly
- ✅ **User Interactions**: Form submission and user input handling
- ✅ **Props Handling**: Components respond properly to different prop combinations
- ✅ **Accessibility**: Basic ARIA attributes and semantic markup

**React Hook Mocking**:
```typescript
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn(),
  useRef: jest.fn(() => ({ current: null })),
  useEffect: jest.fn(),
}))
```

## 🛠️ Testing Utilities

### Global Test Helpers

Each test environment has access to common utilities:

```javascript
// Available in all test environments
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
```

### Environment-Specific Setup

**Validation Tests**: Minimal Node.js environment for fast execution

**Action Tests**: Node.js with service mocking for business logic testing

**Component Tests**: JSDOM with React Testing Library for UI testing
```javascript
require('@testing-library/jest-dom')  // Extended matchers for DOM assertions
```

## 🚀 Running Tests

### Command Reference

```bash
# Run all tests (recommended for CI/CD)
npm test

# Development workflow - run specific test suites
npm run test:validation   # Fast validation tests
npm run test:actions      # Server action tests
npm run test:components   # UI component tests

# Development tools
npm run test:watch        # Watch mode for active development
npm run test:coverage     # Generate coverage reports
```

### Test Execution Strategy

1. **Development**: Use specific test commands (`test:validation`, etc.) for faster feedback
2. **Pre-commit**: Run `npm test` to ensure all tests pass
3. **CI/CD**: Run `npm test` with coverage reporting
4. **Debugging**: Use `test:watch` for iterative development

## 📊 Test Coverage Goals

Our testing strategy covers:

- ✅ **Business Logic**: 100% of server actions and validation schemas
- ✅ **Error Handling**: All error paths and edge cases
- ✅ **User Interactions**: Critical user flows and form submissions
- ✅ **Integration Points**: Service calls and external API interactions

## 🎯 Benefits of This Approach

### 🚀 **Performance**
- **Fast Feedback**: Validation tests run in ~300ms
- **Parallel Execution**: Different environments run simultaneously
- **Targeted Testing**: Only run relevant tests during development

### 🛡️ **Reliability**
- **Isolated Environments**: No test interference or shared state
- **Comprehensive Mocking**: External dependencies are controlled
- **Consistent Results**: Tests produce predictable outcomes

### 🔧 **Maintainability**
- **Clear Organization**: Easy to find and update relevant tests
- **Reusable Utilities**: Common test helpers reduce duplication
- **Documentation**: Each test clearly describes what it validates

### 🏗️ **Scalability**
- **Environment Separation**: Easy to add new test categories
- **Modular Configuration**: Each project can have specific settings
- **Team Collaboration**: Different developers can work on different test layers

## 📈 Future Enhancements

Potential areas for test expansion:

- **E2E Tests**: Full user workflow testing with Playwright/Cypress
- **Performance Tests**: Load testing for file upload scenarios
- **API Integration Tests**: Real API endpoint testing
- **Visual Regression Tests**: UI consistency validation
- **Security Tests**: Input sanitization and authorization testing

---

This testing strategy ensures our unified API and Server Actions architecture is robust, maintainable, and production-ready! 🎉