// src/hooks/useTeams.js
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export const useTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      // Datos de ejemplo
      const mockTeams = [
        { id: 1, name: 'FC Barcelona', country: 'Spain', founded: 1899 },
        { id: 2, name: 'Real Madrid', country: 'Spain', founded: 1902 },
        { id: 3, name: 'Manchester United', country: 'England', founded: 1878 },
      ];
      
      setTeams(mockTeams);
      
      // Código Supabase real (descomentar cuando esté listo):
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