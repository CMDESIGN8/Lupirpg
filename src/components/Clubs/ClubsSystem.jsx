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
  setView,
  handleViewClubDetails,
  handleJoinClub,
  handleLeaveClub,
  fetchClubs,
  showMessage,
  setLoading
}) => {
  const [internalView, setInternalView] = useState('clubs_list');
  const [selectedClub, setSelectedClub] = useState(null);

  useEffect(() => {
    if (currentClub) {
      setSelectedClub(currentClub);
    }
  }, [currentClub]);

  const handleSelectClub = (club) => {
    setSelectedClub(club);
    handleViewClubDetails(club);
    setInternalView('club_details');
  };

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
            setInternalView={setInternalView} // ✅ Pasar correctamente
            onBackToClubs={handleBackToClubsList}
          />
        );
      
      case 'club_missions':
        return (
          <ClubMissionsView
            currentClub={selectedClub}
            setInternalView={setInternalView}
            isLeader={playerData.club_id === selectedClub?.id && selectedClub?.owner_id === playerData.id}
            onBackToClubDetails={() => setInternalView('club_details')}
          />
        );
      
      default:
        return <ClubsView {...this.props} />;
    }
  };

  return renderView();
};

export default ClubsSystem;