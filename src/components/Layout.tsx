import { Layout as AntLayout, Menu, Button, Space, Typography, App } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { saldoAtual } from '../lib/calculos';
import { fmtBR } from '../lib/format';

const { Header, Content } = AntLayout;
const { Text } = Typography;

const menuItems = [
  { key: '/', label: '📊 Dashboard' },
  { key: '/grade', label: '📋 Grade' },
  { key: '/associados', label: '👥 Associados' },
  { key: '/lancamentos', label: '💰 Lançamentos' },
  { key: '/despesas', label: '📉 Despesas' },
  { key: '/campanha', label: '🏆 Confra' },
  { key: '/relatorios', label: '📈 Relatórios' },
  { key: '/config', label: '⚙️ Config' },
];

export function Layout() {
  const { modal } = App.useApp();
  const state = useAppStore((s) => s.state);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  
  const hasUnsavedChanges = useUIStore((s) => s.hasUnsavedChanges);
  const setHasUnsavedChanges = useUIStore((s) => s.setHasUnsavedChanges);

  const location = useLocation();
  const navigate = useNavigate();

  // Intercepta o clique no Menu
  const handleMenuClick = (e: { key: string }) => {
    const targetPath = e.key;
    if (targetPath === location.pathname) return;

    if (hasUnsavedChanges) {
      modal.confirm({
        title: 'Descartar alterações?',
        content: 'Você tem alterações não salvas nas Configurações. Se sair agora, essas alterações serão perdidas.',
        okText: 'Sair e descartar',
        okButtonProps: { danger: true },
        cancelText: 'Continuar editando',
        onOk: () => {
          setHasUnsavedChanges(false);
          navigate(targetPath);
        },
      });
    } else {
      navigate(targetPath);
    }
  };

  // Intercepta o botão Sair
  const handleLogout = () => {
    if (hasUnsavedChanges) {
      modal.confirm({
        title: 'Descartar alterações e sair?',
        content: 'Você tem alterações não salvas nas Configurações. Se sair agora, elas serão perdidas.',
        okText: 'Sair e descartar',
        okButtonProps: { danger: true },
        cancelText: 'Cancelar',
        onOk: () => {
          setHasUnsavedChanges(false);
          logout();
        },
      });
      return;
    }

    modal.confirm({
      title: 'Sair do sistema',
      content: 'Tem certeza que deseja sair do BABA GTF?',
      okText: 'Sair',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () => logout(),
    });
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          gap: 16,
          flexWrap: 'wrap',
          height: 'auto',
          minHeight: 64,
          lineHeight: 1.4,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        <Space size="middle" align="center">
          <img
            src="./icon-192.png"
            alt="Logo BABA GTF"
            style={{
              width: 42,
              height: 42,
              objectFit: 'contain',
              filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.4))',
            }}
          />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
              BABA GTF
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
              Gestão de Mensalidades e Eventos
            </div>
          </div>
        </Space>

        <Space size="middle" wrap>
          <Text
            style={{
              background: 'rgba(255,255,255,0.18)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 20,
              fontWeight: 700,
              fontSize: 14,
              border: '1px solid rgba(255,255,255,0.25)',
            }}
            title={`Saldo em ${state.config.anoExercicio}`}
          >
            {fmtBR(saldoAtual(state))}
          </Text>
          <Button icon={<LogoutOutlined />} onClick={handleLogout} ghost>
            Sair
          </Button>
        </Space>
      </Header>

      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          background: '#fff',
          borderBottom: '2px solid #dcedc8',
          padding: '0 24px',
          fontSize: 13,
        }}
      />

      <Content
        style={{
          background: '#f1f8e9',
          minHeight: 'calc(100vh - 64px - 46px)',
          width: '100%',
        }}
      >
        <div style={{ maxWidth: 1920, margin: '0 auto', padding: '20px' }}>
          {user && (
            <div style={{ marginBottom: 12, fontSize: 12, color: '#6b7f6b' }}>
              Conectado como <strong>{user.email}</strong>
            </div>
          )}
          <Outlet />
        </div>
      </Content>
    </AntLayout>
  );
}