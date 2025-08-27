import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

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

// Implementa similares para useTeams y useMatches...