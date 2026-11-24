import { useState } from 'react';
import { useTitle } from '../hooks/useTitle.js';
import { Art } from '../components/ui.jsx';
import '../styles/pages/services.css';

const PERKS = [
  ['✦', 'Built to be remembered', 'Clear, bold and recognisable.'],
  ['◎', 'Built to perform', 'Fast, accessible and responsive.'],
  ['↻', 'Made to move', 'Motion that guides, not distracts.'],
  ['◇', 'Intelligent brand feel', 'Consistent across every screen.'],
];

const SERVICES = [
  {
    title: 'UI/UX Design',
    text: 'I design clean, intuitive digital experiences that balance usability, clarity and visual personality. From research to high-fidelity prototypes.',
    tags: ['User research', 'Wireframes', 'User flows', 'Prototyping', 'Design systems', 'Usability testing'],
  },
  {
    title: 'Branding & Identity',
    text: 'Logos, type, colour and voice that work together, so your brand looks and feels the same everywhere it shows up.',
    tags: ['Logo design', 'Visual identity', 'Brand guidelines', 'Social kits'],
  },
  {
    title: 'Web Development',
    text: 'Responsive, accessible websites built with React, HTML, CSS and JavaScript, connected to real data when you need it.',
    tags: ['React', 'Responsive layouts', 'Supabase', 'Performance'],
  },
  {
    title: 'Motion & Visual Design',
    text: 'Micro-interactions, animated graphics and visuals that add rhythm and personality without getting in the way.',
    tags: ['After Effects', 'Micro-interactions', 'Illustration', '3D & visuals'],
  },
];

const STEPS = [
  ['Discover', 'Understanding the goals, the audience and the problem.'],
  ['Define', 'Turning insights into a clear direction and strategy.'],
  ['Design', 'Shaping ideas into flows, screens and visual systems.'],
  ['Deliver', 'Building, testing and refining until it feels right.'],
];

const WHY = [
  'Purpose behind every detail.',
  'Creativity balanced with function.',
  'A fresh perspective for every project.',
  'Care from concept to completion.',
];

export default function Services() {
  useTitle('Services');
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <>
      <section className="services-hero">
        <div className="container services-hero__grid">
          <div className="services-hero__copy">
            <p className="eyebrow load-in" style={{ '--i': 0 }}>Services</p>
            <h1 className="display services-hero__title load-in" style={{ '--i': 1 }}>
              What I can<br />do <em className="accent">for</em> you
            </h1>
            <p className="lead load-in" style={{ '--i': 2 }}>A mix of design, branding and development services to bring your vision to life.</p>
            <ul className="perks load-in" style={{ '--i': 3 }}>
              {PERKS.map(([icon, title, text]) => (
                <li className="perk" key={title}>
                  <span className="perk__icon" aria-hidden="true">{icon}</span>
                  <div><strong>{title}</strong><span>{text}</span></div>
                </li>
              ))}
            </ul>
          </div>
          <div className="services-hero__visual load-in" style={{ '--i': 2 }} aria-hidden="true">
            <Art hue={145} />
            <Art hue={22} variant="phone" />
            <Art hue={335} variant="phone" />
          </div>
        </div>
      </section>

      {/* Accordion: one service open at a time */}
      <section className="section" aria-labelledby="services-title">
        <div className="container">
          <h2 className="sr-only" id="services-title">Services</h2>
          <div className="accordion" data-stagger>
            {SERVICES.map((s, i) => (
              <details
                className="accordion__item"
                key={s.title}
                open={openIndex === i}
                onToggle={(e) => {
                  if (e.currentTarget.open) setOpenIndex(i);
                  else if (openIndex === i) setOpenIndex(-1);
                }}
              >
                <summary>
                  <span className="accordion__num">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                  <span className="accordion__icon" aria-hidden="true" />
                </summary>
                <div className="accordion__panel">
                  <p>{s.text}</p>
                  <ul className="tag-list">{s.tags.map((t) => <li className="tag" key={t}>{t}</li>)}</ul>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section process" aria-labelledby="process-title">
        <div className="container">
          <div className="section-head" data-reveal>
            <p className="eyebrow">The way I work</p>
            <h2 className="display h2" id="process-title">From first <em className="accent">thought</em> to<br />final form.</h2>
          </div>
          <ol className="process__steps" data-stagger>
            {STEPS.map(([title, text], i) => (
              <li className="process__step" key={title}>
                <span className="process__num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section why" aria-labelledby="why-title">
        <div className="container why__grid">
          <div data-reveal>
            <p className="eyebrow">Why work with me</p>
            <h2 className="display h2" id="why-title">Not just<br /><em className="accent">good</em> looks.</h2>
          </div>
          <ol className="why__list" data-stagger>
            {WHY.map((text, i) => (
              <li key={text}><span>{String(i + 1).padStart(2, '0')}</span>{text}</li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
