import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const TrainingPanel = ({ player }) => {
  const [trainingType, setTrainingType] = useState('fitness');
  const [isTraining, setIsTraining] = useState(false);

  const handleTrain = async () => {
    if (!player) return;
    
    setIsTraining(true);
    
    try {
      // Simular entrenamiento y mejorar estadísticas
      const improvement = Math.floor(Math.random() * 3) + 1;
      
      // Actualizar en Supabase
      const { error } = await supabase
        .from('players')
        .update({ 
          [trainingType]: player[trainingType] + improvement,
          overall_rating: player.overall_rating + (improvement > 2 ? 1 : 0)
        })
        .eq('id', player.id);
      
      if (error) throw error;
      
      alert(`¡Entrenamiento completado! ${trainingType} mejoró en ${improvement} puntos.`);
    } catch (error) {
      console.error('Error en entrenamiento:', error.message);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="training-panel">
      <h2>Centro de Entrenamiento</h2>
      
      {player ? (
        <div className="training-options">
          <h3>Entrenar a {player.name}</h3>
          
          <div className="training-types">
            <label>
              <input 
                type="radio" 
                value="fitness" 
                checked={trainingType === 'fitness'} 
                onChange={(e) => setTrainingType(e.target.value)} 
              />
              Fitness
            </label>
            
            <label>
              <input 
                type="radio" 
                value="shooting" 
                checked={trainingType === 'shooting'} 
                onChange={(e) => setTrainingType(e.target.value)} 
              />
              Tiro
            </label>
            
            <label>
              <input 
                type="radio" 
                value="passing" 
                checked={trainingType === 'passing'} 
                onChange={(e) => setTrainingType(e.target.value)} 
              />
              Pases
            </label>
            
            <label>
              <input 
                type="radio" 
                value="defending" 
                checked={trainingType === 'defending'} 
                onChange={(e) => setTrainingType(e.target.value)} 
              />
              Defensa
            </label>
          </div>
          
          <button 
            onClick={handleTrain} 
            disabled={isTraining}
          >
            {isTraining ? 'Entrenando...' : 'Comenzar Entrenamiento'}
          </button>
        </div>
      ) : (
        <p>Selecciona un jugador para entrenar</p>
      )}
    </div>
  );
};

export default TrainingPanel;