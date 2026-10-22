import { useState, useMemo } from 'react';
import {
  Card, Row, Col, Statistic, Progress, Button, Table, Tag, Space, Modal, Input,
  InputNumber, Tabs, App,
} from 'antd';
import { EditOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppStore } from '../store/useAppStore';
import { fmtBR, brDate } from '../lib/format';
import type { Associado, Lancamento } from '../types';
import { PagamentoFestaModal } from '../components/PagamentoFestaModal';
import { AuditBadges } from '../components/AuditBadges';
import { getAnularFields } from '../lib/audit';

export function Campanha() {
  const { message } = App.useApp();
  const state = useAppStore((s) => s.state);
  const setState = useAppStore((s) => s.setState);

  const [editandoNome, setEditandoNome] = useState(false);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [nomeDraft, setNomeDraft] = useState('');
  const [metaDraft, setMetaDraft] = useState(0);
  const [pagando, setPagando] = useState<Associado | null>(null);
  const [detalhe, setDetalhe] = useState<Associado | null>(null);
  const [tab, setTab] = useState<'todos' | 'pagaram' | 'pendentes'>('todos');

  const festas = useMemo(
    () =>
      state.lancamentos.filter(
        (l) =>
          l.tipo === 'festa' &&
          !l.anulado &&
          l.competencia?.ano === state.config.anoExercicio
      ),
    [state.lancamentos, state.config.anoExercicio],
  );

  const arrecadado = festas.reduce((s, l) => s + l.valor, 0);
  const meta = state.campanha.meta;
  const pct = meta > 0 ? Math.min(100, (arrecadado / meta) * 100) : 0;
  const faltam = meta > 0 ? Math.max(0, meta - arrecadado) : 0;

  const porAssociado = useMemo(() => {
    return state.associados.map((a) => {
      const pagamentos = festas.filter((l) => l.associadoId === a.id);
      const total = pagamentos.reduce((s, l) => s + l.valor, 0);
      return { assoc: a, total, pagamentos };
    });
  }, [state.associados, festas]);

  const pagantes = porAssociado.filter((x) => x.total > 0);
  const pendentes = porAssociado.filter((x) => x.total === 0);

  const lista =
    tab === 'pagaram' ? pagantes : tab === 'pendentes' ? pendentes : porAssociado;

  const abrirEdicaoNome = () => {
    setNomeDraft(state.campanha.nome);
    setEditandoNome(true);
  };

  const salvarNome = () => {
    if (!nomeDraft.trim()) {
      message.error('Nome não pode ser vazio');
      return;
    }
    setState((s) => ({
      ...s,
      campanha: { ...s.campanha, nome: nomeDraft.trim() },
    }));
    message.success('Nome atualizado');
    setEditandoNome(false);
  };

  const abrirEdicaoMeta = () => {
    setMetaDraft(state.campanha.meta);
    setEditandoMeta(true);
  };

  const salvarMeta = () => {
    if (metaDraft < 0) {
      message.error('Meta não pode ser negativa');
      return;
    }
    setState((s) => ({
      ...s,
      campanha: { ...s.campanha, meta: metaDraft },
    }));
    message.success('Meta atualizada');
    setEditandoMeta(false);
  };

  const anularPagamento = (l: Lancamento) => {
    Modal.confirm({
      title: 'Anular este pagamento?',
      content: `Anular ${fmtBR(l.valor)} de ${brDate(l.data)}?`,
      okText: 'Anular',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () => {
        setState((s) => ({
          ...s,
          lancamentos: s.lancamentos.map((x) =>
            x.id === l.id
              ? {
                  ...x,
                  anulado: true,
                  ...getAnularFields(),
                  motivoAnulacao: 'Anulado pela tela de campanha',
                }
              : x,
          ),
        }));
        message.success('Pagamento anulado');
        setDetalhe(null);
      },
    });
  };

  const columns = [
    {
      title: 'Associado',
      key: 'nome',
      sorter: (a: any, b: any) => a.assoc.nome.localeCompare(b.assoc.nome),
      render: (_: unknown, r: any) => (
        <span style={{ fontWeight: 500 }}>{r.assoc.nome}</span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      filters: [
        { text: 'Pago', value: 'pago' },
        { text: 'Pendente', value: 'pendente' },
      ],
      onFilter: (v: any, r: any) =>
        v === 'pago' ? r.total > 0 : r.total === 0,
      render: (_: unknown, r: any) =>
        r.total > 0 ? (
          <Tag color="success">✅ Pago</Tag>
        ) : (
          <Tag color="warning">⏳ Pendente</Tag>
        ),
    },
    {
      title: 'Parcelas',
      key: 'parcelas',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, r: any) =>
        r.pagamentos.length > 0 ? (
          <span
            style={{
              cursor: 'pointer',
              color: '#1b5e20',
              textDecoration: 'underline',
            }}
            onClick={() => setDetalhe(r.assoc)}
          >
            {r.pagamentos.length}×
          </span>
        ) : (
          <span style={{ color: '#aaa' }}>—</span>
        ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      width: 130,
      align: 'right' as const,
      sorter: (a: any, b: any) => a.total - b.total,
      render: (v: number) => (
        <strong style={{ color: v > 0 ? '#1b5e20' : '#aaa' }}>
          {v > 0 ? fmtBR(v) : '—'}
        </strong>
      ),
    },
    {
      title: '',
      key: 'acao',
      width: 130,
      render: (_: unknown, r: any) => (
        <Button
          size="small"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setPagando(r.assoc)}
        >
          + R$ {state.config.valorFesta}
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 28 }}>🏆</span>
              <h2
                style={{
                  fontSize: 22,
                  color: '#1b5e20',
                  margin: 0,
                  fontWeight: 700,
                }}
              >
                {state.campanha.nome}
              </h2>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={abrirEdicaoNome}
              >
                Editar
              </Button>
            </div>

            {meta > 0 ? (
              <>
                <Progress
                  percent={pct}
                  strokeColor={{
                    '0%': '#66bb6a',
                    '100%': '#1b5e20',
                  }}
                  strokeWidth={20}
                  format={(p) => (
                    <span style={{ color: '#fff', fontWeight: 700 }}>
                      {p?.toFixed(1)}%
                    </span>
                  )}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 8,
                    fontSize: 12,
                    color: '#6b7f6b',
                  }}
                >
                  <span>
                    Arrecadado: <strong style={{ color: '#1b5e20' }}>{fmtBR(arrecadado)}</strong>
                  </span>
                  <span>
                    Meta: <strong>{fmtBR(meta)}</strong>
                  </span>
                </div>
              </>
            ) : (
              <p style={{ color: '#6b7f6b', marginBottom: 0 }}>
                Defina uma meta para acompanhar o progresso.{' '}
                <Button type="link" onClick={abrirEdicaoMeta} style={{ padding: 0 }}>
                  Definir meta agora
                </Button>
              </p>
            )}
          </Col>

          <Col xs={24} md={8}>
            <div style={{ display: 'grid', gap: 8 }}>
              <Button
                block
                icon={<EditOutlined />}
                onClick={abrirEdicaoMeta}
              >
                {meta > 0 ? 'Editar meta' : 'Definir meta'}
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Arrecadado"
              value={arrecadado}
              formatter={(v) => fmtBR(Number(v))}
              valueStyle={{ color: '#1b5e20' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Faltam"
              value={faltam}
              formatter={(v) => fmtBR(Number(v))}
              valueStyle={{ color: faltam > 0 ? '#ef6c00' : '#1b5e20' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Pagantes"
              value={pagantes.length}
              suffix={`/ ${state.associados.length}`}
              valueStyle={{ color: '#1b5e20' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Pendentes"
              value={pendentes.length}
              valueStyle={{ color: pendentes.length > 0 ? '#ef6c00' : '#1b5e20' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Contribuições por associado"
        extra={
          <Tabs
            activeKey={tab}
            onChange={(k) => setTab(k as typeof tab)}
            items={[
              { key: 'todos', label: `Todos (${porAssociado.length})` },
              { key: 'pagaram', label: `Pagaram (${pagantes.length})` },
              { key: 'pendentes', label: `Pendentes (${pendentes.length})` },
            ]}
            size="small"
            style={{ marginBottom: -16 }}
          />
        }
      >
        <Table
          dataSource={lista}
          columns={columns}
          rowKey={(r) => r.assoc.id}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        open={editandoNome}
        onCancel={() => setEditandoNome(false)}
        onOk={salvarNome}
        title="✏️ Editar nome da campanha"
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Input
          value={nomeDraft}
          onChange={(e) => setNomeDraft(e.target.value)}
          placeholder="Ex: Festa de Fim de Ano 2026"
          autoFocus
          onPressEnter={salvarNome}
        />
      </Modal>

      <Modal
        open={editandoMeta}
        onCancel={() => setEditandoMeta(false)}
        onOk={salvarMeta}
        title="✏️ Editar meta da campanha"
        okText="Salvar"
        cancelText="Cancelar"
      >
        <p style={{ color: '#6b7f6b', marginBottom: 12 }}>
          Defina o valor total que a confra precisa arrecadar.
        </p>
        <InputNumber
          value={metaDraft}
          onChange={(v) => setMetaDraft(typeof v === 'number' ? v : 0)}
          addonBefore="R$"
          min={0}
          step={50}
          style={{ width: '100%' }}
          autoFocus
          onPressEnter={salvarMeta}
        />
      </Modal>

      {pagando && (
        <PagamentoFestaModal
          assoc={pagando}
          onClose={() => setPagando(null)}
        />
      )}

      {detalhe && (
        <Modal
          open
          onCancel={() => setDetalhe(null)}
          footer={null}
          title={`Parcelas — ${detalhe.nome}`}
          width={600}
        >
          {(() => {
            const r = porAssociado.find((x) => x.assoc.id === detalhe.id);
            if (!r || r.pagamentos.length === 0) {
              return (
                <p style={{ color: '#6b7f6b' }}>
                  Nenhum pagamento registrado ainda.
                </p>
              );
            }
            return (
              <>
                <p style={{ color: '#6b7f6b', marginBottom: 16 }}>
                  Total: <strong>{fmtBR(r.total)}</strong> em{' '}
                  {r.pagamentos.length} parcela
                  {r.pagamentos.length !== 1 ? 's' : ''}
                </p>
                <Table
                  dataSource={r.pagamentos}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Data',
                      dataIndex: 'data',
                      render: (d: string) => brDate(d),
                    },
                    {
                      title: 'Valor',
                      dataIndex: 'valor',
                      align: 'right',
                      render: (v: number, l: Lancamento) => (
                        <span>
                          <strong style={{ color: '#1b5e20' }}>{fmtBR(v)}</strong>
                          <AuditBadges item={l} />
                        </span>
                      ),
                    },
                    {
                      title: 'Forma',
                      dataIndex: 'formaPagamento',
                    },
                    {
                      title: '',
                      key: 'acao',
                      width: 60,
                      render: (_: unknown, l: Lancamento) => (
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => anularPagamento(l)}
                        />
                      ),
                    },
                  ]}
                />
              </>
            );
          })()}
        </Modal>
      )}
    </>
  );
}