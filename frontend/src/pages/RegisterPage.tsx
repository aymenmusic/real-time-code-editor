import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import Header from '../components/common/Header';
import '../styles/AuthPages.css';

const RegisterPage = () => {
  const { isDarkMode } = useThemeStore();
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
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
    
    // If registration was successful, user will be logged in and redirected to editor
    if (useAuthStore.getState().isAuthenticated) {
      navigate('/editor');
    }
  };

  return (
    <div className={`auth-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Header showNavLinks={false} />
      <div className="auth-container">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Join our community of developers</p>
        
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
            Already have an account? <Link to="/login">Log In</Link>
          </p>
          <Link to="/" className="back-link">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
