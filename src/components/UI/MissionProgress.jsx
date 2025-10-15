// src/components/UI/MissionProgress.jsx
const MissionProgress = ({ progress, goal }) => {
  const percentage = Math.min(100, (progress / goal) * 100);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>Progreso: {progress}/{goal}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      
      <div className="w-full bg-gray-300 rounded-full h-3">
        <div 
          className="bg-green-600 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default MissionProgress;