// src/hooks/useClubMissions.js
import { useState, useEffect } from 'react';
import { supabaseClient } from '../services/supabase';

export const useClubMissions = (clubId) => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMissions = async () => {
    if (!clubId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('club_missions')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMissions(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const contributeToMission = async (missionId, playerId) => {
    try {
      // Primero verifica si ya existe una contribución
      const { data: existingContribution } = await supabaseClient
        .from('club_member_missions')
        .select('*')
        .eq('mission_id', missionId)
        .eq('player_id', playerId)
        .single();

      if (existingContribution) {
        // Actualizar progreso existente
        const { error } = await supabaseClient
          .from('club_member_missions')
          .update({ 
            progress: existingContribution.progress + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContribution.id);
        
        if (error) throw error;
      } else {
        // Crear nueva contribución
        const { error } = await supabaseClient
          .from('club_member_missions')
          .insert({
            mission_id: missionId,
            player_id: playerId,
            progress: 1
          });
        
        if (error) throw error;
      }

      // Recargar misiones para actualizar el progreso
      await fetchMissions();
      return true;
    } catch (err) {
      console.error('Error contributing to mission:', err);
      return false;
    }
  };

  const createMission = async (clubId, missionData) => {
    try {
      const { error } = await supabaseClient
        .from('club_missions')
        .insert({
          club_id: clubId,
          ...missionData
        });

      if (error) throw error;
      
      await fetchMissions();
      return true;
    } catch (err) {
      console.error('Error creating mission:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [clubId]);

  return {
    missions,
    loading,
    error,
    contributeToMission,
    createMission,
    refetch: fetchMissions
  };
};