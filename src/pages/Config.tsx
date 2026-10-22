import { useState, useEffect } from 'react';
import {
  Card, InputNumber, Input, Button, Space, Row, Col, Tag, App, Alert, Divider, Typography,
} from 'antd';
import {
  SaveOutlined, DownloadOutlined, ReloadOutlined, ClearOutlined, InfoCircleOutlined, LogoutOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore, isBypassAuth } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { isFirebaseEnabled } from '../firebase';
import { fmtBR, todayISO } from '../lib/format';
import { receitaTotal, despesaTotal, saldoAtual } from '../lib/calculos';

const { Text } = Typography;

export function ConfigPage() {
  const { message, modal } = App.useApp();
  const state = useAppStore((s) => s.state);
  const setState = useAppStore((s) => s.setState);
  const clearLocalAndReload = useAppStore((s) => s.clearLocalAndReload);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  
  const setHasUnsavedChanges = useUIStore((s) => s.setHasUnsavedChanges);

  const [ano, setAno] = useState(state.config.anoExercicio);
  const [mensalidade, setMensalidade] = useState(state.config.mensalidadePadrao);
  const [festa, setFesta] = useState(state.config.valorFesta);
  const [saldo, setSaldo] = useState(state.config.saldoAbertura);
  const [pin, setPin] = useState(state.config.pin);
  const [saving, setSaving] = useState(false);

  const temAlteracao =
    ano !== state.config.anoExercicio ||
    mensalidade !== state.config.mensalidadePadrao ||
    festa !== state.config.valorFesta ||
    saldo !== state.config.saldoAbertura ||
    pin !== state.config.pin;

  useEffect(() => {
    setHasUnsavedChanges(temAlteracao);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (temAlteracao) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setHasUnsavedChanges(false);
    };
  }, [temAlteracao, setHasUnsavedChanges]);

  const handleLogout = () => {
    modal.confirm({
      title: 'Sair do sistema',
      content: 'Tem certeza que deseja sair do BABA GTF?',
      okText: 'Sair',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () => logout(),
    });
  };

  const salvar = () => {
    if (mensalidade < 0 || festa < 0 || saldo < 0) {
      message.error('Valores não podem ser negativos');
      return;
    }
    if (pin.length < 4 || pin.length > 6) {
      message.error('PIN deve ter entre 4 e 6 caracteres');
      return;
    }

    modal.confirm({
      title: 'Aplicar alterações no sistema?',
      content: (
        <div>
          <p>Você está prestes a alterar as configurações globais do BABA GTF.</p>
          <p>O sistema será recarregado para aplicar as mudanças.</p>
          {ano !== state.config.anoExercicio && (
            <Alert
              type="warning"
              showIcon
              message={`O ano de exercício será alterado de ${state.config.anoExercicio} para ${ano}.`}
              style={{ marginTop: 12 }}
            />
          )}
        </div>
      ),
      width: 600,
      okText: 'Sim, aplicar',
      cancelText: 'Cancelar',
      onOk: async () => {
        setSaving(true);
        await setState((s) => ({
          ...s,
          config: {
            ...s.config,
            anoExercicio: ano,
            mensalidadePadrao: mensalidade,
            valorFesta: festa,
            saldoAbertura: saldo,
            pin,
          },
        }));
        
        setHasUnsavedChanges(false);
        message.success('Configurações salvas! Recarregando o sistema...');
        
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
            }
            if ('caches' in window) {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map((name) => caches.delete(name)));
            }
          } catch (e) {
            console.warn('Não foi possível limpar o cache do Service Worker:', e);
          }
        }

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
    });
  };

  const restaurarDrafts = () => {
    setAno(state.config.anoExercicio);
    setMensalidade(state.config.mensalidadePadrao);
    setFesta(state.config.valorFesta);
    setSaldo(state.config.saldoAbertura);
    setPin(state.config.pin);
  };

  /* ===== EXPORTAR BACKUP ===== */
  const exportarJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `baba-gtf-backup-${todayISO()}.json`;
    a.click();
    message.success('Backup exportado com sucesso');
  };

  /* ===== MANUTENÇÃO ===== */
  const limparFiltros = () => {
    try {
      ['grade', 'lancamentos', 'despesas', 'associados', 'relatorios'].forEach(
        (t) => sessionStorage.removeItem('baba-filters-' + t),
      );
      message.success('Filtros limpos. As abas voltarão ao padrão.');
    } catch {
      message.error('Não foi possível limpar os filtros');
    }
  };

  const limparCache = () => {
    modal.confirm({
      title: 'Limpar cache local?',
      content:
        'Isso força o app a recarregar os dados do ' +
        (isBypassAuth ? 'localStorage (vai resetar)' : 'Firestore (seguro)') +
        '. Útil se os dados parecerem dessincronizados.',
      okText: 'Limpar e recarregar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        await clearLocalAndReload();
        message.success('Cache limpo e dados recarregados');
      },
    });
  };

  const modoLabel = isBypassAuth
    ? { label: '🛠️ Desenvolvimento (bypass)', color: 'orange' as const }
    : isFirebaseEnabled
    ? { label: '🔥 Firebase', color: 'green' as const }
    : { label: '💾 Local', color: 'default' as const };

  return (
    <>
      {/* HEADER DA CONFIGURAÇÃO */}
      <Card style={{ marginBottom: 16, background: '#f9fbe7' }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space direction="vertical" size={4}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1b5e20' }}>
                ⚙️ BABA GTF · Configurações
              </div>
              <Space wrap size="small">
                <Tag color={modoLabel.color}>{modoLabel.label}</Tag>
                <Tag color="default">{state.associados.length} associados</Tag>
                <Tag color="default">{state.lancamentos.length} lançamentos</Tag>
                <Tag color="default">{state.despesas.length} despesas</Tag>
                <Tag color="default">{state.snapshots.length} snapshots</Tag>
              </Space>
              {user && (
                <div style={{ fontSize: 12, color: '#6b7f6b', marginTop: 4 }}>
                  Conectado como <strong>{user.email}</strong>
                </div>
              )}
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Button 
              onClick={handleLogout} 
              danger 
              type="text" 
              icon={<LogoutOutlined />}
            >
              Sair da conta
            </Button>
          </Col>
        </Row>
      </Card>

      {/* CONFIGURAÇÕES GERAIS */}
      <Card
        title="⚙️ Configurações gerais"
        extra={temAlteracao && <Tag color="warning">Alterações não salvas</Tag>}
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
              <span style={{ color: '#6b7f6b', fontWeight: 600 }}>Ano do exercício</span>
              <InputNumber
                value={ano}
                onChange={(v) => setAno(typeof v === 'number' ? v : 2026)}
                min={2020}
                max={2100}
                style={{ width: '100%' }}
              />
            </label>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
              <span style={{ color: '#6b7f6b', fontWeight: 600 }}>Mensalidade padrão</span>
              <InputNumber
                value={mensalidade}
                onChange={(v) => setMensalidade(typeof v === 'number' ? v : 30)}
                addonBefore="R$"
                min={0}
                step={5}
                style={{ width: '100%' }}
              />
            </label>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
              <span style={{ color: '#6b7f6b', fontWeight: 600 }}>Valor festa / confra</span>
              <InputNumber
                value={festa}
                onChange={(v) => setFesta(typeof v === 'number' ? v : 30)}
                addonBefore="R$"
                min={0}
                step={5}
                style={{ width: '100%' }}
              />
            </label>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
              <span style={{ color: '#6b7f6b', fontWeight: 600 }}>Saldo de abertura</span>
              <InputNumber
                value={saldo}
                onChange={(v) => setSaldo(typeof v === 'number' ? v : 0)}
                addonBefore="R$"
                min={0}
                step={10}
                style={{ width: '100%' }}
              />
            </label>
          </Col>
        </Row>

        <Divider />

        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
              <span style={{ color: '#6b7f6b', fontWeight: 600 }}>PIN de acesso secundário</span>
              <Input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="4 a 6 dígitos"
                maxLength={6}
                style={{ letterSpacing: 6, fontWeight: 700, fontFamily: 'monospace' }}
              />
            </label>
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
              {isBypassAuth
                ? 'Ativo: em modo bypass, este é o único acesso.'
                : 'Opcional: com Google Auth ativo, o PIN não é usado. Guarde como reserva.'}
            </Text>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ fontSize: 12, color: '#6b7f6b', lineHeight: 1.8 }}>
              <p><strong>Saldo atual:</strong> {fmtBR(saldoAtual(state))}</p>
              <p><strong>Receitas totais:</strong> {fmtBR(receitaTotal(state))}</p>
              <p><strong>Despesas totais:</strong> {fmtBR(despesaTotal(state))}</p>
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            {temAlteracao && (
              <Button onClick={restaurarDrafts} size="middle">
                Cancelar alterações
              </Button>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={salvar}
              loading={saving}
              disabled={!temAlteracao}
              size="middle"
            >
              Salvar alterações
            </Button>
          </Space>
        </div>
      </Card>

      {/* BACKUP */}
      <Card title="💾 Backup" style={{ marginBottom: 16 }}>
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Text type="secondary">
              Baixe um arquivo JSON com todos os dados do sistema. É sua rede de segurança contra erros humanos.
            </Text>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={exportarJSON}
              size="middle"
            >
              Exportar backup JSON
            </Button>
          </Col>
        </Row>
      </Card>

      {/* MANUTENÇÃO */}
      <Card title="🔧 Manutenção" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <Text strong>Limpar filtros salvos</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Reseta os filtros de todas as abas ao padrão.
              </Text>
            </div>
            <Button icon={<ClearOutlined />} onClick={limparFiltros} size="middle">
              Limpar Filtros
            </Button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <Text strong>Limpar cache e recarregar</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {isBypassAuth
                  ? 'Cuidado: em modo bypass, isso reseta os dados.'
                  : 'Recarrega os dados do Firestore. Seguro.'}
              </Text>
            </div>
            <Button icon={<ReloadOutlined />} onClick={limparCache} size="middle">
              Limpar Cache
            </Button>
          </div>
        </Space>
      </Card>

      {/* SOBRE */}
      <Card style={{ marginTop: 16, background: '#fafafa' }}>
        <Space direction="vertical" size={4}>
          <div style={{ fontSize: 13, color: '#6b7f6b' }}>
            <InfoCircleOutlined /> <strong>BABA GTF</strong> · Controle de Mensalidades {state.config.anoExercicio}
          </div>
          <div style={{ fontSize: 11, color: '#999' }}>
            Versão 3.0 · React + Vite + Ant Design + Zustand ·{' '}
            {isBypassAuth ? 'Modo dev (bypass)' : isFirebaseEnabled ? 'Firebase conectado' : 'Local'}
          </div>
        </Space>
      </Card>
    </>
  );
}