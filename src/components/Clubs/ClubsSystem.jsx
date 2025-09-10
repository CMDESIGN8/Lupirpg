// components/Clubs/ClubsSystem.jsx
import React, { useState } from 'react';
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

  const renderView = () => {
    switch (internalView) {
      case 'clubs_list':
        return (
          <ClubsView
            clubs={clubs}
            handleViewClubDetails={(club) => {
              handleViewClubDetails(club);
              setInternalView('club_details');
            }}
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
            // pasa las props necesarias
          />
        );
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
            setView={setInternalView}
          />
        );
      case 'club_missions':
        return (
          <ClubMissionsView
            currentClub={currentClub}
            setView={setInternalView}
            isLeader={playerData.club_id === currentClub?.id && currentClub?.owner_id === playerData.id}
          />
        );
      default:
        return <ClubsView 
          clubs={clubs}
          handleViewClubDetails={(club) => {
            handleViewClubDetails(club);
            setInternalView('club_details');
          }}
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