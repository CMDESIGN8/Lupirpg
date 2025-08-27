const MessageDisplay = ({ message }) => {
  if (!message) return null
  return (
    <div className="card" style={{ borderColor:'#bfdbfe', background:'#eff6ff' }}>
      <strong>Mensaje:</strong> {message}
    </div>
  )
}
export default MessageDisplay
