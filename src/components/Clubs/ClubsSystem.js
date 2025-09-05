import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Users, 
  LogIn, 
  ChevronDown, 
  Shield, 
  Trophy, 
  Swords, 
  Target,
  LogOut,
  Crown,
  BarChart3,
  Calendar
} from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';

// Importa las vistas
import ClubsView from './ClubsView';
import ClubDetailsView from './ClubDetailsView';
import CreateClubView from './CreateClubView';
import ClubMissionsView from './ClubMissionsView';
import ClubRankingsView from './ClubRankingsView';
import ClubMatchesView from './ClubMatchesView';

const ClubsSystem = ({ playerData, setPlayerData }) => {
  const [view, setView] = useState('clubs');
  const [clubs, setClubs] = useState([]);
  const [currentClub, setCurrentClub] = useState(null);
  const [clubMembers, setClubMembers] = useState([]);
  const [clubMissions, setClubMissions] = useState([]);
  const [clubRankings, setClubRankings] = useState([]);
  const [scheduledMatches, setScheduledMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Simular carga de datos
  useEffect(() => {
    fetchClubs();
    if (view === 'club_details' && currentClub) {
      fetchClubDetails(currentClub.id);
    }
    if (view === 'club_missions') {
      fetchClubMissions();
    }
    if (view === 'club_rankings') {
      fetchClubRankings();
    }
    if (view === 'club_matches') {
      fetchScheduledMatches();
    }
  }, [view]);

  const fetchClubs = () => {
    setLoading(true);
    // Simular una llamada a la API
    setTimeout(() => {
      setClubs([
        { id: 1, name: 'Dragones de Fuego', description: 'Club para jugadores competitivos', members: 12, level: 5, score: 2450 },
        { id: 2, name: 'Lobos Lunares', description: 'Club amistoso para todos los niveles', members: 8, level: 3, score: 1800 },
        { id: 3, name: 'Titanes Legendarios', description: 'En busca de la gloria', members: 15, level: 7, score: 3200 }
      ]);
      setLoading(false);
    }, 500);
  };

  const fetchClubDetails = (clubId) => {
    setLoading(true);
    // Simular una llamada a la API
    setTimeout(() => {
      const club = clubs.find(c => c.id === clubId);
      if (club) {
        setCurrentClub(club);
        setClubMembers([
          { username: 'LíderEjemplo', level: 20, role: 'Líder' },
          { username: 'MiembroActivo', level: 18, role: 'Miembro' },
          { username: 'NuevoMiembro', level: 12, role: 'Miembro' },
          { username: playerData.username, level: playerData.level, role: 'Miembro' }
        ]);
      }
      setLoading(false);
    }, 500);
  };

  const fetchClubMissions = () => {
    setLoading(true);
    // Simular una llamada a la API
    setTimeout(() => {
      setClubMissions([
        { id: 1, name: 'Victoria en 5 partidas', description: 'Gana 5 partidas en modo competitivo', progress: 3, goal: 5, reward: 500 },
        { id: 2, name: 'Jugador del mes', description: 'Consigue 1000 puntos de experiencia', progress: 650, goal: 1000, reward: 1000 },
        { id: 3, name: 'Cooperación grupal', description: 'Completa 10 misiones en equipo', progress: 7, goal: 10, reward: 750 }
      ]);
      setLoading(false);
    }, 500);
  };

  const fetchClubRankings = () => {
    setLoading(true);
    // Simular una llamada a la API
    setTimeout(() => {
      setClubRankings([
        { position: 1, name: 'Titanes Legendarios', score: 3200, members: 15 },
        { position: 2, name: 'Dragones de Fuego', score: 2450, members: 12 },
        { position: 3, name: 'Lobos Lunares', score: 1800, members: 8 },
        { position: 4, name: 'Guerreros Celestiales', score: 1650, members: 10 },
        { position: 5, name: 'Fénix Renacido', score: 1420, members: 9 }
      ]);
      setLoading(false);
    }, 500);
  };

  const fetchScheduledMatches = () => {
    setLoading(true);
    // Simular una llamada a la API
    setTimeout(() => {
      setScheduledMatches([
        { id: 1, opponent: 'Lobos Lunares', date: '15/05/2023', time: '20:00', status: 'Programado' },
        { id: 2, opponent: 'Guerreros Celestiales', date: '18/05/2023', time: '19:30', status: 'Programado' },
        { id: 3, opponent: 'Titanes Legendarios', date: '22/05/2023', time: '21:00', status: 'Programado' }
      ]);
      setLoading(false);
    }, 500);
  };

  const handleJoinClub = (clubId) => {
    setLoading(true);
    // Simular una llamada a la API
    setTimeout(() => {
      setPlayerData({ ...playerData, club_id: clubId });
      setMessage({ text: '¡Te has unido al club exitosamente!', type: 'success' });
      setLoading(false);
      setView('club_details');
      fetchClubDetails(clubId);
    }, 1000);
  };

  const handleLeaveClub = () => {
    setLoading(true);
    // Simular una llamada a la API
    setTimeout(() => {
      setPlayerData({ ...playerData, club_id: null });
      setMessage({ text: 'Has abandonado el club', type: 'info' });
      setLoading(false);
      setView('clubs');
      fetchClubs();
    }, 1000);
  };

  const handleViewClubDetails = (club) => {
    setCurrentClub(club);
    setView('club_details');
  };

  const handleChallengeClub = (clubId) => {
    setLoading(true);
    // Simular una llamada a la API
    setTimeout(() => {
      setMessage({ text: 'Desafío enviado al club', type: 'success' });
      setLoading(false);
    }, 1000);
  };

  // Renderizar la vista actual
  switch (view) {
    case 'create_club':
      return <CreateClubView setView={setView} />;
    case 'club_details':
      return (
        <ClubDetailsView
          currentClub={currentClub}
          clubMembers={clubMembers}
          handleLeaveClub={handleLeaveClub}
          handleJoinClub={handleJoinClub}
          playerData={playerData}
          fetchClubs={fetchClubs}
          loading={loading}
          message={message}
          setView={setView}
        />
      );
    case 'club_missions':
      return (
        <ClubMissionsView
          clubMissions={clubMissions}
          loading={loading}
          setView={setView}
        />
      );
    case 'club_rankings':
      return (
        <ClubRankingsView
          clubRankings={clubRankings}
          playerData={playerData}
          handleChallengeClub={handleChallengeClub}
          loading={loading}
          setView={setView}
        />
      );
    case 'club_matches':
      return (
        <ClubMatchesView
          scheduledMatches={scheduledMatches}
          loading={loading}
          setView={setView}
        />
      );
    default:
      return (
        <ClubsView
          clubs={clubs}
          handleViewClubDetails={handleViewClubDetails}
          handleJoinClub={handleJoinClub}
          playerData={playerData}
          loading={loading}
          message={message}
          setView={setView}
        />
      );
  }
};

export default ClubsSystem;