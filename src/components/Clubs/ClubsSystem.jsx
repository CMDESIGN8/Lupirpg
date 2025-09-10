// components/Clubs/ClubsSystem.jsx
import React, { useState, useEffect } from 'react';
import ClubsView from '../Views/ClubsView';
import CreateClubView from '../Views/CreateClubView';
import ClubDetailsView from '../Views/ClubDetailsView';
import ClubMissionsView from '../Views/ClubMissionsView';

const ClubsSystem = ({
  clubs,
  currentClub,
  clubMembers,
  playerData,
  loading,
  message,
  setView, // Esta es la función para cambiar la vista principal (dashboard, clubs, etc.)
  handleViewClubDetails,
  handleJoinClub,
  handleLeaveClub,
  fetchClubs,
  showMessage,
  setLoading
}) => {
  const [internalView, setInternalView] = useState('clubs_list');
  const [selectedClub, setSelectedClub] = useState(null);

  // Actualizar el club seleccionado cuando currentClub cambie
  useEffect(() => {
    if (currentClub) {
      setSelectedClub(currentClub);
    }
  }, [currentClub]);

  // Función para manejar la selección de un club
  const handleSelectClub = (club) => {
    setSelectedClub(club);
    handleViewClubDetails(club);
    setInternalView('club_details');
  };

  // Función para volver a la lista de clubes
  const handleBackToClubsList = () => {
    setSelectedClub(null);
    setInternalView('clubs_list');
    fetchClubs(); // Recargar la lista de clubes
  };

  // Función para volver al dashboard principal
  const handleBackToDashboard = () => {
    setView('dashboard'); // Volver al dashboard principal
  };

  const renderView = () => {
    switch (internalView) {
      case 'clubs_list':
        return (
          <ClubsView
            clubs={clubs}
            handleViewClubDetails={handleSelectClub}
            handleJoinClub={handleJoinClub}
            playerData={playerData}
            loading={loading}
            message={message}
            setView={setView}
            onBackToDashboard={handleBackToDashboard}
          />
        );
      
      case 'create_club':
        return (
          <CreateClubView
            setView={setInternalView}
            onBack={() => setInternalView('clubs_list')}
            // pasa otras props necesarias para crear club
          />
        );
      
      case 'club_details':
        return (
          <ClubDetailsView
            currentClub={selectedClub}
            clubMembers={clubMembers}
            handleLeaveClub={handleLeaveClub}
            handleJoinClub={handleJoinClub}
            playerData={playerData}
            fetchClubs={fetchClubs}
            loading={loading}
            message={message}
            setView={setInternalView} // Para navegación interna
            onBackToClubs={handleBackToClubsList}
          />
        );
      
      case 'club_missions':
        return (
          <ClubMissionsView
            currentClub={selectedClub}
            setView={setInternalView} // Para navegación interna
            isLeader={playerData.club_id === selectedClub?.id && selectedClub?.owner_id === playerData.id}
            onBackToClubDetails={() => setInternalView('club_details')}
          />
        );
      
      default:
        return (
          <ClubsView
            clubs={clubs}
            handleViewClubDetails={handleSelectClub}
            handleJoinClub={handleJoinClub}
            playerData={playerData}
            loading={loading}
            message={message}
            setView={setView}
            onBackToDashboard={handleBackToDashboard}
          />
        );
    }
  };

  return renderView();
};

export default ClubsSystem;