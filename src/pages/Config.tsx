import { useState } from 'react';
import {
  Card, InputNumber, Input, Button, Space, Row, Col, Tag, App, Alert, Divider,
} from 'antd';
import {
  SaveOutlined, DownloadOutlined, UploadOutlined, ReloadOutlined,
  ClearOutlined, DeleteOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore, isBypassAuth } from '../store/useAuthStore';
import { isFirebaseEnabled } from '../firebase';
import { fmtBR, todayISO } from '../lib/format';
import { receitaTotal, despesaTotal, saldoAtual } from '../lib/calculos';
import type { AppState } from '../types';

export function ConfigPage() {
  const { message, modal } = App.useApp();
  const state = useAppStore((s) => s.state);
  const setState = useAppStore((s) => s.setState);
  const reset = useAppStore((s) => s.reset);
  const clearLocalAndReload = useAppStore((s) => s.clearLocalAndReload);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Draft dos campos de configuração (só grava no Salvar)
  const [ano, setAno] = useState(state.config.anoExercicio);
  const [mensalidade, setMensalidade] = useState(state.config.mensalidadePadrao);
  const [festa, setFesta] = useState(state.config.valorFesta);
  const [saldo, setSaldo] = useState(state.config.saldoAbertura);
  const [pin, setPin] = useState(state.config.pin);

  const temAlteracao =
    ano !== state.config.anoExercicio ||
    mensalidade !== state.config.mensalidadePadrao ||
    festa !== state.config.valorFesta ||
    saldo !== state.config.saldoAbertura ||
    pin !== state.config.pin;

  const salvar = () => {
    if (mensalidade < 0 || festa < 0 || saldo < 0) {
      message.error('Valores não podem ser negativos');
      return;
    }
    if (pin.length < 4 || pin.length > 6) {
      message.error('PIN deve ter entre 4 e 6 caracteres');
      return;
    }
    setState((s) => ({
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
    message.success('Configurações salvas');
  };

  const restaurarDrafts = () => {
    setAno(state.config.anoExercicio);
    setMensalidade(state.config.mensalidadePadrao);
    setFesta(state.config.valorFesta);
    setSaldo(state.config.saldoAbertura);
    setPin(state.config.pin);
  };

  /* ===== BACKUP ===== */
  const exportarJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `baba-gtf-backup-${todayISO()}.json`;
    a.click();
    message.success('Backup exportado');
  };

  const importarJSON = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    ev.target.value = '';

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Validação mínima
        if (
          !data.config ||
          !Array.isArray(data.associados) ||
          !Array.isArray(data.lancamentos) ||
          !Array.isArray(data.despesas)
        ) {
          throw new Error('Arquivo inválido: faltam campos obrigatórios');
        }

        modal.confirm({
          title: '⚠️ Confirmar importação?',
          content: (
            <div style={{ lineHeight: 1.8 }}>
              <p>Isso vai <strong>substituir TODOS os dados atuais</strong>:</p>
              <div
                style={{
                  background: '#f1f8e9',
                  padding: 12,
                  borderRadius: 6,
                  marginTop: 8,
                  fontSize: 13,
                }}
              >
                <p><strong>Arquivo importado:</strong></p>
                <p>• Associados: <strong>{data.associados.length}</strong></p>
                <p>• Lançamentos: <strong>{data.lancamentos.length}</strong></p>
                <p>• Despesas: <strong>{data.despesas.length}</strong></p>
                <p>• Snapshots: <strong>{data.snapshots?.length || 0}</strong></p>
                <Divider style={{ margin: '8px 0' }} />
                <p><strong>Dados atuais:</strong></p>
                <p>• Associados: {state.associados.length}</p>
                <p>• Lançamentos: {state.lancamentos.length}</p>
                <p>• Despesas: {state.despesas.length}</p>
              </div>
              <p style={{ marginTop: 12, color: '#c62828', fontWeight: 600 }}>
                ⚠️ Não há como desfazer. Exporte um backup antes se estiver em dúvida.
              </p>
            </div>
          ),
          okText: 'Importar e substituir',
          okButtonProps: { danger: true },
          cancelText: 'Cancelar',
          onOk: () => {
            setState(() => data as AppState);
            message.success('Dados importados com sucesso');
            // Sincroniza os drafts com os novos valores
            setAno(data.config.anoExercicio);
            setMensalidade(data.config.mensalidadePadrao);
            setFesta(data.config.valorFesta);
            setSaldo(data.config.saldoAbertura);
            setPin(data.config.pin);
          },
        });
      } catch (err: any) {
        message.error('Erro ao importar: ' + (err.message || 'arquivo inválido'));
      }
    };
    reader.readAsText(file);
  };

  /* ===== PERIGO ===== */
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

  const resetarTudo = () => {
    modal.confirm({
      title: '🗑️ Resetar TODOS os dados?',
      content: (
        <div>
          <p>Isso apaga <strong>tudo</strong> e volta aos dados originais da planilha:</p>
          <ul style={{ marginLeft: 20, marginTop: 8, fontSize: 13 }}>
            <li>33 associados</li>
            <li>202 lançamentos</li>
            <li>21 despesas</li>
            <li>0 snapshots</li>
            <li>Configurações padrão</li>
          </ul>
          <p style={{ marginTop: 12, color: '#c62828', fontWeight: 600 }}>
            ⚠️ Ação irreversível. Exporte um backup primeiro.
          </p>
        </div>
      ),
      okText: 'Resetar tudo',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        await reset();
        restaurarDrafts();
        message.success('Dados restaurados ao padrão');
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
      {/* ===== STATUS / SOBRE ===== */}
      <Card style={{ marginBottom: 16, background: '#f9fbe7' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Space direction="vertical" size={4}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1b5e20' }}>
                ⚙️ BABA GTF · Configurações
              </div>
              <Space wrap size="small">
                <Tag color={modoLabel.color}>{modoLabel.label}</Tag>
                <Tag color="default">
                  {state.associados.length} associados
                </Tag>
                <Tag color="default">
                  {state.lancamentos.length} lançamentos
                </Tag>
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
            <Button onClick={() => logout()} danger>
              Sair da conta
            </Button>
          </Col>
        </Row>
      </Card>

      {/* ===== CONFIGURAÇÕES GERAIS ===== */}
      <Card
        title="⚙️ Configurações gerais"
        extra={
          temAlteracao && (
            <Tag color="warning">Alterações não salvas</Tag>
          )
        }
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
              <span style={{ color: '#6b7f6b', fontWeight: 600 }}>
                Ano do exercício
              </span>
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
              <span style={{ color: '#6b7f6b', fontWeight: 600 }}>
                Mensalidade padrão
              </span>
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
              <span style={{ color: '#6b7f6b', fontWeight: 600 }}>
                Valor festa / confra
              </span>
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
              <span style={{ color: '#6b7f6b', fontWeight: 600 }}>
                Saldo de abertura
              </span>
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
              <span style={{ color: '#6b7f6b', fontWeight: 600 }}>
                PIN de acesso secundário
              </span>
              <Input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="4 a 6 dígitos"
                maxLength={6}
                style={{ letterSpacing: 6, fontWeight: 700, fontFamily: 'monospace' }}
              />
            </label>
            <p style={{ fontSize: 11, color: '#6b7f6b', marginTop: 6 }}>
              {isBypassAuth
                ? 'Ativo: em modo bypass, este é o único acesso.'
                : 'Opcional: com Google Auth ativo, o PIN não é usado. Guarde como reserva para emergência.'}
            </p>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ fontSize: 12, color: '#6b7f6b', lineHeight: 1.8 }}>
              <p><strong>Saldo atual:</strong> {fmtBR(saldoAtual(state))}</p>
              <p><strong>Receitas totais:</strong> {fmtBR(receitaTotal(state))}</p>
              <p><strong>Despesas totais:</strong> {fmtBR(despesaTotal(state))}</p>
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            {temAlteracao && (
              <Button onClick={restaurarDrafts}>Cancelar alterações</Button>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={salvar}
              disabled={!temAlteracao}
            >
              Salvar alterações
            </Button>
          </Space>
        </div>
      </Card>

      {/* ===== BACKUP / RESTAURAÇÃO ===== */}
      <Card title="💾 Backup e restauração" style={{ marginBottom: 16 }}>
        <Alert
          message="Faça backup regularmente"
          description={
            isBypassAuth
              ? 'Em modo bypass, os dados ficam apenas no localStorage deste navegador. Se limpar o navegador, perde tudo. Exporte sempre antes de grandes mudanças.'
              : 'Os dados ficam no Firestore, mas um backup em arquivo é sua rede de segurança contra erros humanos (excluir algo por engano).'
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card size="small" title="⬇️ Exportar">
              <p style={{ fontSize: 13, color: '#6b7f6b', marginBottom: 12 }}>
                Baixa um arquivo JSON completo com tudo: configurações,
                associados, lançamentos, despesas e snapshots.
              </p>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={exportarJSON}
                block
              >
                Exportar backup JSON
              </Button>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" title="⬆️ Restaurar">
              <p style={{ fontSize: 13, color: '#6b7f6b', marginBottom: 12 }}>
                Importa um arquivo JSON exportado anteriormente. Vai mostrar um
                resumo antes de substituir.
              </p>
              <label
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 15px',
                  background: '#1b5e20',
                  color: '#fff',
                  borderRadius: 6,
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                <UploadOutlined /> Importar arquivo JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                  onChange={importarJSON}
                />
              </label>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* ===== MANUTENÇÃO ===== */}
      <Card title="🔧 Manutenção" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Button
              icon={<ClearOutlined />}
              onClick={limparFiltros}
              block
            >
              Limpar filtros salvos
            </Button>
            <p style={{ fontSize: 11, color: '#6b7f6b', marginTop: 6 }}>
              Reseta os filtros de todas as abas ao padrão.
            </p>
          </Col>
          <Col xs={24} sm={12}>
            <Button
              icon={<ReloadOutlined />}
              onClick={limparCache}
              block
            >
              Limpar cache e recarregar
            </Button>
            <p style={{ fontSize: 11, color: '#6b7f6b', marginTop: 6 }}>
              {isBypassAuth
                ? 'Cuidado: em modo bypass, isso reseta os dados.'
                : 'Recarrega os dados do Firestore. Seguro.'}
            </p>
          </Col>
        </Row>
      </Card>

      {/* ===== ZONA DE PERIGO ===== */}
      <Card
        title="⚠️ Zona de perigo"
        style={{ borderColor: '#ffcdd2', borderWidth: 2 }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <p style={{ color: '#c62828', fontWeight: 600, marginBottom: 4 }}>
              Resetar todos os dados
            </p>
            <p style={{ fontSize: 13, color: '#6b7f6b' }}>
              Apaga TUDO e restaura os dados originais da planilha 2026. Use
              apenas em testes ou se precisar recomeçar do zero.
            </p>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Button danger icon={<DeleteOutlined />} onClick={resetarTudo}>
              Resetar dados
            </Button>
          </Col>
        </Row>
      </Card>

      {/* ===== SOBRE ===== */}
      <Card style={{ marginTop: 16, background: '#fafafa' }}>
        <Space direction="vertical" size={4}>
          <div style={{ fontSize: 13, color: '#6b7f6b' }}>
            <InfoCircleOutlined /> <strong>BABA GTF</strong> · Controle de
            Mensalidades {state.config.anoExercicio}
          </div>
          <div style={{ fontSize: 11, color: '#999' }}>
            Versão 3.0 · React + Vite + Ant Design + Zustand ·{' '}
            {isBypassAuth
              ? 'Modo dev (bypass)'
              : isFirebaseEnabled
              ? 'Firebase conectado'
              : 'Local'}
          </div>
        </Space>
      </Card>
    </>
  );
}