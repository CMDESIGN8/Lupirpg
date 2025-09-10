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
      
      // Modo desarrollo: usar datos de prueba
      if (import.meta.env.MODE === 'development') {
        console.log('Usando misiones de prueba para desarrollo');
        setMissions(mockMissions);
        setLoading(false);
        return;
      }
      
      // Primero obtener las misiones del club
      const { data: missionsData, error: missionsError } = await supabaseClient
        .from('club_missions')
        .select('*')
        .eq('club_id', clubId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (missionsError) throw missionsError;

      // Si no hay misiones, usar datos de prueba
      if (!missionsData || missionsData.length === 0) {
        console.log('No hay misiones en la BD, usando datos de prueba');
        setMissions(mockMissions);
        setLoading(false);
        return;
      }

      // Para cada misión, obtener su progreso
      const missionsWithProgress = await Promise.all(
        missionsData.map(async (mission) => {
          try {
            const { data: progressData, error: progressError } = await supabaseClient
              .rpc('get_club_mission_progress', { p_mission_id: mission.id });
            
            if (progressError) {
              console.error('Error getting progress:', progressError);
              return {
                ...mission,
                progress: Math.floor(Math.random() * mission.goal),
                goal: mission.goal,
                member_progress: Math.floor(Math.random() * 5) + 1,
                completed: false
              };
            }

            return {
              ...mission,
              progress: progressData?.current_progress || 0,
              goal: mission.goal,
              member_progress: progressData?.active_members || 0,
              completed: (progressData?.current_progress || 0) >= mission.goal
            };
          } catch (err) {
            console.error('Error processing mission:', err);
            return {
              ...mission,
              progress: Math.floor(Math.random() * mission.goal),
              goal: mission.goal,
              member_progress: Math.floor(Math.random() * 5) + 1,
              completed: false
            };
          }
        })
      );

      setMissions(missionsWithProgress);
    } catch (err) {
      console.error('Error fetching missions, using mock data:', err);
      setMissions(mockMissions);
    } finally {
      setLoading(false);
    }
  };

  const contributeToMission = async (missionId, progressIncrement = 1) => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Obtener el player_id del usuario autenticado
      const { data: playerData, error: playerError } = await supabaseClient
        .from('players')
        .select('id')
        .eq('id', user.id)
        .single();

      if (playerError) throw playerError;

      const { error } = await supabaseClient
        .rpc('contribute_to_mission', {
          p_mission_id: missionId,
          p_player_id: playerData.id,
          p_progress_increment: progressIncrement
        });

      if (error) throw error;

      await fetchClubMissions();
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error contributing to mission:', err);
      return false;
    }
  };

  const createMission = async (missionData) => {
    try {
      const { error } = await supabaseClient
        .from('club_missions')
        .insert([{
          ...missionData,
          club_id: clubId
        }]);

      if (error) throw error;

      await fetchClubMissions();
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