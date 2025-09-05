// components/Clubs/ClubsSystem.jsx
import React from 'react';
import ClubsView from '../Views/ClubsView';
import CreateClubView from '../Views/CreateClubView';
import ClubDetailsView from '../Views/ClubDetailsView';

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
  const [internalView, setInternalView] = React.useState('clubs_list');

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
            playerData={playerData}
            fetchClubs={fetchClubs}
            loading={loading}
            message={message}
            setView={setInternalView}
          />
        );
      default:
        return <ClubsView {...props} />;
    }
  };

  return renderView();
};

export default ClubsSystem;