// Holonic Travel Planner - Main React Application
// Advanced holonic architecture with intelligent orchestration

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './polyfills'; // Import polyfills for Webpack 5 compatibility

// Component imports
import SearchInterface from './components/SearchInterface';
import TravelResults from './components/TravelResults';
import BookingInterface from './components/BookingInterface';
import UserProfile from './components/UserProfile';
import SystemStatus from './components/SystemStatus';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import NotificationCenter from './components/NotificationCenter';

// Utility imports
import { HolonicAPIClient } from './utils/holonic-api-client';
import { StateManager } from './utils/state-manager';
import { EventBus } from './utils/event-bus';
import { StorageManager } from './utils/storage-manager';
import { ThemeManager } from './utils/theme-manager';
import { AnalyticsManager } from './utils/analytics-manager';

// Styles
import './styles/App.css';
import './styles/themes.css';

// Initialize managers
const apiClient = new HolonicAPIClient();
const stateManager = new StateManager();
const eventBus = new EventBus();
const storageManager = new StorageManager();
const themeManager = new ThemeManager();
const analyticsManager = new AnalyticsManager();

function App() {
    // Core application state
    const [currentView, setCurrentView] = useState('search');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [systemStatus, setSystemStatus] = useState('initializing');
    
    // User and session state
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [sessionData, setSessionData] = useState({});
    
    // Travel planning state
    const [searchCriteria, setSearchCriteria] = useState({
        origin: '',
        destination: '',
        departureDate: '',
        returnDate: '',
        travelers: 1,
        preferences: {}
    });
    const [searchResults, setSearchResults] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [bookingData, setBookingData] = useState(null);
    
    // UI state
    const [theme, setTheme] = useState('light');
    const [notifications, setNotifications] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Initialize application
    useEffect(() => {
        initializeApplication();
        
        // Cleanup on unmount
        return () => {
            eventBus.removeAllListeners();
            analyticsManager.flush();
        };
    }, []);
    
    // System status monitoring
    useEffect(() => {
        const checkSystemStatus = async () => {
            try {
                const status = await apiClient.getSystemHealth();
                setSystemStatus(status.status);
            } catch (error) {
                console.error('System status check failed:', error);
                setSystemStatus('error');
            }
        };
        
        checkSystemStatus();
        const statusInterval = setInterval(checkSystemStatus, 30000); // Check every 30 seconds
        
        return () => clearInterval(statusInterval);
    }, []);
    
    // Event bus listeners
    useEffect(() => {
        // Navigation events
        eventBus.on('navigate', handleNavigation);
        eventBus.on('search', handleSearch);
        eventBus.on('book', handleBooking);
        
        // User events
        eventBus.on('user:login', handleUserLogin);
        eventBus.on('user:logout', handleUserLogout);
        
        // System events
        eventBus.on('error', handleError);
        eventBus.on('notification', handleNotification);
        
        // Theme events
        eventBus.on('theme:change', handleThemeChange);
        
        return () => {
            eventBus.off('navigate', handleNavigation);
            eventBus.off('search', handleSearch);
            eventBus.off('book', handleBooking);
            eventBus.off('user:login', handleUserLogin);
            eventBus.off('user:logout', handleUserLogout);
            eventBus.off('error', handleError);
            eventBus.off('notification', handleNotification);
            eventBus.off('theme:change', handleThemeChange);
        };
    }, []);
    
    // Initialize application systems
    const initializeApplication = async () => {
        try {
            setIsLoading(true);
            
            // Initialize storage and retrieve saved data
            await storageManager.initialize();
            const savedUser = await storageManager.getItem('user');
            const savedTheme = await storageManager.getItem('theme') || 'light';
            const savedSession = await storageManager.getItem('session') || {};
            
            // Initialize theme
            themeManager.setTheme(savedTheme);
            setTheme(savedTheme);
            
            // Initialize user session
            if (savedUser) {
                setUser(savedUser);
                setIsAuthenticated(true);
                setSessionData(savedSession);
            }
            
            // Initialize analytics
            await analyticsManager.initialize({
                userId: savedUser?.id,
                sessionId: savedSession.id
            });
            
            // Track application start
            analyticsManager.track('app:initialized', {
                theme: savedTheme,
                hasUser: !!savedUser
            });
            
            setSystemStatus('ready');
        } catch (error) {
            console.error('Application initialization failed:', error);
            setError('Failed to initialize application');
            setSystemStatus('error');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Event handlers
    const handleNavigation = useCallback((view) => {
        setCurrentView(view);
        analyticsManager.track('navigation', { view });
    }, []);
    
    const handleSearch = useCallback(async (criteria) => {
        try {
            setIsLoading(true);
            setError(null);
            setSearchCriteria(criteria);
            
            analyticsManager.track('search:initiated', criteria);
            
            const results = await apiClient.searchTravel(criteria);
            setSearchResults(results);
            setCurrentView('results');
            
            analyticsManager.track('search:completed', {
                resultsCount: results?.length || 0,
                criteria
            });
        } catch (error) {
            console.error('Search failed:', error);
            setError('Search failed. Please try again.');
            analyticsManager.track('search:failed', { error: error.message, criteria });
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const handleBooking = useCallback(async (bookingDetails) => {
        try {
            setIsLoading(true);
            setError(null);
            
            analyticsManager.track('booking:initiated', bookingDetails);
            
            const booking = await apiClient.createBooking(bookingDetails);
            setBookingData(booking);
            setCurrentView('booking');
            
            analyticsManager.track('booking:completed', {
                bookingId: booking.id,
                amount: booking.totalAmount
            });
            
            // Show success notification
            handleNotification({
                type: 'success',
                message: 'Booking created successfully!',
                duration: 5000
            });
        } catch (error) {
            console.error('Booking failed:', error);
            setError('Booking failed. Please try again.');
            analyticsManager.track('booking:failed', { error: error.message });
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const handleUserLogin = useCallback(async (userData) => {
        setUser(userData);
        setIsAuthenticated(true);
        await storageManager.setItem('user', userData);
        
        analyticsManager.setUserId(userData.id);
        analyticsManager.track('user:login', { userId: userData.id });
    }, []);
    
    const handleUserLogout = useCallback(async () => {
        setUser(null);
        setIsAuthenticated(false);
        setSessionData({});
        
        await storageManager.removeItem('user');
        await storageManager.removeItem('session');
        
        analyticsManager.track('user:logout');
        analyticsManager.reset();
        
        setCurrentView('search');
    }, []);
    
    const handleError = useCallback((error) => {
        setError(error.message || 'An unexpected error occurred');
        analyticsManager.track('error', {
            message: error.message,
            stack: error.stack,
            view: currentView
        });
    }, [currentView]);
    
    const handleNotification = useCallback((notification) => {
        const id = Date.now().toString();
        const newNotification = { ...notification, id };
        
        setNotifications(prev => [...prev, newNotification]);
        
        // Auto-remove notification after duration
        if (notification.duration) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, notification.duration);
        }
    }, []);
    
    const handleThemeChange = useCallback(async (newTheme) => {
        setTheme(newTheme);
        themeManager.setTheme(newTheme);
        await storageManager.setItem('theme', newTheme);
        
        analyticsManager.track('theme:changed', { theme: newTheme });
    }, []);
    
    // Computed values
    const appClasses = useMemo(() => {
        return [
            'holonic-travel-app',
            `theme-${theme}`,
            `view-${currentView}`,
            systemStatus !== 'ready' ? 'system-not-ready' : '',
            sidebarOpen ? 'sidebar-open' : '',
            isLoading ? 'loading' : ''
        ].filter(Boolean).join(' ');
    }, [theme, currentView, systemStatus, sidebarOpen, isLoading]);
    
    // Render current view
    const renderCurrentView = () => {
        switch (currentView) {
            case 'search':
                return (
                    <SearchInterface
                        onSearch={handleSearch}
                        initialCriteria={searchCriteria}
                        isLoading={isLoading}
                    />
                );
            case 'results':
                return (
                    <TravelResults
                        results={searchResults}
                        onSelect={setSelectedOptions}
                        onBook={handleBooking}
                        isLoading={isLoading}
                    />
                );
            case 'booking':
                return (
                    <BookingInterface
                        bookingData={bookingData}
                        user={user}
                        onComplete={() => setCurrentView('profile')}
                        isLoading={isLoading}
                    />
                );
            case 'profile':
                return (
                    <UserProfile
                        user={user}
                        onUpdate={setUser}
                        isLoading={isLoading}
                    />
                );
            default:
                return (
                    <div className="error-view">
                        <h2>View not found</h2>
                        <button onClick={() => setCurrentView('search')}>
                            Return to Search
                        </button>
                    </div>
                );
        }
    };
    
    return (
        <ErrorBoundary>
            <div className={appClasses}>
                {/* System Status Bar */}
                <SystemStatus 
                    status={systemStatus}
                    onRefresh={() => window.location.reload()}
                />
                
                {/* Main Application Content */}
                <main className="app-main">
                    {isLoading && <LoadingSpinner />}
                    
                    {error && (
                        <div className="error-banner">
                            <span>{error}</span>
                            <button onClick={() => setError(null)}>×</button>
                        </div>
                    )}
                    
                    {renderCurrentView()}
                </main>
                
                {/* Notification Center */}
                <NotificationCenter
                    notifications={notifications}
                    onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
                />
            </div>
        </ErrorBoundary>
    );
}

export default App;