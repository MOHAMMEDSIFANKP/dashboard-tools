export const ActionButton: React.FC<{
  onClick: () => void;
  className: string;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, className, disabled = false, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      shadow-xl border p-2 rounded text-white transition-colors duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `}
  >
    {children}
  </button>
);
