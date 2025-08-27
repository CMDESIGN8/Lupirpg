import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

export const usePlayers = () => {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('overall_rating', { ascending: false })
      
      if (error) throw error
      setPlayers(data)
    } catch (error) {
      console.error('Error fetching players:', error.message)
    } finally {
      setLoading(false)
    }
  }

  return { players, loading, refetch: fetchPlayers }
}

export const useTeams = () => {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
      
      if (error) throw error
      setTeams(data)
    } catch (error) {
      console.error('Error fetching teams:', error.message)
    } finally {
      setLoading(false)
    }
  }

  return { teams, loading, refetch: fetchTeams }
}

export const useMatches = () => {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('date', { ascending: false })
      
      if (error) throw error
      setMatches(data)
    } catch (error) {
      console.error('Error fetching matches:', error.message)
    } finally {
      setLoading(false)
    }
  }

  return { matches, loading, refetch: fetchMatches }
}