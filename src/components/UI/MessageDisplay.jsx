import '../styles/Message.css'   // 👈 acá importás tu CSS


const MessageDisplay = ({ message }) => {
  if (!message) return null;
  return (
    <div className="message" role="alert">
      {message}
    </div>
  );
};

export default MessageDisplay;