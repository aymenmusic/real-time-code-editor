import { Link } from 'react-router-dom';
import DarkModeToggle from '../Editor/DarkModeToggle';
import LanguageSelector from '../Editor/LanguageSelector';
import { useAuthStore } from '../../store/authStore';
import '../../styles/Header.css';

interface HeaderProps {
  showNavLinks?: boolean;
  isEditorPage?: boolean;
}

const Header = ({ showNavLinks = true, isEditorPage = false }: HeaderProps) => {
  const { isAuthenticated, logout, user } = useAuthStore();
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="logo-link">
          <h1 className="site-logo">Real-Time Code Editor</h1>
        </Link>
        
        <div className="header-right">
          {showNavLinks && (
            <nav className="site-nav">
              {isAuthenticated ? (
                <>
                  {isEditorPage && (
                    <LanguageSelector />
                  )}
                  <span className="nav-link username">
                    {user?.username}
                  </span>
                  {!isEditorPage && (
                    <Link to="/editor" className="nav-link editor-link">
                      Editor
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout} 
                    className="nav-link logout-button"
                  >
                    Log Out
                  </button>
                  {isEditorPage && (
                    <div className="connection-status">
                      <span className="status-indicator connected"></span>
                      <span>Connected</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {isEditorPage && (
                    <LanguageSelector />
                  )}
                  <Link to="/login" className="nav-link">
                    Log In
                  </Link>
                  <Link to="/register" className="nav-link register-link">
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          )}
          
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
