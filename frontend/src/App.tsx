import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import EditorPage from './components/Editor/EditorPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AnalyticsPage from './pages/AnalyticsPage'
import { useThemeStore } from './store/themeStore'
import { useAuthStore } from './store/authStore'
import { useEffect, useRef, useState } from 'react'

/**
 * Wraps a route element and redirects unauthenticated, non-guest visitors
 * to /login, preserving the intended destination in router state so the
 * login page can bounce them back to the room after they sign in.
 */
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isGuest } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated && !isGuest) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  const { isDarkMode } = useThemeStore();
  const { fetchUserData, token, isAuthenticated, isGuest } = useAuthStore();
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  // Prevent StrictMode's double-invocation from launching two concurrent fetchUserData calls
  const hasValidated = useRef(false);
  
  // Fetch user data on app load if token exists
  useEffect(() => {
    if (hasValidated.current) return;
    hasValidated.current = true;

    if (token) {
      setIsValidatingToken(true);
      fetchUserData().finally(() => {
        setIsValidatingToken(false);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Sync dark/light class to <html> so body's background-color CSS variable
  // resolves correctly when content scrolls past the .app container boundary.
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
    } else {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Prevent default browser save dialog when pressing CTRL+S or CMD+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Loading screen content (shown inside the Router so it stays mounted)
  const loadingScreen = (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #2563eb',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontSize: '0.875rem' }}>
        Connecting to server...
      </p>
    </div>
  );

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/*
        Keep <Router> always mounted so React Router tracks the URL
        correctly across the token-validation loading phase.
        The loading screen is rendered inside the Router instead of
        replacing the whole tree — this prevents the "Router remounts at
        /editor with no guest flag → redirect to /" race condition.
      */}
      <Router>
        {isValidatingToken ? loadingScreen : (
          <Routes>
            {/* Redirect logged-in users from landing to editor */}
            <Route 
              path="/" 
              element={isAuthenticated ? <Navigate to="/editor" replace /> : <LandingPage />} 
            />
            {/* Redirect logged-in users from login/register to editor */}
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/editor" replace /> : <LoginPage />} 
            />
            <Route 
              path="/register" 
              element={isAuthenticated ? <Navigate to="/editor" replace /> : <RegisterPage />} 
            />
            {/*
              /editor (no room ID) → generate a fresh room ID and redirect.
              This is the "create new room" entry point used by the landing
              page and the authenticated-user redirect.
            */}
            <Route
              path="/editor"
              element={
                isAuthenticated || isGuest
                  ? <Navigate to={`/editor/${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`} replace />
                  : <Navigate to="/" replace />
              }
            />

            {/*
              /editor/:roomId — join a specific collaborative room.
              RequireAuth redirects unauthenticated visitors to /login while
              preserving this URL in router state so the login page can send
              them straight back to the room after signing in.
            */}
            <Route
              path="/editor/:roomId"
              element={
                <RequireAuth>
                  <EditorPage />
                </RequireAuth>
              }
            />
            
            {/* Analytics dashboard — authenticated only */}
            <Route
              path="/analytics"
              element={
                <RequireAuth>
                  <AnalyticsPage />
                </RequireAuth>
              }
            />

            {/* Catch-all route - redirect to landing page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Router>
    </div>
  )
}

export default App
