import '../styles/Message.css'   // 👈 acá importás tu CSS


const MessageDisplay = ({ message }) => {
  if (!message) return null;
  return (
   <div className="message-display" role="alert">
      <div className={getMessageClass()}>
        {message}
      </div>
    </div>
  );
};

export default MessageDisplay;