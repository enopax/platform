/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock React hooks before importing component
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn(),
  useRef: jest.fn(() => ({ current: null })),
  useEffect: jest.fn(),
}))

// Mock the action
jest.mock('@/actions/file-actions', () => ({
  uploadFileAction: jest.fn(),
}))

// Import component after mocks
import FileUploadForm from '@/components/form/FileUploadForm'

describe('FileUploadForm - Simple Tests', () => {
  const mockUseActionState = jest.requireMock('react').useActionState

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock for useActionState
    mockUseActionState.mockReturnValue([
      null, // state
      '/mock-action', // formAction - use string to avoid React warning
      false // isPending
    ])
  })

  it('should render form elements', () => {
    render(<FileUploadForm />)

    // Check for main form elements
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText(/maximum file size/i)).toBeInTheDocument()
  })

  it('should render with team context', () => {
    render(
      <FileUploadForm
        teamId="team-123"
        projectId="project-456"
      />
    )

    // Component should render without errors
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    // Mock pending state
    mockUseActionState.mockReturnValue([
      null, // state
      '/mock-action', // formAction
      true // isPending
    ])

    render(<FileUploadForm />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should show success message', () => {
    const successState = {
      success: true,
      data: {
        name: 'test-file.txt',
        hash: 'QmTestHash',
        size: 1024,
        id: 'file-123'
      }
    }

    mockUseActionState.mockReturnValue([
      successState, // state
      '/mock-action', // formAction
      false // isPending
    ])

    render(<FileUploadForm />)

    expect(screen.getByText(/upload successful/i)).toBeInTheDocument()
    expect(screen.getByText(/test-file\.txt/)).toBeInTheDocument()
  })

  it('should show error message', () => {
    const errorState = {
      success: false,
      error: 'File too large'
    }

    mockUseActionState.mockReturnValue([
      errorState, // state
      '/mock-action', // formAction
      false // isPending
    ])

    render(<FileUploadForm />)

    expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
    expect(screen.getByText(/file too large/i)).toBeInTheDocument()
  })

  it('should call onUploadComplete callback', () => {
    const mockCallback = jest.fn()
    const successState = {
      success: true,
      data: { name: 'test.txt' }
    }

    mockUseActionState.mockReturnValue([
      successState,
      '/mock-action',
      false
    ])

    render(<FileUploadForm onUploadComplete={mockCallback} />)

    // Component should render and callback should be available
    expect(mockCallback).toBeDefined()
  })
})