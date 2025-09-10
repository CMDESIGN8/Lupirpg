// src/hooks/useClubMissions.js
import { useState, useEffect, useCallback } from 'react';
// --- AJUSTADO A TU IMPORTACIÓN ---
import { supabaseClient } from '../services/supabase.js'; 

export const useClubMissions = (clubId) => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMissions = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    setError(null);
    try {
      // Se usa supabaseClient en lugar de supabase
      const { data, error } = await supabaseClient.rpc('get_club_missions_with_progress', {
        club_id_param: clubId,
      });

      if (error) throw error;
      setMissions(data || []);
    } catch (err) {
      console.error("Error fetching club missions:", err);
      setError('No se pudieron cargar las misiones del club.');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const contributeToMission = async (missionId, playerId) => {
    if (!playerId) {
      setError("Error: ID del jugador no encontrado.");
      return false;
    }
    setError(null);
    try {
      // Se usa supabaseClient en lugar de supabase
      const { data, error: rpcError } = await supabaseClient.rpc('contribute_to_club_mission', {
        mission_id_param: missionId,
        player_id_param: playerId,
      });

      if (rpcError) throw rpcError;

      if (data && data.success) {
        setMissions(prevMissions =>
          prevMissions.map(m =>
            m.id === missionId
              ? { ...m, total_progress: data.new_total_progress, is_active: data.new_total_progress < m.goal }
              : m
          )
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error contributing to mission:", err);
      setError('Hubo un problema al intentar contribuir.');
      return false;
    }
  };

  return { missions, loading, error, contributeToMission, refreshMissions: fetchMissions };
};