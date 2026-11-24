import { Link } from 'react-router-dom';
import { NAV } from '../lib/nav.js';

export default function Footer() {
  const links = [...NAV, { label: 'All projects', to: '/projects/list' }];
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-cta" data-reveal>
          <h2 className="display footer-cta__title">
            Got an <em className="accent">idea?</em>
            <br />
            Let’s build it.
          </h2>
          <Link className="btn btn--light" to="/contact">
            Contact me <span className="btn__arrow" aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="footer-bottom">
          <Link className="logo" to="/" aria-label="Ganna Fares, home">GF<span className="logo__dot">.</span></Link>
          <nav aria-label="Footer">
            <ul className="footer-nav__list">
              {links.map((l) => (
                <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
              ))}
            </ul>
          </nav>
          <p>© {new Date().getFullYear()} Ganna Fares</p>
        </div>
      </div>
    </footer>
  );
}
