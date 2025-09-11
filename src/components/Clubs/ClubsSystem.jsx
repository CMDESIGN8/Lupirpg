// components/Clubs/ClubsSystem.jsx
import React, { useState, useEffect } from 'react';
import ClubsView from '../Views/ClubsView';
import CreateClubView from '../Views/CreateClubView';
import ClubDetailsView from '../Views/ClubDetailsView';
import ClubMissionsView from './ClubMissionsView'; // Asegúrate de que apunte al correcto

const ClubsSystem = ({
  clubs,
  currentClub,
  clubMembers,
  playerData,
  loading,
  message,
  setView, // Recibir setView de App
  currentView, // Recibir la vista actual
  handleViewClubDetails,
  handleJoinClub,
  handleLeaveClub,
  fetchClubs,
  showMessage,
  setLoading
}) => {
  const [selectedClub, setSelectedClub] = useState(null);

  useEffect(() => {
    if (currentClub) {
      setSelectedClub(currentClub);
    }
  }, [currentClub]);

  const handleSelectClub = (club) => {
    setSelectedClub(club);
    handleViewClubDetails(club);
    setView('club_details'); // Usar setView de App
  };

  const handleBackToClubsList = () => {
    setSelectedClub(null);
    setView('clubs'); // Usar setView de App
    if (fetchClubs) fetchClubs();
  };

  const renderView = () => {
    // Usar currentView en lugar de internalView
    switch (currentView) {
      case 'clubs':
        return (
          <ClubsView
            clubs={clubs}
            handleViewClubDetails={handleSelectClub}
            handleJoinClub={handleJoinClub}
            playerData={playerData}
            loading={loading}
            message={message}
            setView={setView} // Pasar setView
          />
        );
      
      case 'create_club':
        return (
          <CreateClubView
            setView={setView} // Pasar setView
            onBack={() => setView('clubs')} // Usar setView
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
            setView={setView} // Pasar setView en lugar de setView
            onBackToClubs={handleBackToClubsList}
          />
        );
      
      case 'club_missions':
        return (
          <ClubMissionsView
            currentClub={selectedClub}
            setView={setView} // Pasar setView
            isLeader={playerData.club_id === selectedClub?.id && selectedClub?.owner_id === playerData.id}
            onBackToClubDetails={() => setView('club_details')} // Usar setView
          />
        );
      
      default:
        return <ClubsView 
          clubs={clubs}
          handleViewClubDetails={handleSelectClub}
          handleJoinClub={handleJoinClub}
          playerData={playerData}
          loading={loading}
          message={message}
          setView={setView}
        />;
    }
  };

  return renderView();
};

export default ClubsSystem;