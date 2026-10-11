type P = { className?: string };
const base = { viewBox: "0 0 24 24", "aria-hidden": true } as const;

export const IconHome = ({ className = "icon" }: P) => (
  <svg {...base} className={className}><path d="M4 11l8-6.5L20 11v8.5a.5.5 0 0 1-.5.5H15v-6H9v6H4.5a.5.5 0 0 1-.5-.5z" /></svg>
);
export const IconLibrary = ({ className = "icon" }: P) => (
  <svg {...base} className={className}><rect x="4" y="4" width="6.5" height="6.5" /><rect x="13.5" y="4" width="6.5" height="6.5" /><rect x="4" y="13.5" width="6.5" height="6.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" /></svg>
);
export const IconProfile = ({ className = "icon" }: P) => (
  <svg {...base} className={className}><circle cx="9" cy="10" r="5" /><circle cx="16" cy="14" r="4" /></svg>
);
export const IconIdeas = ({ className = "icon" }: P) => (
  <svg {...base} className={className}><path d="M12 3.5a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-.6c0-.8.4-1.5 1-2A6 6 0 0 0 12 3.5z" /><path d="M10 20.5h4" /></svg>
);
