import { Layout as AntLayout, Menu, Button, Space, Typography, Select } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { saldoAtual, getAnosDisponiveis } from '../lib/calculos';
import { fmtBR } from '../lib/format';

const { Header, Content } = AntLayout;
const { Text } = Typography;

const menuItems = [
  { key: '/', label: <NavLink to="/">📊 Dashboard</NavLink> },
  { key: '/grade', label: <NavLink to="/grade">📋 Grade</NavLink> },
  { key: '/associados', label: <NavLink to="/associados">👥 Associados</NavLink> },
  { key: '/lancamentos', label: <NavLink to="/lancamentos">💰 Lançamentos</NavLink> },
  { key: '/despesas', label: <NavLink to="/despesas">📉 Despesas</NavLink> },
  { key: '/campanha', label: <NavLink to="/campanha">🏆 Confra</NavLink> },
  { key: '/relatorios', label: <NavLink to="/relatorios">📈 Relatórios</NavLink> },
  { key: '/config', label: <NavLink to="/config">⚙️ Config</NavLink> },
];

export function Layout() {
  const state = useAppStore((s) => s.state);
  const anoVisualizado = useAppStore((s) => s.anoVisualizado);
  const setAnoVisualizado = useAppStore((s) => s.setAnoVisualizado);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();

  const anos = getAnosDisponiveis(state);

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
          <Space size="small" align="center">
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Ano:</span>
            <Select
              value={anoVisualizado}
              onChange={setAnoVisualizado}
              size="small"
              style={{ width: 90 }}
              options={anos.map((a) => ({ value: a, label: String(a) }))}
            />
          </Space>
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
            title={`Saldo em ${anoVisualizado}`}
          >
            {fmtBR(saldoAtual(state, anoVisualizado))}
          </Text>
          <Button icon={<LogoutOutlined />} onClick={() => logout()} ghost>
            Sair
          </Button>
        </Space>
      </Header>

      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{
          background: '#fff',
          borderBottom: '2px solid #dcedc8',
          padding: '0 24px',
          fontSize: 13,
        }}
      />

      <Content
        style={{
          maxWidth: 1400,
          width: '100%',
          margin: '0 auto',
          padding: '20px',
          background: '#f1f8e9',
          minHeight: 'calc(100vh - 64px - 46px)',
        }}
      >
        {user && (
          <div style={{ marginBottom: 12, fontSize: 12, color: '#6b7f6b' }}>
            Conectado como <strong>{user.email}</strong>
          </div>
        )}
        <Outlet />
      </Content>
    </AntLayout>
  );
}