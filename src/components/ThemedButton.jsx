export default function ThemedButton({
type = 'button',
onClick,
disabled,
icon,
children,
className = ''
}) {
return (
<button
type={type}
onClick={onClick}
disabled={disabled}
className={`themed-button ${className}`}
>
{icon}
<span>{children}</span>
</button>
)
}