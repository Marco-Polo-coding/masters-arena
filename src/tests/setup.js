/**
 * Test Setup - Configuración global para tests de frontend
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock de Web APIs que podrían no estar disponibles en el entorno de test
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock de AudioContext
global.AudioContext = vi.fn(() => ({
  createBufferSource: vi.fn(),
  createGain: vi.fn(),
  destination: {},
}))

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock de sessionStorage
global.sessionStorage = localStorageMock

// Mock console methods para tests más limpios
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
}

// Mock de fetch
global.fetch = vi.fn()

// Mock de URL para audio files
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
