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
  Moon
} from 'lucide-react';
import { api, getAuthUser, type Service, type Booking, type User } from './api';

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
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(getAuthUser());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

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
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  // Watch authentication state changes
  useEffect(() => {
    const handleAuthChange = () => {
      const u = getAuthUser();
      setCurrentUser(u);
      if (!u) {
        setIsAdminMode(false);
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
      await api.auth.register({ name: registerName, email: registerEmail, password: registerPassword });
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
      await api.auth.logout();
      showSuccess('Logged out successfully');
    } catch (err: any) {
      showError('Logout failed');
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

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Calendar className="brand-icon" size={28} strokeWidth={2.5} />
          <span>EN2H <span style={{ color: 'var(--primary)' }}>Booking</span></span>
          
          <span 
            className="badge badge-completed" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '2px 8px', 
              fontSize: '11px', 
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            <span className="status-dot-wrapper" style={{ width: '8px', height: '8px' }}>
              <span className="status-dot-ping animate-ping" style={{ width: '8px', height: '8px' }}></span>
              <span className="status-dot-core" style={{ width: '8px', height: '8px' }}></span>
            </span>
            Live
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

          <button
            className="btn btn-secondary"
            onClick={() => setIsAdminMode(!isAdminMode)}
          >
            {isAdminMode ? 'Customer Portal' : 'Admin Panel'}
          </button>

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Hi, <strong>{currentUser.name}</strong>
              </span>
              <button className="btn btn-danger" onClick={handleLogout} style={{ padding: '8px 12px' }}>
                <LogOut size={16} />
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
          <div>
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
                <div className="spinner"></div>
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
          <div>
            {!currentUser ? (
              /* Admin Unauthenticated Splash */
              <div className="card" style={{ maxWidth: '450px', margin: '40px auto', textAlign: 'center', padding: '40px' }}>
                <Shield size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                <h2 style={{ marginBottom: '12px' }}>Admin Dashboard</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '15px' }}>
                  Please login or create an account to manage services and review bookings.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={() => setShowLoginModal(true)}>
                    Sign In
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowRegisterModal(true)}>
                    Register
                  </button>
                </div>
              </div>
            ) : (
              /* Admin Authenticated Dashboard Panel */
              <div>
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
                      <div className="spinner"></div>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
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
      )}

      {/* Admin Register Modal */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
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
    </div>
  );
}

export default App;
