import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

// usePlayers hook - already exported with "export const"
export const usePlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      // Simular datos si Supabase no está configurado
      const mockPlayers = [
        { id: 1, name: 'Lionel Messi', position: 'Delantero', age: 36, overall_rating: 93, photo_url: 'https://placehold.co/80x80?text=Messi' },
        { id: 2, name: 'Cristiano Ronaldo', position: 'Delantero', age: 38, overall_rating: 92, photo_url: 'https://placehold.co/80x80?text=CR7' },
        { id: 3, name: 'Neymar Jr', position: 'Delantero', age: 31, overall_rating: 89, photo_url: 'https://placehold.co/80x80?text=Neymar' },
      ];
      
      setPlayers(mockPlayers);
      
      // Si tienes Supabase configurado, descomenta esto:
      /*
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('overall_rating', { ascending: false });
      
      if (error) throw error;
      setPlayers(data);
      */
    } catch (error) {
      console.error('Error fetching players:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return { players, loading, refetch: fetchPlayers };
};

// useTeams hook - already exported with "export const"
export const useTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      // Datos de ejemplo para equipos
      const mockTeams = [
        { id: 1, name: 'FC Barcelona', country: 'Spain', founded: 1899, logo_url: 'https://placehold.co/80x80?text=FCB' },
        { id: 2, name: 'Real Madrid', country: 'Spain', founded: 1902, logo_url: 'https://placehold.co/80x80?text=RMA' },
        { id: 3, name: 'Manchester United', country: 'England', founded: 1878, logo_url: 'https://placehold.co/80x80?text=MUFC' },
      ];
      
      setTeams(mockTeams);
      
      // Para Supabase real, descomenta:
      /*
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTeams(data);
      */
    } catch (error) {
      console.error('Error fetching teams:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return { teams, loading, refetch: fetchTeams };
};

// REMOVE OR COMMENT OUT THIS DUPLICATE EXPORT SECTION:
// export { usePlayers, useTeams }; // ← This line causes the duplicate export error