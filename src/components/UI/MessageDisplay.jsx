import './MessageDisplay.css';

const MessageDisplay = ({ message, type = 'info' }) => {
  if (!message) return null;
  
  const getMessageClass = () => {
    switch (type) {
      case 'success':
        return 'message-success';
      case 'error':
        return 'message-error';
      case 'warning':
        return 'message-warning';
      default:
        return 'message-content';
    }
  };

  return (
    <div className="message-display" role="alert">
      <div className={getMessageClass()}>
        {message}
      </div>
    </div>
  );
};

export default MessageDisplay;