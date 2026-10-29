import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" onClick={closeMenu} aria-label="Daymark home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M7 17.5 13 23l12-14"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
          <span>daymark</span>
        </Link>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>

        <nav
          className={`main-nav${menuOpen ? ' main-nav--open' : ''}`}
          aria-label="Main navigation"
        >
          <NavLink
            className={({ isActive }) =>
              `nav-link${isActive && location.pathname === '/' ? ' nav-link--active' : ''}`
            }
            to="/"
            end
            onClick={closeMenu}
          >
            Home
          </NavLink>
          <a className="nav-link" href="/#how-it-works" onClick={closeMenu}>
            How it works
          </a>
          <a className="nav-link" href="/#benefits" onClick={closeMenu}>
            Benefits
          </a>
          <Link className="header-cta" to="/login" onClick={closeMenu}>
            Sign in <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
