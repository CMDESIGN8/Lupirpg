import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

// usePlayers hook
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

// useTeams hook
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

// useMatches hook
export const useMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      // Datos de ejemplo para partidos
      const mockMatches = [
        { 
          id: 1, 
          home_team: 'FC Barcelona', 
          away_team: 'Real Madrid', 
          date: '2024-01-15', 
          time: '20:00', 
          home_score: 3, 
          away_score: 2,
          stadium: 'Camp Nou',
          competition: 'La Liga'
        },
        { 
          id: 2, 
          home_team: 'Manchester United', 
          away_team: 'Liverpool', 
          date: '2024-01-20', 
          time: '16:30', 
          home_score: 1, 
          away_score: 1,
          stadium: 'Old Trafford',
          competition: 'Premier League'
        },
        { 
          id: 3, 
          home_team: 'Bayern Munich', 
          away_team: 'Borussia Dortmund', 
          date: '2024-01-25', 
          time: '18:45', 
          home_score: 4, 
          away_score: 0,
          stadium: 'Allianz Arena',
          competition: 'Bundesliga'
        },
      ];
      
      setMatches(mockMatches);
      
      // Para Supabase real, descomenta:
      /*
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:home_team_id (name),
          away_team:away_team_id (name)
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;
      setMatches(data);
      */
    } catch (error) {
      console.error('Error fetching matches:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return { matches, loading, refetch: fetchMatches };
};