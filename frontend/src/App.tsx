import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import EditorPage from './components/Editor/EditorPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProtectedRoute from './components/common/ProtectedRoute'
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
  
  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/editor" element={<EditorPage />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
