import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import Header from '../components/common/Header';
import '../styles/AuthPages.css';

const LoginPage = () => {
  const { isDarkMode } = useThemeStore();
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Clear any stale error from a previous page (e.g. login error shown on Register).
  useEffect(() => { clearError(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Destination to return to after login (set by RequireAuth when a
  // user pastes a /editor/:roomId link while not signed in).
  const from = (location.state as { from?: Location })?.from;
  const isRoomInvite = from?.pathname?.startsWith('/editor/');
  // Pull the optional inviter name from the shared link's query string
  const invitedBy = isRoomInvite
    ? new URLSearchParams((from as any)?.search ?? '').get('invitedBy')
    : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    await login(username, password);

    // On success, send them back to the room they tried to join,
    // or to a fresh editor session if they came directly to /login.
    if (useAuthStore.getState().isAuthenticated) {
      navigate(from?.pathname || '/editor', { replace: true });
    }
  };

  return (
    <div className={`auth-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Header showNavLinks={false} />
      <div className="auth-container">
        <h1>Log In</h1>

        {/* Room invite banner — shown when redirected from a shared room link */}
        {isRoomInvite && (
          <div className="auth-invite-banner">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {invitedBy ? (
              <span>
                <strong>{invitedBy}</strong> invited you to a collaborative coding session.
                Sign in to join the room.
              </span>
            ) : (
              <span>You've been invited to a collaborative coding session. Sign in to join the room.</span>
            )}
          </div>
        )}

        {!isRoomInvite && (
          <p className="auth-subtitle">Welcome back! Log in to your account</p>
        )}

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Don't have an account? <Link to="/register" state={location.state}>Create Account</Link>
          </p>
          <Link to="/" className="back-link">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
