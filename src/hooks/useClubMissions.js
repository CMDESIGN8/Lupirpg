// src/hooks/useClubMissions.js
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase'; // Importación corregida

export const useClubMissions = (clubId) => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClubMissions = async () => {
    try {
      setLoading(true);
      
      // Primero obtener las misiones del club
      const { data: missionsData, error: missionsError } = await supabase
        .from('club_missions')
        .select('*')
        .eq('club_id', clubId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (missionsError) throw missionsError;

      // Para cada misión, obtener su progreso
      const missionsWithProgress = await Promise.all(
        missionsData.map(async (mission) => {
          try {
            const { data: progressData, error: progressError } = await supabase
              .rpc('get_club_mission_progress', { p_mission_id: mission.id });
            
            if (progressError) {
              console.error('Error getting progress:', progressError);
              return {
                ...mission,
                progress: 0,
                goal: mission.goal,
                member_progress: 0,
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
              progress: 0,
              goal: mission.goal,
              member_progress: 0,
              completed: false
            };
          }
        })
      );

      setMissions(missionsWithProgress);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching missions:', err);
    } finally {
      setLoading(false);
    }
  };

  const contributeToMission = async (missionId, progressIncrement = 1) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Obtener el player_id del usuario autenticado
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('id', user.id)
        .single();

      if (playerError) throw playerError;

      const { error } = await supabase
        .rpc('contribute_to_mission', {
          p_mission_id: missionId,
          p_player_id: playerData.id,
          p_progress_increment: progressIncrement
        });

      if (error) throw error;

      // Actualizar la lista de misiones después de contribuir
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
      const { error } = await supabase
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
      
      // Suscribirse a cambios en tiempo real
      const subscription = supabase
        .channel('club_missions_changes')
        .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'club_missions',
              filter: `club_id=eq.${clubId}`
            }, 
            () => {
              fetchClubMissions();
            })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
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