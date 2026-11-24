import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { sendContactMessage } from '../lib/supabase.js';
import { useTitle } from '../hooks/useTitle.js';
import { Arrow } from '../components/ui.jsx';
import '../styles/pages/contact.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RULES = {
  name: { label: 'name', min: 2, max: 80 },
  email: { label: 'email', max: 254, email: true },
  subject: { label: 'subject', min: 3, max: 120 },
  message: { label: 'message', min: 10, max: 2000 },
};
const EMPTY = { name: '', email: '', subject: '', message: '' };

function validate(name, raw) {
  const rule = RULES[name];
  const value = raw.trim();
  if (!value) return `Please enter your ${rule.label}.`;
  if (rule.email && !EMAIL_RE.test(value)) return 'Please enter a valid email address, like name@example.com.';
  if (rule.min && value.length < rule.min) return `Your ${rule.label} needs at least ${rule.min} characters (you have ${value.length}).`;
  if (value.length > rule.max) return `Your ${rule.label} can be at most ${rule.max} characters.`;
  return '';
}

export default function Contact() {
  useTitle('Contact');
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success
  const [alert, setAlert] = useState('');
  const [sentName, setSentName] = useState('');
  const honeypot = useRef(null);
  const formRef = useRef(null);
  const successRef = useRef(null);

  const setField = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (touched[name]) setErrors((e) => ({ ...e, [name]: validate(name, value) }));
    if (alert) setAlert('');
  };

  /* Validate on blur; once a field is touched, it re-validates while typing. */
  const onBlur = (name) => {
    if (!values[name].trim() && !touched[name]) return;
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((e) => ({ ...e, [name]: validate(name, values[name]) }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    setAlert('');

    const nextErrors = {};
    Object.keys(RULES).forEach((n) => { nextErrors[n] = validate(n, values[n]); });
    setErrors(nextErrors);
    setTouched({ name: true, email: true, subject: true, message: true });
    const firstInvalid = Object.keys(RULES).find((n) => nextErrors[n]);
    if (firstInvalid) {
      formRef.current?.elements[firstInvalid]?.focus();
      return;
    }

    const data = {
      name: values.name.trim(),
      email: values.email.trim(),
      subject: values.subject.trim(),
      message: values.message.trim(),
    };

    const succeed = () => {
      setSentName(data.name.split(' ')[0]);
      setStatus('success');
      setValues(EMPTY);
      setErrors({});
      setTouched({});
      requestAnimationFrame(() => successRef.current?.focus());
    };

    /* Honeypot filled in = almost certainly a bot. Pretend it worked. */
    if (honeypot.current?.value) { succeed(); return; }

    if (!navigator.onLine) {
      setAlert('offline');
      return;
    }

    setStatus('sending');
    try {
      await sendContactMessage(data);
      succeed();
    } catch (err) {
      console.error('Contact form error:', err);
      setStatus('idle');
      setAlert('failed');
    }
  }

  const sending = status === 'sending';
  const count = values.message.length;
  const max = RULES.message.max;

  const field = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: (e) => setField(name, e.target.value),
    onBlur: () => onBlur(name),
    'aria-invalid': errors[name] ? true : undefined,
    className: 'field__input',
    required: true,
    maxLength: RULES[name].max,
  });
  const wrapClass = (name) =>
    `field${errors[name] ? ' has-error' : ''}${touched[name] && !errors[name] && values[name].trim() ? ' is-valid' : ''}`;

  return (
    <section className="section contact">
      <div className="container contact__grid">
        <div className="contact__intro">
          <p className="eyebrow load-in" style={{ '--i': 0 }}>Contact</p>
          <h1 className="display contact__title load-in" style={{ '--i': 1 }}>Let’s <em className="accent">talk.</em></h1>
          <p className="lead load-in" style={{ '--i': 2 }}>
            Have a project, a question or just an idea you can’t stop thinking about? Tell me about it and I’ll get back to you.
          </p>
          <ul className="contact__points load-in" style={{ '--i': 3 }}>
            <li><span aria-hidden="true">01</span>Replies within 2 working days</li>
            <li><span aria-hidden="true">02</span>UI/UX, branding, web and motion</li>
            <li><span aria-hidden="true">03</span>Freelance and collaborations welcome</li>
          </ul>
        </div>

        <div className="contact__card load-in" style={{ '--i': 2 }}>
          {status === 'success' ? (
            <div className="contact-success" ref={successRef} tabIndex={-1} role="status">
              <span className="contact-success__icon" aria-hidden="true">✓</span>
              <h2 className="display contact-success__title">Message <em className="accent">sent!</em></h2>
              <p className="lead">Thanks, {sentName}! Your message is on its way. I’ll get back to you soon.</p>
              <div className="btn-row">
                <button className="btn btn--ghost" type="button" onClick={() => setStatus('idle')}>Send another message</button>
                <Link className="btn btn--pink" to="/projects">See my work <Arrow /></Link>
              </div>
            </div>
          ) : (
            <form className="contact-form" ref={formRef} onSubmit={onSubmit} noValidate>
              <fieldset className="contact-form__fields" disabled={sending}>
                <legend className="sr-only">Your message</legend>
                <p className="contact-form__required"><span className="req" aria-hidden="true">*</span> Required fields</p>

                <div className="contact-form__row">
                  <div className={wrapClass('name')}>
                    <label className="field__label" htmlFor="name">Name <span className="req" aria-hidden="true">*</span></label>
                    <input {...field('name')} type="text" autoComplete="name" placeholder="Your name" aria-describedby="name-error" />
                    <p className="field__error" id="name-error" aria-live="polite">{errors.name}</p>
                  </div>
                  <div className={wrapClass('email')}>
                    <label className="field__label" htmlFor="email">Email <span className="req" aria-hidden="true">*</span></label>
                    <input {...field('email')} type="email" autoComplete="email" inputMode="email" placeholder="name@example.com" aria-describedby="email-error" />
                    <p className="field__error" id="email-error" aria-live="polite">{errors.email}</p>
                  </div>
                </div>

                <div className={wrapClass('subject')}>
                  <label className="field__label" htmlFor="subject">Subject <span className="req" aria-hidden="true">*</span></label>
                  <input {...field('subject')} type="text" placeholder="What’s it about?" aria-describedby="subject-error" />
                  <p className="field__error" id="subject-error" aria-live="polite">{errors.subject}</p>
                </div>

                <div className={wrapClass('message')}>
                  <label className="field__label" htmlFor="message">Message <span className="req" aria-hidden="true">*</span></label>
                  <textarea {...field('message')} rows={6} placeholder="Tell me about your idea, timeline and goals…" aria-describedby="message-hint message-error" />
                  <div className="field__hint" id="message-hint">
                    <span>At least 10 characters.</span>
                    <span className={`field__count${count >= max ? ' is-over' : count >= max * 0.9 ? ' is-near' : ''}`}>{count} / {max}</span>
                  </div>
                  <p className="field__error" id="message-error" aria-live="polite">{errors.message}</p>
                </div>

                {/* Spam trap: hidden from people, bots tend to fill it in */}
                <div className="contact-form__trap" aria-hidden="true">
                  <label htmlFor="website">Leave this empty</label>
                  <input ref={honeypot} id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                </div>

                {alert && (
                  <div className="contact-form__alert" role="alert">
                    <span aria-hidden="true">⚠</span>
                    {alert === 'offline' ? (
                      <div><strong>You seem to be offline.</strong> Check your internet connection and try again. Your message is still here.</div>
                    ) : (
                      <div><strong>Sorry, your message couldn’t be sent right now.</strong> This is on my side, not yours. Please try again in a moment. Everything you typed is still here.</div>
                    )}
                  </div>
                )}

                <button className="btn btn--pink contact-form__submit" type="submit" aria-busy={sending}>
                  {sending && <span className="spinner" aria-hidden="true" />}
                  <span>{sending ? 'Sending…' : 'Send message'}</span>
                  {!sending && <Arrow />}
                </button>
              </fieldset>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
