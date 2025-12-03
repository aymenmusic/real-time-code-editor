import { Link } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';
import Header from '../components/common/Header';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <div className={`landing-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Header />
      <div className="landing-container">
        <div className="landing-hero">
          <h2>Collaborate, code, and learn together in real-time</h2>
          <p className="landing-subtitle">
            A powerful online code editor with real-time collaboration, instant code execution, and built-in chat functionality.
          </p>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Real-Time Collaboration</h3>
            <p>Code together with your team in real-time, see changes as they happen</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>Instant Code Execution</h3>
            <p>Run your code directly in the browser and see results immediately</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Built-in Chat</h3>
            <p>Discuss your code and share ideas with integrated chat functionality</p>
          </div>
        </div>

        <div className="auth-buttons">
          <Link to="/register" className="auth-button register-button">
            Create Account
          </Link>
          <Link to="/login" className="auth-button login-button">
            Log In
          </Link>
          <Link 
            to="/editor" 
            className="auth-button try-button"
            onClick={() => sessionStorage.setItem('allowGuestAccess', 'true')}
          >
            Try Without Account
          </Link>
        </div>

        <div className="landing-footer">
          <p>Made by Aymen with 🖤</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
