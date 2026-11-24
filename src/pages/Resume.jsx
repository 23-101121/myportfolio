import { Link } from 'react-router-dom';
import { useTitle } from '../hooks/useTitle.js';
import { Arrow } from '../components/ui.jsx';

/* Placeholder until the real resume content / CV file is ready. */
export default function Resume() {
  useTitle('Resume');
  return (
    <section className="section">
      <div className="container" style={{ display: 'grid', gap: '1.5rem', justifyItems: 'start' }}>
        <p className="eyebrow load-in">Resume</p>
        <h1 className="display h1 load-in" style={{ '--i': 1 }}>My <em className="accent">resume</em></h1>
        <p className="lead load-in" style={{ '--i': 2 }}>
          My full resume is on its way. In the meantime, have a look at my work or get in touch.
        </p>
        <div className="btn-row load-in" style={{ '--i': 3 }}>
          <Link className="btn btn--pink" to="/projects">See my work <Arrow /></Link>
          <Link className="btn btn--ghost" to="/contact">Contact me</Link>
        </div>
      </div>
    </section>
  );
}
