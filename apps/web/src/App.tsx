import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { WorkspacePage } from './pages/WorkspacePage.js';
import { api } from './services/api.js';

export function App() {
  const [user, setUser] = useState<any | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const u = await api.me();
          setUser(u);
        } catch {
          api.setToken(null);
          setUser(null);
        }
      }
      setIsInitializing(false);
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    api.setToken(null);
    setUser(null);
    setActiveDocumentId(null);
  };

  if (isInitializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Initializing HumanizePro...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={user}
        onLogout={handleLogout}
        onNavigateHome={() => setActiveDocumentId(null)}
      />

      <main style={{ flex: 1, paddingBottom: '40px' }}>
        {activeDocumentId ? (
          <WorkspacePage
            documentId={activeDocumentId}
            onBackToDashboard={() => setActiveDocumentId(null)}
          />
        ) : (
          <DashboardPage onOpenWorkspace={(id) => setActiveDocumentId(id)} />
        )}
      </main>
    </div>
  );
}
