import { useState } from 'react';
import { Link } from 'react-router-dom';
import DarkModeToggle from '../Editor/DarkModeToggle';
import LanguageSelector from '../Editor/LanguageSelector';
import RunButton from '../Editor/RunButton';
import ShareButton from '../Editor/ShareButton';
import { useAuthStore } from '../../store/authStore';
import '../../styles/Header.css';

interface HeaderProps {
  showNavLinks?: boolean;
  isEditorPage?: boolean;
}

const Header = ({ showNavLinks = true, isEditorPage = false }: HeaderProps) => {
  const { isAuthenticated, logout, user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    // Use a browser-native redirect instead of React Router's navigate().
    // Zustand's useSyncExternalStore triggers a synchronous React re-render
    // the instant logout() sets isAuthenticated=false. If the URL is still
    // /editor/:roomId at that point, RequireAuth fires and redirects to
    // /login with the room as "from" state — before navigate() can run.
    // window.location.replace() bypasses React's render pipeline entirely,
    // so RequireAuth never gets a chance to see the stale URL.
    // For a logout, a full-page navigation is also desirable because it
    // flushes all in-memory state cleanly.
    window.location.replace('/');
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

            {/* Share button — only on the editor page (desktop) */}
            {isEditorPage && <ShareButton />}

            <DarkModeToggle />

            {showNavLinks && (
              <>
                {isAuthenticated ? (
                  <>
                    <Link to="/analytics" className="nav-link analytics-link">Analytics</Link>
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

          {/* Mobile: dark mode toggle + hamburger.
              Hamburger is hidden on pages with no nav links (e.g. Login, Register). */}
          <div className="mobile-header-right">
            <DarkModeToggle />
            {showNavLinks && (
              <button
                className={`hamburger${menuOpen ? ' open' : ''}`}
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Toggle menu"
              >
                <span />
                <span />
                <span />
              </button>
            )}
          </div>
        </div>

        {/* Mobile dropdown — only rendered when there are nav links to show */}
        {showNavLinks && (
          <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
            {isEditorPage && (
              /* Tapping Run Code closes the menu instantly via event bubbling,
                 so the terminal is fully visible when results arrive. */
              <div className="mobile-menu-run" onClick={closeMenu}>
                <RunButton />
              </div>
            )}

            {isEditorPage && (
              <div className="mobile-menu-item">
                <LanguageSelector />
              </div>
            )}

            {/* Share button in mobile menu — closes the drawer after copying */}
            {isEditorPage && (
              <div className="mobile-menu-item" onClick={closeMenu}>
                <ShareButton />
              </div>
            )}

            {isAuthenticated && !isEditorPage && (
              <Link to="/editor" className="mobile-menu-link" onClick={closeMenu}>
                Editor
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <Link to="/analytics" className="mobile-menu-link" onClick={closeMenu}>
                  Analytics
                </Link>
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
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
