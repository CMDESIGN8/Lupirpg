import { useAuth } from "./hooks/useAuth";
import AuthView from "./views/AuthView";
import DashboardView from "./views/DashboardView";

function App() {
  const { session, player } = useAuth();

  if (!session) return <AuthView />;
  if (session && !player) return <p>Cargando personaje...</p>;
  return <DashboardView />;
}

export default App;
