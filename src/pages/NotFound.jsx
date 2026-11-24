import { Link, useNavigate } from 'react-router-dom';
import { useTitle } from '../hooks/useTitle.js';
import { Arrow, NotFoundBlock } from '../components/ui.jsx';

export default function NotFound() {
  useTitle('Page not found');
  const navigate = useNavigate();
  /* "Go back" returns to the previous page if there is one, otherwise home. */
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));

  return (
    <NotFoundBlock
      eyebrow="404 error page"
      title={<>404<br />Sorry, we couldn’t <em className="accent">find this page</em></>}
      text="The link may be broken, or the page may have moved."
    >
      <button className="btn btn--pink" type="button" onClick={goBack}>Go back <Arrow /></button>
      <Link className="btn btn--ghost" to="/projects/list">Browse projects</Link>
    </NotFoundBlock>
  );
}
