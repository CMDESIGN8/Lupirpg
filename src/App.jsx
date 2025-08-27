import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import AuthView from "./views/AuthView";
import CreateCharacterView from "./views/CreateCharacterView";
import DashboardView from "./views/DashboardView";
import ClubsView from "./views/ClubsView";
import MissionsView from "./views/MissionsView";
import InventoryView from "./views/InventoryView";
import ChatView from "./views/ChatView";
import MarketplaceView from "./views/MarketplaceView";
import TrainView from "./views/TrainView";

function App() {
  const { session, player } = useAuth();

  if (!session) return <AuthView />;
  if (session && player && (!player.sport || !player.position)) {
    return <CreateCharacterView />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="/clubs" element={<ClubsView />} />
        <Route path="/missions" element={<MissionsView />} />
        <Route path="/inventory" element={<InventoryView />} />
        <Route path="/chat" element={<ChatView />} />
        <Route path="/market" element={<MarketplaceView />} />
        <Route path="/train" element={<TrainView />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
