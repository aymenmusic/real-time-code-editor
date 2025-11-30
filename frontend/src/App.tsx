import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import EditorPage from './components/Editor/EditorPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { useThemeStore } from './store/themeStore'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

function App() {
  const { isDarkMode } = useThemeStore();
  const { fetchUserData } = useAuthStore();
  
  // Fetch user data on app load if token exists
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  
  const { isAuthenticated } = useAuthStore();

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
          {/* Editor page - accessible to all, but works best when authenticated */}
          <Route path="/editor" element={<EditorPage />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
