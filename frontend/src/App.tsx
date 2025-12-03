import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import EditorPage from './components/Editor/EditorPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { useThemeStore } from './store/themeStore'
import { useAuthStore } from './store/authStore'
import { useEffect, useState } from 'react'

function App() {
  const { isDarkMode } = useThemeStore();
  const { fetchUserData, token } = useAuthStore();
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  
  // Fetch user data on app load if token exists
  useEffect(() => {
    // Only validate if we have a token in storage
    if (token) {
      setIsValidatingToken(true);
      fetchUserData().finally(() => {
        setIsValidatingToken(false);
      });
    }
  }, []); // Empty deps - only run once on mount
  
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
  
  const { isAuthenticated } = useAuthStore();

  // Show loading screen while validating token
  if (isValidatingToken) {
    return (
      <div className={`app ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
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
          <p style={{ color: '#1e293b', fontSize: '0.875rem' }}>
            Connecting to server...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Router>
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
          {/* Editor page - accessible to authenticated users or guest users who clicked "Try Without Account" */}
          <Route 
            path="/editor" 
            element={
              isAuthenticated || sessionStorage.getItem('allowGuestAccess') === 'true' 
                ? <EditorPage /> 
                : <Navigate to="/" replace />
            } 
          />
          
          {/* Catch-all route - redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
