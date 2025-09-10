// src/hooks/useClubMissions.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const useClubMissions = (clubId) => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMissions = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    setError(null);
    try {
      // Usamos la función RPC para obtener las misiones y su progreso
      const { data, error } = await supabase.rpc('get_club_missions_with_progress', {
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
      // Usamos la función RPC para registrar la contribución
      const { data, error: rpcError } = await supabase.rpc('contribute_to_club_mission', {
        mission_id_param: missionId,
        player_id_param: playerId,
      });

      if (rpcError) throw rpcError;

      // Actualizamos el estado local con el nuevo progreso para una UI instantánea
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