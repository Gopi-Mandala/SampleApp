import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

function LoginPage() {
  const [message, setMessage] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('The login form is ready. Connect your authentication service to sign in.');
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-intro">
          <span className="section-label">WELCOME BACK</span>
          <h1>
            Good to see
            <br />
            you again.
          </h1>
          <p>Your next good day starts with showing up. Let’s pick up where you left off.</p>
          <div className="login-quote">
            <span aria-hidden="true">“</span>
            <p>You don’t need a perfect plan. Just a place to begin.</p>
            <small>A DAYMARK REMINDER</small>
          </div>
        </div>
        <div className="login-card">
          <div className="login-card-heading">
            <span className="login-card-icon" aria-hidden="true">
              ✳
            </span>
            <div>
              <h2>Sign in</h2>
              <p>Welcome back to your space.</p>
            </div>
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <input
              autoComplete="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
            <div className="password-label">
              <label htmlFor="password">Password</label>
              <a href="#forgot-password" onClick={(event) => event.preventDefault()}>
                Forgot password?
              </a>
            </div>
            <input
              autoComplete="current-password"
              id="password"
              name="password"
              placeholder="Enter your password"
              required
              type="password"
            />
            <button className="button button-primary login-submit" type="submit">
              Sign in <span aria-hidden="true">→</span>
            </button>
            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}
          </form>
          <div className="login-divider">
            <span>YOUR JOURNEY, YOUR PACE</span>
          </div>
          <p className="signup-prompt">
            New around here? <Link to="/">Explore Daymark</Link>
          </p>
          <p className="auth-note">Authentication isn’t connected yet. This is a page preview.</p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
