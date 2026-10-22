import { useEffect } from 'react';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { futebolTheme } from './theme';
import { useAuthStore } from './store/useAuthStore';
import { useAppStore } from './store/useAppStore';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Grade } from './pages/Grade';
import { Associados } from './pages/Associados';
import { Lancamentos } from './pages/Lancamentos';
import { Despesas } from './pages/Despesas';
import { Campanha } from './pages/Campanha';
import { Relatorios } from './pages/Relatorios';
import { ConfigPage } from './pages/Config';
import { Loading } from './components/Loading';

export default function App() {
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const initAuth = useAuthStore((s) => s.init);

  const appLoading = useAppStore((s) => s.loading);
  const initApp = useAppStore((s) => s.init);

  // Inicializa auth (bypass ou Google)
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Quando auth resolve com um usuário, carrega dados
  useEffect(() => {
    if (!authLoading && user) {
      initApp();
    }
  }, [authLoading, user, initApp]);

  let conteudo;

  if (authLoading) {
    conteudo = <Loading />;
  } else if (!user) {
    conteudo = <Login />;
  } else if (appLoading) {
    conteudo = <Loading />;
  } else {
    conteudo = (
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/grade" element={<Grade />} />
            <Route path="/associados" element={<Associados />} />
            <Route path="/lancamentos" element={<Lancamentos />} />
            <Route path="/despesas" element={<Despesas />} />
            <Route path="/campanha" element={<Campanha />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    );
  }

  return (
    <ConfigProvider theme={futebolTheme}>
      <AntApp>{conteudo}</AntApp>
    </ConfigProvider>
  );
}