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
  setView, // Función principal para cambiar entre dashboard, clubs, etc.
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
    if (fetchClubs) fetchClubs();
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
          />
        );
      
      case 'create_club':
        return (
          <CreateClubView
            setView={setInternalView}
            onBack={() => setInternalView('clubs_list')}
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
            setInternalView={setInternalView} // Pasar setInternalView con nombre diferente
            onBackToClubs={handleBackToClubsList}
          />
        );
      
      case 'club_missions':
        return (
          <ClubMissionsView
            currentClub={selectedClub}
            setInternalView={setInternalView} // Pasar setInternalView con nombre diferente
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
          />
        );
    }
  };

  return renderView();
};

export default ClubsSystem;