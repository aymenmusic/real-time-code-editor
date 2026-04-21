import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import Header from '../components/common/Header';
import '../styles/AuthPages.css';

const RegisterPage = () => {
  const { isDarkMode } = useThemeStore();
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Clear any stale error left over from a previous page (e.g. failed login
  // attempt that leaks into the Register page via shared Zustand state).
  useEffect(() => { clearError(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Destination to return to after registration — forwarded from LoginPage
  // when the user arrived via a shared room link.
  const from = (location.state as { from?: Location })?.from;
  const isRoomInvite = from?.pathname?.startsWith('/editor/');
  // Pull the optional inviter name from the shared link's query string
  const invitedBy = isRoomInvite
    ? new URLSearchParams((from as any)?.search ?? '').get('invitedBy')
    : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setPasswordError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    await register(email, username, password);

    // On success, redirect to the room the user was invited to (if any),
    // otherwise open a fresh editor session.
    if (useAuthStore.getState().isAuthenticated) {
      navigate(from?.pathname || '/editor', { replace: true });
    }
  };

  return (
    <div className={`auth-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Header showNavLinks={false} />
      <div className="auth-container">
        <h1>Create Account</h1>

        {/* Room invite banner */}
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
                Create an account to join the room.
              </span>
            ) : (
              <span>You've been invited to a collaborative coding session. Create an account to join the room.</span>
            )}
          </div>
        )}

        {!isRoomInvite && (
          <p className="auth-subtitle">Join our community of developers</p>
        )}

        {(error || passwordError) && (
          <div className="auth-error">
            {error || passwordError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <small className="password-requirements">
              Password must be at least 8 characters and contain:
              <br />• One uppercase letter • One lowercase letter • One digit
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Already have an account?{' '}
            <Link to="/login" state={location.state}>Log In</Link>
          </p>
          <Link to="/" className="back-link">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
