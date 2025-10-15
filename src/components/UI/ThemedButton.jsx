const ThemedButton = ({ onClick, disabled, icon, children, className = '', type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-md transition duration-300 transform bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 disabled:bg-gray-400 disabled:text-gray-600 disabled:transform-none ${className}`}
  >
    {icon}
    <span>{children}</span>
  </button>
);

export default ThemedButton;