import { useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* Backdrop — closes menu on outside tap */}
      {menuOpen && <div className="menu-backdrop" onClick={closeMenu} />}

      <header className="site-header">
        <div className="header-container">
          {/* Logo */}
          <Link to={isAuthenticated ? '/editor' : '/'} className="logo-link" onClick={closeMenu}>
            <span className="logo-text">
              <span className="logo-pair">Pair</span><span className="logo-space">Space</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="header-right desktop-nav">
            {showNavLinks && (
              <nav className="site-nav">
                {isAuthenticated ? (
                  <>
                    {isEditorPage && <LanguageSelector />}
                    {!isEditorPage && (
                      <Link to="/editor" className="nav-link editor-link">Editor</Link>
                    )}
                  </>
                ) : (
                  <>
                    {isEditorPage && <LanguageSelector />}
                  </>
                )}
              </nav>
            )}

            <DarkModeToggle />

            {showNavLinks && (
              <>
                {isAuthenticated ? (
                  <>
                    <span className="nav-link username">{user?.username}</span>
                    <button onClick={handleLogout} className="nav-link logout-button">
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="nav-link login-link">Log In</Link>
                    <Link to="/register" className="nav-link register-link">Sign Up</Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile: dark mode toggle + hamburger */}
          <div className="mobile-header-right">
            <DarkModeToggle />
            <button
              className={`hamburger${menuOpen ? ' open' : ''}`}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* Mobile dropdown — inside header so it drops from position:absolute */}
        <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
          {showNavLinks && isEditorPage && (
            <div className="mobile-menu-item">
              <LanguageSelector />
            </div>
          )}

          {showNavLinks && isAuthenticated && !isEditorPage && (
            <Link to="/editor" className="mobile-menu-link" onClick={closeMenu}>
              Editor
            </Link>
          )}

          {showNavLinks && (
            <>
              {isAuthenticated ? (
                <>
                  <span className="mobile-menu-username">{user?.username}</span>
                  <button onClick={handleLogout} className="mobile-menu-logout">
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="mobile-menu-link" onClick={closeMenu}>
                    Log In
                  </Link>
                  <Link to="/register" className="mobile-menu-link mobile-menu-register" onClick={closeMenu}>
                    Sign Up
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
