import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPageWithTabs from './pages/DashboardPageWithTabs';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return user ? <DashboardPageWithTabs /> : <LoginPage />;
}

export default App;
