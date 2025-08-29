const ProgressBar = ({ value, max, className = '' }) => {
  const percentage = (value / max) * 100;
  
  return (
    <div className={`progress-bar-container ${className}`}>
      <div 
        className="progress-bar-fill" 
        style={{ width: `${percentage}%` }}
      ></div>
      
      <style jsx>{`
        .progress-bar-container {
          width: 100%;
          height: 8px;
          background: rgba(0, 30, 60, 0.7);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }
        
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--neon-blue), var(--neon-cyan));
          border-radius: 4px;
          transition: width 0.5s ease;
          position: relative;
          overflow: hidden;
        }
        
        .progress-bar-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background-image: linear-gradient(
            -45deg,
            rgba(255, 255, 255, 0.2) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.2) 75%,
            transparent 75%,
            transparent
          );
          z-index: 1;
          background-size: 15px 15px;
          animation: move 2s linear infinite;
          border-radius: 4px;
        }
        
        @keyframes move {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 15px 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProgressBar;