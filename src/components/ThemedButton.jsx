const ThemedButton = ({ children, icon, className = '', ...props }) => (
  <button className={`btn btn-primary ${className}`} {...props}>
    {icon}
    <span>{children}</span>
  </button>
)
export default ThemedButton
