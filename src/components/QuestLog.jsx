import React from 'react';

const QuestLog = () => {
  const quests = [
    { id: 1, title: 'La búsqueda inicial', description: 'Encuentra el artefacto perdido', completed: false },
    { id: 2, title: 'Derrota al jefe', description: 'Derrota al jefe del calabozo', completed: false },
    { id: 3, title: 'Recolecta recursos', description: 'Consigue 10 hierbas medicinales', completed: true }
  ];

  return (
    <div className="quest-log">
      <h2>Registro de Misiones</h2>
      <div className="quests-list">
        {quests.map(quest => (
          <div key={quest.id} className={`quest-item ${quest.completed ? 'completed' : ''}`}>
            <h3>{quest.title}</h3>
            <p>{quest.description}</p>
            <span className="quest-status">
              {quest.completed ? 'Completada' : 'En progreso'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestLog;