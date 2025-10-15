import styles from './MessageDisplay.module.css';

const MessageDisplay = ({ message, type = 'info' }) => {
  if (!message) return null;
  
  const getMessageClass = () => {
    switch (type) {
      case 'success':
        return styles.messageSuccess;
      case 'error':
        return styles.messageError;
      case 'warning':
        return styles.messageWarning;
      default:
        return styles.messageContent;
    }
  };

  return (
    <div className={styles.messageContainer} role="alert">
      <div className={getMessageClass()}>
        {message}
      </div>
    </div>
  );
};

export default MessageDisplay;