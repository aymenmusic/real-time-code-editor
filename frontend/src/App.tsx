import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import EditorPage from './components/Editor/EditorPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { useThemeStore } from './store/themeStore'
import { useAuthStore } from './store/authStore'
import { useEffect, useRef, useState } from 'react'

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
              Editor page — accessible to authenticated users OR guests who
              clicked "Try Without Account".  isGuest lives in Zustand..so
              it is fully reactive: the route re-evaluates the moment
              setGuestAccess(true) fires, with no sessionStorage timing risk.
            */}
            <Route 
              path="/editor" 
              element={
                isAuthenticated || isGuest
                  ? <EditorPage /> 
                  : <Navigate to="/" replace />
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
