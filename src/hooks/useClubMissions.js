// src/hooks/useClubMissions.js
import { useState, useEffect } from 'react';
import { supabaseClient } from '../services/supabase';

export const useClubMissions = (clubId) => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Datos de prueba para desarrollo
  const mockMissions = [
    {
      id: 1,
      club_id: clubId,
      name: 'Conexión Diaria',
      description: '¡Que 5 miembros se conecten al menos 5 veces esta semana!',
      mission_type: 'weekly',
      goal: 5,
      reward: 'Pack de 5 pelotas',
      progress: 3,
      member_progress: 3,
      completed: false,
      is_active: true
    },
    {
      id: 2,
      club_id: clubId,
      name: 'Entrenamiento en Equipo',
      description: 'Completar 20 sesiones de entrenamiento entre todos',
      mission_type: 'weekly',
      goal: 20,
      reward: '+10% EXP por 24 horas',
      progress: 12,
      member_progress: 8,
      completed: false,
      is_active: true
    },
    {
      id: 3,
      club_id: clubId,
      name: 'Socializar en el Club',
      description: 'Realizar 15 interacciones sociales entre miembros',
      mission_type: 'daily',
      goal: 15,
      reward: '100 Lupi Coins para cada miembro',
      progress: 8,
      member_progress: 5,
      completed: false,
      is_active: true
    }
  ];

  const fetchClubMissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Siempre usar datos de prueba para desarrollo/demo
      console.log('Usando misiones de prueba');
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMissions(mockMissions);
      
    } catch (err) {
      console.error('Error fetching missions:', err);
      setError(err.message);
      // En caso de error, usar datos de prueba
      setMissions(mockMissions);
    } finally {
      setLoading(false);
    }
  };

  const contributeToMission = async (missionId, progressIncrement = 1) => {
    try {
      console.log(`Contribuyendo a misión ${missionId} con +${progressIncrement}`);
      
      // Simular contribución
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Actualizar misiones localmente
      setMissions(prevMissions => 
        prevMissions.map(mission => 
          mission.id === missionId 
            ? {
                ...mission,
                progress: Math.min(mission.progress + progressIncrement, mission.goal),
                completed: mission.progress + progressIncrement >= mission.goal
              }
            : mission
        )
      );
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error contributing to mission:', err);
      return false;
    }
  };

  const createMission = async (missionData) => {
    try {
      console.log('Creando nueva misión:', missionData);
      
      // Simular creación
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newMission = {
        id: Date.now(), // ID temporal
        club_id: clubId,
        ...missionData,
        progress: 0,
        member_progress: 0,
        completed: false,
        is_active: true
      };
      
      setMissions(prev => [newMission, ...prev]);
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error creating mission:', err);
      return false;
    }
  };

  useEffect(() => {
    if (clubId) {
      fetchClubMissions();
    } else {
      // Si no hay clubId, igualmente cargar misiones de prueba
      setLoading(false);
      setMissions(mockMissions.map(mission => ({ ...mission, club_id: null })));
    }
  }, [clubId]);

  return {
    missions,
    loading,
    error,
    contributeToMission,
    createMission,
    refreshMissions: fetchClubMissions
  };
};