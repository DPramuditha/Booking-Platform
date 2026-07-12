import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { api, getAuthUser } from './api';

// Mock the API layer
vi.mock('./api', () => {
  return {
    getAuthUser: vi.fn().mockReturnValue(null),
    setAuthUser: vi.fn(),
    getAuthToken: vi.fn().mockReturnValue(null),
    setAuthToken: vi.fn(),
    getRefreshToken: vi.fn().mockReturnValue(null),
    setRefreshToken: vi.fn(),
    api: {
      auth: {
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
      },
      services: {
        getAll: vi.fn(),
        getById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      bookings: {
        create: vi.fn(),
        getAll: vi.fn(),
        getById: vi.fn(),
        updateStatus: vi.fn(),
        cancel: vi.fn(),
      },
    },
  };
});

const mockServices = [
  {
    id: 'service-1',
    title: 'Consultation Session',
    description: 'A 30-minute consultation session.',
    duration: 30,
    durationUnit: 'minutes',
    price: 1500,
    isActive: true,
  },
  {
    id: 'service-2',
    title: 'Development Workshop',
    description: 'A 2-hour technical development workshop.',
    duration: 120,
    durationUnit: 'minutes',
    price: 5000,
    isActive: true,
  },
];

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks
    vi.mocked(getAuthUser).mockReturnValue(null);
    vi.mocked(api.services.getAll).mockResolvedValue(mockServices);
  });

  it('renders customer portal view with main headings', async () => {
    render(<App />);

    // Wait for services to load (initialization finishes)
    await screen.findByText('Consultation Session');

    // Verify main customer titles are visible
    expect(screen.getByText(/Schedule Your Next/i)).toBeInTheDocument();
    expect(screen.getByText(/Appointment/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Select a service below, choose your preferred slot, and submit your request/i)
    ).toBeInTheDocument();
  });

  it('fetches and renders available services from the API', async () => {
    render(<App />);

    // Loader is initially active, then services should render
    await waitFor(() => {
      expect(screen.getByText('Consultation Session')).toBeInTheDocument();
      expect(screen.getByText('Development Workshop')).toBeInTheDocument();
    });

    // Check price and duration format
    expect(screen.getByText('Rs. 1500.00')).toBeInTheDocument();
    expect(screen.getByText('Rs. 5000.00')).toBeInTheDocument();
    expect(screen.getByText('30 mins')).toBeInTheDocument();
    expect(screen.getByText('2 hours')).toBeInTheDocument();
  });

  it('toggles body light-theme class when theme button is clicked', async () => {
    // Clean up document body classes
    document.body.className = '';
    localStorage.removeItem('theme');

    render(<App />);

    // Wait for services to load (initialization finishes)
    await screen.findByText('Consultation Session');

    // Find switch theme button (has title "Switch to Light Mode" since theme defaults to dark)
    const toggleBtn = screen.getByTitle('Switch to Light Mode');
    expect(toggleBtn).toBeInTheDocument();

    // Click to switch to light theme
    fireEvent.click(toggleBtn);
    expect(document.body.className).toContain('light-theme');
    expect(localStorage.getItem('theme')).toBe('light');

    // Click again to switch back to dark theme
    fireEvent.click(screen.getByTitle('Switch to Dark Mode'));
    expect(document.body.className).toContain('dark-theme');
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
