/* "Text roll" hover: the text slides up and a copy slides in from below.
   Put class "roll-host" on the link/button that should trigger it.
   `alt` lets the incoming copy look different (e.g. pink serif in the menu). */
export default function RollText({ children, alt, className = '' }) {
  return (
    <span className={`roll ${className}`}>
      <span className="roll__inner">
        <span className="roll__a">{children}</span>
        <span className="roll__b" aria-hidden="true">{alt ?? children}</span>
      </span>
    </span>
  );
}
