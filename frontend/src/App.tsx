import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Shield,
  Plus,
  Edit,
  Trash,
  LogOut,
  Search,
  CheckCircle,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LayoutGrid,
  CalendarCheck,
  Banknote,
  Activity
} from 'lucide-react';
import { api, getAuthUser, type Service, type Booking, type User } from './api';
import FlickerSpinner from './FlickerSpinner';

const formatServiceDuration = (duration: number, unit?: string) => {
  const u = unit || 'minutes';
  if (u === 'minutes') {
    if (duration < 60) return `${duration} mins`;
    const hrs = Math.floor(duration / 60);
    const mins = duration % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
  }
  if (u === 'hours') {
    return `${duration} ${duration === 1 ? 'hour' : 'hours'}`;
  }
  if (u === 'days') {
    return `${duration} working ${duration === 1 ? 'day' : 'days'}`;
  }
  return `${duration} ${u}`;
};

function App() {
  // Theme Management
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Navigation & Auth States
  const [isAdminMode, setIsAdminMode] = useState(() => getAuthUser() !== null);
  const [currentUser, setCurrentUser] = useState<User | null>(getAuthUser());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  // Auth Forms
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // Core Data States
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Notification States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Booking Modal & Forms
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  // Admin Service Modals
  const [serviceModalMode, setServiceModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceDuration, setServiceDuration] = useState(30);
  const [serviceDurationUnit, setServiceDurationUnit] = useState('minutes');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [servicePrice, setServicePrice] = useState(50);
  const [serviceIsActive, setServiceIsActive] = useState(true);

  // Booking Management Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const checkBackendStatus = async () => {
    try {
      await api.services.getAll();
      setIsBackendOnline(true);
    } catch (err) {
      setIsBackendOnline(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  // Lock body scroll when any modal is open to prevent background scroll and scrollbar track leak
  useEffect(() => {
    const isModalOpen =
      showLoginModal ||
      showRegisterModal ||
      showLogoutConfirmModal ||
      serviceModalMode !== null ||
      selectedService !== null;

    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '8px'; // Matches custom scrollbar width to prevent layout shift
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [showLoginModal, showRegisterModal, showLogoutConfirmModal, serviceModalMode, selectedService]);

  // Watch authentication state changes
  useEffect(() => {
    const handleAuthChange = () => {
      const u = getAuthUser();
      setCurrentUser(u);
      if (!u) {
        setIsAdminMode(false);
      } else {
        setIsAdminMode(true);
      }
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  // Fetch Services (Visitor or Admin views)
  const fetchServices = async () => {
    try {
      setLoading(true);
      // Visitors see active only, Admins see all
      const list = await api.services.getAll(!isAdminMode);
      setServices(list);
    } catch (err: any) {
      showError(err.message || 'Failed to load services');
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  // Fetch Bookings (Admin only)
  const fetchBookings = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await api.bookings.getAll({
        page: currentPage,
        limit: 10,
        search: searchQuery,
        status: statusFilter,
      });
      setBookings(res.data);
      setTotalBookings(res.meta.total);
      setTotalPages(res.meta.totalPages);

      // Fetch pending bookings count
      const pendingRes = await api.bookings.getAll({
        page: 1,
        limit: 1,
        status: 'PENDING',
      });
      setPendingBookingsCount(pendingRes.meta.total);
    } catch (err: any) {
      showError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [isAdminMode]);

  useEffect(() => {
    if (isAdminMode && currentUser) {
      fetchBookings();
    }
  }, [isAdminMode, currentUser, currentPage, searchQuery, statusFilter]);

  // Alert Utility Helpers
  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // Auth Submissions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading('login');
      await api.auth.login({ email: loginEmail, password: loginPassword });
      setLoginEmail('');
      setLoginPassword('');
      setShowLoginModal(false);
      setIsAdminMode(true);
      showSuccess('Successfully logged in as administrator');
    } catch (err: any) {
      showError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading('register');
      await api.auth.register({ name: registerName, email: registerEmail, password: registerPassword, role: 'admin' });
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setShowRegisterModal(false);
      showSuccess('Registration successful! Please log in.');
      setShowLoginModal(true);
    } catch (err: any) {
      showError(err.message || 'Registration failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    try {
      setActionLoading('logout');
      await api.auth.logout();
    } catch (err: any) {
      // Force local logout if server call fails (e.g. backend is offline)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authUser');
      window.dispatchEvent(new Event('auth-change'));
    } finally {
      setActionLoading(null);
      showSuccess('Successfully logged out');
    }
  };

  // Customer Booking Submission
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    try {
      setActionLoading('booking');

      // Perform frontend check for past dates
      const [year, month, day] = bookingDate.split('-').map(Number);
      const inputDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (inputDate < today) {
        showError('Booking date cannot be in the past');
        return;
      }

      await api.bookings.create({
        customerName,
        customerEmail,
        customerPhone,
        serviceId: selectedService.id,
        bookingDate,
        bookingTime,
        notes: bookingNotes || undefined,
      });

      // Clear Form
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setBookingDate('');
      setBookingTime('');
      setBookingNotes('');
      setSelectedService(null);

      showSuccess(`Booking successfully requested! Keep the reference for cancellation if needed.`);
    } catch (err: any) {
      showError(err.message || 'Failed to place booking. The slot might already be taken.');
    } finally {
      setActionLoading(null);
    }
  };

  // Admin Service Create/Update Submission
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading('service-save');
      const payload = {
        title: serviceTitle,
        description: serviceDescription,
        duration: Number(serviceDuration),
        durationUnit: serviceDurationUnit,
        price: Number(servicePrice),
        isActive: serviceIsActive,
      };

      if (serviceModalMode === 'create') {
        await api.services.create(payload as any);
        showSuccess('Service created successfully');
      } else if (serviceModalMode === 'edit' && editingServiceId) {
        await api.services.update(editingServiceId, payload);
        showSuccess('Service updated successfully');
      }

      setServiceTitle('');
      setServiceDescription('');
      setServiceDuration(30);
      setServiceDurationUnit('minutes');
      setIsCustomDuration(false);
      setServicePrice(50);
      setServiceIsActive(true);
      setServiceModalMode(null);
      setEditingServiceId(null);
      fetchServices();
    } catch (err: any) {
      showError(err.message || 'Failed to save service');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditServiceClick = (service: Service) => {
    setEditingServiceId(service.id);
    setServiceTitle(service.title);
    setServiceDescription(service.description);
    setServiceDuration(service.duration);
    setServiceDurationUnit(service.durationUnit || 'minutes');
    const isStandard = (service.durationUnit || 'minutes') === 'minutes' && [15, 30, 45, 60, 75, 90, 120, 150, 180, 240].includes(service.duration);
    setIsCustomDuration(!isStandard);
    setServicePrice(Number(service.price));
    setServiceIsActive(service.isActive);
    setServiceModalMode('edit');
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service? Bookings attached to this service will prevent deletion.')) return;
    try {
      setActionLoading(`delete-${id}`);
      await api.services.delete(id);
      showSuccess('Service deleted successfully');
      fetchServices();
    } catch (err: any) {
      showError(err.message || 'Failed to delete service. Check if active bookings are attached to it.');
    } finally {
      setActionLoading(null);
    }
  };

  // Admin Booking actions
  const handleUpdateBookingStatus = async (id: string, newStatus: string) => {
    try {
      setActionLoading(`status-${id}`);
      await api.bookings.updateStatus(id, newStatus);
      showSuccess(`Booking status updated to ${newStatus}`);
      fetchBookings();
    } catch (err: any) {
      showError(err.message || 'Failed to update booking status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      setActionLoading(`cancel-${id}`);
      await api.bookings.cancel(id);
      showSuccess('Booking cancelled successfully');
      if (isAdminMode) {
        fetchBookings();
      }
    } catch (err: any) {
      showError(err.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(null);
    }
  };

  if (isInitializing) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-title)',
        gap: '24px'
      }}>
        <FlickerSpinner size={48} />
        <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-muted)' }}>Loading Platform...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isBackendOnline === false && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          color: 'var(--error)',
          padding: '12px 24px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 600,
          borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          animation: 'fadeIn 0.3s ease-out',
          zIndex: 1001,
          position: 'relative'
        }}>
          <AlertCircle size={16} />
          <span>Connection Error: Failed to fetch database or backend API. Please ensure your local database is running and NestJS is started on port 3000.</span>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* <Calendar className="brand-icon" size={28} strokeWidth={2.5} /> */}
          <img src="./public/calendar.png" alt="EN2H" style={{ width: '48px', height: '48px' }} />
          <span>EN2H <span style={{ color: 'var(--primary)' }}>Booking</span></span>

          <span
            className={`badge ${isBackendOnline === true ? 'badge-completed' : isBackendOnline === false ? 'badge-cancelled' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              backgroundColor: isBackendOnline === null ? 'var(--border-color)' : undefined,
              color: isBackendOnline === null ? 'var(--text-muted)' : undefined,
            }}
          >
            <span className={`status-dot-wrapper ${isBackendOnline === false ? 'status-dot-error' : ''}`} style={{ width: '8px', height: '8px' }}>
              {isBackendOnline !== null && (
                <span className="status-dot-ping animate-ping" style={{ width: '8px', height: '8px', backgroundColor: isBackendOnline === null ? 'var(--text-muted)' : undefined }}></span>
              )}
              <span className="status-dot-core" style={{ width: '8px', height: '8px', backgroundColor: isBackendOnline === null ? 'var(--text-muted)' : undefined }}></span>
            </span>
            {isBackendOnline === true ? 'Live' : isBackendOnline === false ? 'Offline' : 'Connecting...'}
          </span>
        </div>

        <div className="nav-links">
          <button
            className="btn btn-secondary"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {!currentUser && (
            <button
              className="btn btn-secondary"
              onClick={() => setIsAdminMode(!isAdminMode)}
            >
              {isAdminMode ? 'Customer Portal' : 'Admin Panel'}
            </button>
          )}

          {currentUser ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '4px 8px 4px 12px',
              borderRadius: '50px',
              backgroundColor: 'var(--bg-sidebar)',
              border: '1px solid var(--border-color)'
            }}>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=d57e1e&color=fff&bold=true&rounded=true&size=64`}
                alt={currentUser.name}
                style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--primary)' }}
              />
              <span style={{ fontSize: '14px', color: 'var(--text-title)' }}>
                Hi, <strong>{currentUser.name}</strong>
              </span>
              <button
                className="btn btn-danger"
                onClick={() => setShowLogoutConfirmModal(true)}
                style={{
                  padding: '6px',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            isAdminMode && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => setShowLoginModal(true)}>
                  Login
                </button>
                <button className="btn btn-primary" onClick={() => setShowRegisterModal(true)}>
                  Register
                </button>
              </div>
            )
          )}
        </div>
      </header>

      {/* Notifications */}
      {errorMsg && (
        <div className="toast-notification toast-error">
          <AlertCircle size={20} style={{ color: 'var(--error)' }} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="toast-notification toast-success">
          <CheckCircle size={20} style={{ color: 'var(--success)' }} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{successMsg}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="main-content">
        {!isAdminMode ? (
          /* Customer Portal View */
          <div className="fade-in-view" key="customer-portal">
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h1 style={{ marginBottom: '16px', fontWeight: 700 }}>
                Schedule Your Next <span style={{ color: 'var(--primary)' }}>Appointment</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                Select a service below, choose your preferred slot, and submit your request.
                No authentication required for customers.
              </p>
            </div>

            <h2 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Available Services
            </h2>

            {loading ? (
              <div className="spinner-container">
                <FlickerSpinner size={32} />
              </div>
            ) : services.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <AlertCircle size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                <p>No active services available at the moment. Please check back later.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '24px'
              }}>
                {services.map(service => (
                  <div key={service.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
                    <div>
                      <span
                        className="badge badge-completed"
                        style={{ marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span className="status-dot-wrapper" style={{ width: '8px', height: '8px' }}>
                          <span className="status-dot-ping animate-ping" style={{ width: '8px', height: '8px' }}></span>
                          <span className="status-dot-core" style={{ width: '8px', height: '8px' }}></span>
                        </span>
                        Active
                      </span>
                      <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{service.title}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px', minHeight: '60px', lineHeight: '1.5' }}>
                        {service.description}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Duration & Price</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                            <Clock size={14} style={{ color: 'var(--primary)' }} /> {formatServiceDuration(service.duration, service.durationUnit)}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--text-title)', fontSize: '16px' }}>
                            Rs. {Number(service.price).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <button
                        className="btn btn-primary"
                        onClick={() => setSelectedService(service)}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Admin Dashboard View */
          <div className="fade-in-view" key="admin-dashboard">
            {!currentUser ? (
              /* Admin Unauthenticated Splash */
              <div className="card split-card">
                <div className="split-card-image" />
                <div className="split-card-content">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style={{ width: '48px', height: '48px', color: 'var(--primary)', marginBottom: '16px' }}>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                  <h2 style={{ marginBottom: '12px' }}>Admin Dashboard</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '15px', lineHeight: '1.6' }}>
                    Please login or create an account to manage services and review bookings.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', width: '100%' }}>
                    <button className="btn btn-primary" onClick={() => setShowLoginModal(true)} style={{ flex: 1, maxWidth: '150px' }}>
                      Sign In
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowRegisterModal(true)} style={{ flex: 1, maxWidth: '150px' }}>
                      Register
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Admin Authenticated Dashboard Panel */
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-sidebar)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '32px',
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=d57e1e&color=fff&bold=true&rounded=true&size=128`}
                    alt={currentUser.name}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--primary)' }}
                  />
                  <div>
                    <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-title)' }}>Welcome back, {currentUser.name}!</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                      Logged in as <strong style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>{currentUser.role || 'Admin'}</strong> • Database operational
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '32px' }}>Admin Control Center</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                      Monitor customer bookings and modify platform service records.
                    </p>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setServiceModalMode('create');
                      setServiceTitle('');
                      setServiceDescription('');
                      setServiceDuration(30);
                      setServiceDurationUnit('minutes');
                      setIsCustomDuration(false);
                      setServicePrice(50);
                      setServiceIsActive(true);
                    }}
                  >
                    <Plus size={18} /> New Service
                  </button>
                </div>

                {/* Stats Cards Container */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '24px',
                  marginBottom: '40px'
                }}>
                  {/* Card 1: Total Services */}
                  <div className="card" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '24px',
                    position: 'relative',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.05em'
                      }}>TOTAL SERVICES</span>
                      <LayoutGrid size={20} style={{ color: '#3b82f6' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '16px' }}>
                      <span style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-title)' }}>
                        {services.length.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
                        ↑ 12%
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Active Bookings */}
                  <div className="card" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '24px',
                    position: 'relative',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.05em'
                      }}>ACTIVE BOOKINGS</span>
                      <CalendarCheck size={20} style={{ color: '#3b82f6' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '16px' }}>
                      <span style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-title)' }}>
                        {totalBookings.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
                        ↑ 5%
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Monthly Revenue */}
                  <div className="card" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '24px',
                    position: 'relative',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.05em'
                      }}>MONTHLY REVENUE</span>
                      <Banknote size={20} style={{ color: '#3b82f6' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '16px' }}>
                      <span style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-title)' }}>
                        LKR {((totalBookings * 15000 + 45200) / 1000).toFixed(1)}k
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
                        ↑ 8%
                      </span>
                    </div>
                  </div>

                  {/* Card 4: Pending Bookings */}
                  <div className="card" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '24px',
                    position: 'relative',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.05em'
                      }}>PENDING BOOKINGS</span>
                      <Clock size={20} style={{ color: '#3b82f6' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '16px' }}>
                      <span style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-title)' }}>
                        {pendingBookingsCount.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>
                        Needs review
                      </span>
                    </div>
                  </div>
                </div>

                {/* Services Section */}
                <div style={{ marginBottom: '48px' }}>
                  <h2 style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'left' }}>Platform Services ({services.length})</h2>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '20px'
                  }}>
                    {services.map(service => (
                      <div key={service.id} className="card" style={{ textAlign: 'left', position: 'relative' }}>
                        <div style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                          display: 'flex',
                          gap: '8px'
                        }}>
                          <button
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                            onClick={() => handleEditServiceClick(service)}
                          >
                            <Edit size={16} style={{ color: 'var(--text-muted)' }} />
                          </button>
                          <button
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                            onClick={() => handleDeleteService(service.id)}
                          >
                            <Trash size={16} style={{ color: 'var(--error)' }} />
                          </button>
                        </div>

                        <span
                          className={`badge ${service.isActive ? 'badge-completed' : 'badge-cancelled'}`}
                          style={{ marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          {service.isActive && (
                            <span className="status-dot-wrapper" style={{ width: '8px', height: '8px' }}>
                              <span className="status-dot-ping animate-ping" style={{ width: '8px', height: '8px' }}></span>
                              <span className="status-dot-core" style={{ width: '8px', height: '8px' }}></span>
                            </span>
                          )}
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>

                        <h3 style={{ fontSize: '18px', marginBottom: '6px', paddingRight: '40px' }}>{service.title}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', minHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {service.description}
                        </p>

                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-title)' }}>
                          <span><strong>Duration:</strong> {formatServiceDuration(service.duration, service.durationUnit)}</span>
                          <span><strong>Price:</strong> Rs. {Number(service.price).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bookings Section */}
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
                    <h2 style={{ fontSize: '20px', margin: 0, textAlign: 'left' }}>Customer Bookings ({totalBookings})</h2>

                    {/* Filter bar */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          placeholder="Search customer..."
                          className="form-input"
                          style={{ paddingLeft: '36px', width: '200px', height: '40px' }}
                          value={searchQuery}
                          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                      </div>

                      <select
                        className="form-input"
                        style={{ width: '150px', height: '40px', padding: '0 12px' }}
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                      >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {loading ? (
                    <div className="spinner-container">
                      <FlickerSpinner size={32} />
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                      <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                      <p>No bookings match the filters.</p>
                    </div>
                  ) : (
                    <div>
                      <div className="table-container">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Customer</th>
                              <th>Service</th>
                              <th>Appointment</th>
                              <th>Status</th>
                              <th>Notes</th>
                              <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.map(booking => (
                              <tr key={booking.id}>
                                <td>
                                  <div style={{ fontWeight: 600, color: 'var(--text-title)' }}>{booking.customerName}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{booking.customerEmail}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{booking.customerPhone}</div>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 500 }}>{booking.service?.title || 'Unknown Service'}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Rs. {Number(booking.service?.price || 0).toFixed(2)}</div>
                                </td>
                                <td>
                                  <div>{booking.bookingDate}</div>
                                  <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 500, marginTop: '2px' }}>{booking.bookingTime}</div>
                                </td>
                                <td>
                                  <span className={`badge badge-${booking.status.toLowerCase()}`}>
                                    {booking.status}
                                  </span>
                                </td>
                                <td style={{ maxWidth: '200px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                  {booking.notes || '-'}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                    {booking.status === 'PENDING' && (
                                      <button
                                        className="btn btn-secondary"
                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                        onClick={() => handleUpdateBookingStatus(booking.id, 'CONFIRMED')}
                                      >
                                        Confirm
                                      </button>
                                    )}
                                    {booking.status === 'CONFIRMED' && (
                                      <button
                                        className="btn btn-primary"
                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                        onClick={() => handleUpdateBookingStatus(booking.id, 'COMPLETED')}
                                      >
                                        Complete
                                      </button>
                                    )}
                                    {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                                      <button
                                        className="btn btn-danger"
                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                        onClick={() => handleCancelBooking(booking.id)}
                                      >
                                        Cancel
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '8px' }}
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span style={{ fontSize: '14px' }}>Page {currentPage} of {totalPages}</span>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '8px' }}
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', padding: '24px', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
        &copy; {new Date().getFullYear()} EN2H. All rights reserved.
      </footer>

      {/* Visitor Booking Modal */}
      {selectedService && (
        <div className="modal-overlay" onClick={() => setSelectedService(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
              Book {selectedService.title}
            </h2>

            <form onSubmit={handleCreateBooking}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="john@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  placeholder="+1 (555) 019-2834"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time Slot</label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Special Requests (Optional)</label>
                <textarea
                  rows={3}
                  className="form-input"
                  placeholder="Any details you would like us to know..."
                  style={{ resize: 'vertical' }}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedService(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading === 'booking'}>
                  {actionLoading === 'booking' ? 'Booking...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content split-modal" onClick={(e) => e.stopPropagation()}>
            <div className="split-modal-image" />
            <div className="split-modal-form">
              <h2 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
                Admin Login
              </h2>

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="admin@entwoh.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    required
                    className="form-input"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowLoginModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading === 'login'}>
                    {actionLoading === 'login' ? 'Signing In...' : 'Log In'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Register Modal */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-content split-modal" onClick={(e) => e.stopPropagation()}>
            <div className="split-modal-image" />
            <div className="split-modal-form">
              <h2 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
                Create Admin Account
              </h2>

              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Admin User"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="admin@entwoh.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    required
                    className="form-input"
                    placeholder="•••••••• (min 6 characters)"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRegisterModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading === 'register'}>
                    {actionLoading === 'register' ? 'Creating...' : 'Register'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Service Edit/Create Modal */}
      {serviceModalMode && (
        <div className="modal-overlay" onClick={() => setServiceModalMode(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
              {serviceModalMode === 'create' ? 'Create New Service' : 'Modify Service Record'}
            </h2>

            <form onSubmit={handleSaveService}>
              <div className="form-group">
                <label className="form-label">Service Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Hair Styling & Trim"
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  required
                  className="form-input"
                  placeholder="Describe the service offer..."
                  style={{ resize: 'vertical' }}
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Duration Unit</label>
                <select
                  className="form-input"
                  value={serviceDurationUnit}
                  onChange={(e) => {
                    const unit = e.target.value;
                    setServiceDurationUnit(unit);
                    if (unit === 'minutes') {
                      setServiceDuration(30);
                      setIsCustomDuration(false);
                    } else if (unit === 'hours') {
                      setServiceDuration(1);
                      setIsCustomDuration(true);
                    } else if (unit === 'days') {
                      setServiceDuration(1);
                      setIsCustomDuration(true);
                    }
                  }}
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Working Days</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {serviceDurationUnit === 'minutes' ? 'Duration' :
                      serviceDurationUnit === 'hours' ? 'Duration (Hours)' :
                        'Duration (Working Days)'}
                  </label>

                  {serviceDurationUnit === 'minutes' ? (
                    <>
                      <select
                        className="form-input"
                        value={isCustomDuration ? 'custom' : serviceDuration}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'custom') {
                            setIsCustomDuration(true);
                            if ([15, 30, 45, 60, 75, 90, 120, 150, 180, 240].includes(serviceDuration)) {
                              setServiceDuration(30);
                            }
                          } else {
                            setIsCustomDuration(false);
                            setServiceDuration(Number(val));
                          }
                        }}
                        style={{ marginBottom: isCustomDuration ? '10px' : '0' }}
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={75}>1 hour 15 mins</option>
                        <option value={90}>1 hour 30 mins</option>
                        <option value={120}>2 hours</option>
                        <option value={150}>2 hours 30 mins</option>
                        <option value={180}>3 hours</option>
                        <option value={240}>4 hours</option>
                        <option value="custom">Custom duration...</option>
                      </select>

                      {isCustomDuration && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', animation: 'fadeIn 0.2s ease-out' }}>
                          <input
                            type="number"
                            required
                            min={5}
                            className="form-input"
                            placeholder="Minutes"
                            value={serviceDuration}
                            onChange={(e) => setServiceDuration(Number(e.target.value))}
                          />
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>mins</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', animation: 'fadeIn 0.2s ease-out' }}>
                      <input
                        type="number"
                        required
                        min={1}
                        className="form-input"
                        value={serviceDuration}
                        onChange={(e) => setServiceDuration(Number(e.target.value))}
                      />
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {serviceDurationUnit === 'hours' ? 'hours' : 'days'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Price (LKR)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)', fontSize: '15px', fontWeight: 600 }}>Rs.</span>
                    <input
                      type="number"
                      required
                      min={1}
                      step={0.01}
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      value={servicePrice}
                      onChange={(e) => setServicePrice(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={serviceIsActive}
                  onChange={(e) => setServiceIsActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="isActiveCheck" style={{ fontSize: '15px', userSelect: 'none', cursor: 'pointer' }}>
                  Mark service as Active & Available
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setServiceModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading === 'service-save'}>
                  {actionLoading === 'service-save' ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showLogoutConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Confirm Logout</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '15px' }}>
              Are you sure you want to log out of the system?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowLogoutConfirmModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={actionLoading === 'logout'}
                onClick={async () => {
                  await handleLogout();
                  setShowLogoutConfirmModal(false);
                }}
                style={{ flex: 1 }}
              >
                {actionLoading === 'logout' ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Action Loading Overlay */}
      {actionLoading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px 40px',
            gap: '16px',
            textAlign: 'center',
            maxWidth: '320px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            borderRadius: 'var(--radius-md)'
          }}>
            <FlickerSpinner size={40} />
            <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-title)' }}>
              {actionLoading === 'login' && 'Signing In...'}
              {actionLoading === 'register' && 'Creating Account...'}
              {actionLoading === 'logout' && 'Logging Out...'}
              {actionLoading === 'service-save' && 'Saving Service...'}
              {actionLoading === 'booking' && 'Booking Appointment...'}
              {actionLoading.startsWith('status-') && 'Updating Booking Status...'}
              {actionLoading.startsWith('cancel-') && 'Cancelling Booking...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
