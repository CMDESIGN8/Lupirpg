const MessageDisplay = ({ message }) => {
  if (!message) return null;
  return (
    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-md mb-4" role="alert">
      {message}
    </div>
  );
};

export default MessageDisplay;