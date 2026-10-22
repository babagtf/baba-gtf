import { Alert, Button, Card, Divider, Typography } from 'antd';
import { GoogleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';

const { Title, Text } = Typography;

export function Login() {
  const loginGoogle = useAuthStore((s) => s.loginGoogle);
  const loading = useAuthStore((s) => s.loading);
  const erro = useAuthStore((s) => s.erro);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #1b5e20 0%, #061a06 100%)',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Elemento decorativo: Linhas de campo sutis no fundo */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '150vw',
          height: '150vw',
          border: '2px solid rgba(255,255,255,0.03)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100vw',
          height: '100vw',
          border: '2px solid rgba(255,255,255,0.02)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <Card
        style={{
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          padding: '24px 12px',
          borderRadius: 20,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255,255,255,0.2)',
          zIndex: 1,
        }}
        styles={{ body: { padding: '40px 24px' } }}
      >
        {/* Logo */}
               {/* Logo */}
        <img
          src="./icon-192.png"
          alt="BABA GTF Logo"
          style={{
            width: 120,
            height: 120,
            objectFit: 'contain',
            marginBottom: 16,
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))',
            borderRadius: 24,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/53/53283.png';
          }}
        />

        <Title level={2} style={{ color: '#1b5e20', marginBottom: 4, fontWeight: 800, letterSpacing: -0.5 }}>
          DIRETORIA
        </Title>
        
        <Text type="secondary" style={{ display: 'block', marginBottom: 32, fontSize: 15 }}>
          Gestão de Mensalidades e Eventos
        </Text>

        {erro && (
          <Alert
            type="error"
            showIcon
            message={erro}
            style={{
              marginBottom: 24,
              textAlign: 'left',
              borderRadius: 8,
              border: '1px solid #ffcdd2',
              background: '#ffebee',
            }}
          />
        )}

        <Button
          size="large"
          icon={<GoogleOutlined style={{ color: '#DB4437' }} />}
          loading={loading}
          onClick={() => loginGoogle()}
          block
          style={{
            height: 48,
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            color: '#333',
            border: '1px solid #d9d9d9',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          Entrar com Google
        </Button>

        <Divider style={{ margin: '32px 0 24px', borderColor: '#eee' }}>
          <SafetyCertificateOutlined style={{ color: '#bbb' }} />
        </Divider>

        <Text
          type="secondary"
          style={{ display: 'block', fontSize: 12, color: '#888', lineHeight: 1.5 }}
        >
          Acesso restrito e monitorado.
          <br />
          Apenas contas autorizadas pela diretoria.
        </Text>
      </Card>
    </div>
  );
}