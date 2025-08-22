import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import InventoryView from './views/InventoryView';
import MissionsView from './views/MissionsView';
import MarketView from './views/MarketView';
import SellItemView from './views/SellItemView';
import TransferView from './views/TransferView';
import ChatView from './views/ChatView';
import './styles/App.css';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [view, setView] = useState('dashboard'); // vista actual
  const [message, setMessage] = useState('');

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="main-background">
        <div className="app-container">
          <p className="loading-text">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <AuthView
        setSession={setSession}
        message={message}
        showMessage={showMessage}
        setLoading={setLoading}
      />
    );
  }

  // Renderizado modular según vista
  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView setView={setView} />;
      case 'inventory': return <InventoryView setView={setView} showMessage={showMessage} />;
      case 'missions': return <MissionsView setView={setView} showMessage={showMessage} />;
      case 'market': return <MarketView setView={setView} showMessage={showMessage} />;
      case 'sell_item': return <SellItemView setView={setView} showMessage={showMessage} />;
      case 'transfer': return <TransferView setView={setView} showMessage={showMessage} />;
      case 'chat': return <ChatView setView={setView} />;
      default: return <DashboardView setView={setView} />;
    }
  };

  return (
    <div className="main-background">
      {renderView()}
    </div>
  );
}
