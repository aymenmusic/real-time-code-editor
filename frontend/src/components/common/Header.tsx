import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');  // Redirect to landing page after logout
  };
  
  return (
    <header className="site-header">
      <div className="header-container">
        <Link to={isAuthenticated ? "/editor" : "/"} className="logo-link">
          <span className="logo-text">
            <span className="logo-pair">Pair</span><span className="logo-space">Space</span>
          </span>
        </Link>
        
        <div className="header-right">
          {showNavLinks && (
            <nav className="site-nav">
              {isAuthenticated ? (
                <>
                  {isEditorPage && (
                    <LanguageSelector />
                  )}
                  {!isEditorPage && (
                    <Link to="/editor" className="nav-link editor-link">
                      Editor
                    </Link>
                  )}
                </>
              ) : (
                <>
                  {isEditorPage && (
                    <LanguageSelector />
                  )}
                </>
              )}
            </nav>
          )}
          
          <DarkModeToggle />
          
          {showNavLinks && (
            <>
              {isAuthenticated ? (
                <>
                  <span className="nav-link username">
                    {user?.username}
                  </span>
                  <button 
                    onClick={handleLogout} 
                    className="nav-link logout-button"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link login-link">
                    Log In
                  </Link>
                  <Link to="/register" className="nav-link register-link">
                    Sign Up
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
