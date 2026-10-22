import { useState, useMemo } from 'react';
import {
  Card, Table, Input, Select, Button, Space, Tag, Modal, Switch, App,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppStore } from '../store/useAppStore';
import { fmtBR, brDate, categoriaLabel, months } from '../lib/format';
import type { Despesa } from '../types';
import { DespesaEditModal } from '../components/DespesaEditModal';
import { AuditBadges } from '../components/AuditBadges';
import { getAuditFields, getAnularFields } from '../lib/audit';

const CORES_STAT: Record<string, string> = {
  juiz: '#1565c0',
  goleiro: '#7b1fa2',
  bola: '#e65100',
  outras: '#6b7f6b',
};

const CORES_TAG: Record<string, string> = {
  juiz: 'blue',
  goleiro: 'purple',
  bola: 'gold',
  outras: 'default',
};

export function Despesas() {
  const { message } = App.useApp();
  const state = useAppStore((s) => s.state);
  const setState = useAppStore((s) => s.setState);

  const [q, setQ] = useState('');
  const [catFiltro, setCatFiltro] = useState('todas');
  const [mesFiltro, setMesFiltro] = useState<string>('todos');
  const [showAnuladas, setShowAnuladas] = useState(false);

  const [editando, setEditando] = useState<Despesa | 'nova' | null>(null);
  const [anulando, setAnulando] = useState<Despesa | null>(null);
  const [motivo, setMotivo] = useState('');

  const filtradas = useMemo(() => {
    return state.despesas.filter((d) => {
      if (!showAnuladas && d.anulado) return false;
      if (catFiltro !== 'todas' && d.categoria !== catFiltro) return false;
      if (mesFiltro !== 'todos') {
        const mes = String(d.data).slice(5, 7);
        if (parseInt(mes) !== parseInt(mesFiltro)) return false;
      }
      if (q) {
        const ql = q.toLowerCase();
        const desc = (d.descricao || '').toLowerCase();
        const obs = (d.observacao || '').toLowerCase();
        if (!desc.includes(ql) && !obs.includes(ql)) return false;
      }
      return true;
    });
  }, [state.despesas, q, catFiltro, mesFiltro, showAnuladas]);

  const ordenadas = useMemo(
    () => [...filtradas].sort((a, b) => b.data.localeCompare(a.data)),
    [filtradas],
  );

  const totalFiltrado = filtradas
    .filter((d) => !d.anulado)
    .reduce((s, d) => s + d.valor, 0);

  const totaisPorCategoria = useMemo(() => {
    const r: Record<string, number> = { juiz: 0, goleiro: 0, bola: 0, outras: 0 };
    state.despesas
      .filter((d) => !d.anulado)
      .forEach((d) => {
        if (r[d.categoria] !== undefined) r[d.categoria] += d.valor;
      });
    return r;
  }, [state.despesas]);

  const totalGeral =
    totaisPorCategoria.juiz +
    totaisPorCategoria.goleiro +
    totaisPorCategoria.bola +
    totaisPorCategoria.outras;

  const qtdAtivas = state.despesas.filter((d) => !d.anulado).length;

  const limparFiltros = () => {
    setQ('');
    setCatFiltro('todas');
    setMesFiltro('todos');
    setShowAnuladas(false);
  };

  const anular = () => {
    if (!anulando || motivo.trim().length < 3) {
      message.error('Motivo obrigatório (mín. 3 caracteres)');
      return;
    }
    setState((s) => ({
      ...s,
      despesas: s.despesas.map((d) =>
        d.id === anulando.id
          ? {
              ...d,
              anulado: true,
              ...getAnularFields(),
              motivoAnulacao: motivo.trim(),
            }
          : d,
      ),
    }));
    message.success('Despesa anulada');
    setAnulando(null);
    setMotivo('');
  };

  const reativar = (d: Despesa) => {
    setState((s) => ({
      ...s,
      despesas: s.despesas.map((x) =>
        x.id === d.id
          ? {
              ...x,
              anulado: false,
              anuladoEm: undefined,
              motivoAnulacao: undefined,
              ...getAuditFields(),
            }
          : x,
      ),
    }));
    message.success('Despesa reativada');
  };

  const columns = [
    {
      title: 'Data',
      dataIndex: 'data',
      width: 110,
      render: (d: string) => brDate(d),
    },
    {
      title: 'Categoria',
      dataIndex: 'categoria',
      width: 120,
      filters: [
        { text: 'Juiz', value: 'juiz' },
        { text: 'Goleiro', value: 'goleiro' },
        { text: 'Bola', value: 'bola' },
        { text: 'Outras', value: 'outras' },
      ],
      onFilter: (v: any, d: Despesa) => d.categoria === v,
      render: (c: string) => (
        <Tag color={CORES_TAG[c]}>{categoriaLabel[c]}</Tag>
      ),
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      render: (d: string, r: Despesa) => (
        <span style={{ textDecoration: r.anulado ? 'line-through' : 'none' }}>
          {d || <span style={{ color: '#aaa' }}>—</span>}
          <AuditBadges item={r} />
        </span>
      ),
    },
    {
      title: 'Valor',
      dataIndex: 'valor',
      width: 120,
      align: 'right' as const,
      sorter: (a: Despesa, b: Despesa) => a.valor - b.valor,
      render: (v: number, d: Despesa) => (
        <span
          style={{
            color: d.anulado ? '#999' : '#c62828',
            fontWeight: 700,
            textDecoration: d.anulado ? 'line-through' : 'none',
          }}
        >
          {fmtBR(v)}
        </span>
      ),
    },
    {
      title: 'Obs',
      dataIndex: 'observacao',
      render: (o: string) => (
        <span style={{ fontSize: 11 }}>{o || '—'}</span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: unknown, d: Despesa) =>
        d.anulado ? (
          <Tag color="red">anulada</Tag>
        ) : (
          <Tag color="success">ativa</Tag>
        ),
    },
    {
      title: '',
      key: 'acoes',
      width: 110,
      render: (_: unknown, d: Despesa) => (
        <Space size="small">
          {d.anulado ? (
            <Button size="small" onClick={() => reativar(d)} title="Reativar">
              ↩️
            </Button>
          ) : (
            <>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => setEditando(d)}
                title="Editar"
              />
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => setAnulando(d)}
                title="Anular"
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Card style={{ borderLeft: '4px solid #c62828' }}>
          <div style={{ fontSize: 11, color: '#6b7f6b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
            💸 Total Geral
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#c62828', marginTop: 4 }}>
            {fmtBR(totalGeral)}
          </div>
          <div style={{ fontSize: 11, color: '#6b7f6b', marginTop: 4 }}>
            {qtdAtivas} despesa{qtdAtivas !== 1 ? 's' : ''} ativa{qtdAtivas !== 1 ? 's' : ''}
          </div>
        </Card>

        {(['juiz', 'goleiro', 'bola', 'outras'] as const).map((cat) => (
          <Card key={cat} style={{ borderLeft: `4px solid ${CORES_STAT[cat]}` }}>
            <div style={{ fontSize: 11, color: '#6b7f6b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
              {cat === 'juiz' && '⚖️ '}
              {cat === 'goleiro' && '🧤 '}
              {cat === 'bola' && '⚽ '}
              {cat === 'outras' && '📦 '}
              {categoriaLabel[cat]}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: CORES_STAT[cat], marginTop: 4 }}>
              {fmtBR(totaisPorCategoria[cat])}
            </div>
          </Card>
        ))}
      </div>

      <Card
        title={`📉 Despesas (${state.despesas.length})`}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setEditando('nova')}
          >
            Nova
          </Button>
        }
      >
        <Space wrap style={{ width: '100%', marginBottom: 16 }}>
          <Input.Search
            placeholder="🔎 Descrição ou observação"
            allowClear
            style={{ width: 240 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select
            value={catFiltro}
            onChange={setCatFiltro}
            style={{ width: 180 }}
            options={[
              { value: 'todas', label: 'Todas as categorias' },
              { value: 'juiz', label: 'Juiz' },
              { value: 'goleiro', label: 'Goleiro' },
              { value: 'bola', label: 'Bola' },
              { value: 'outras', label: 'Outras' },
            ]}
          />
          <Select
            value={mesFiltro}
            onChange={setMesFiltro}
            style={{ width: 150 }}
            options={[
              { value: 'todos', label: 'Todos os meses' },
              ...months.map((m, i) => ({ value: String(i + 1), label: m })),
            ]}
          />
          <Space>
            <Switch
              size="small"
              checked={showAnuladas}
              onChange={setShowAnuladas}
            />
            <span style={{ fontSize: 12, color: '#6b7f6b' }}>
              Mostrar anuladas
            </span>
          </Space>
          <Button onClick={limparFiltros}>Limpar</Button>
          <span style={{ color: '#6b7f6b', fontSize: 13, marginLeft: 'auto' }}>
            {filtradas.length} de {state.despesas.length} · Total{' '}
            <strong style={{ color: '#c62828' }}>{fmtBR(totalFiltrado)}</strong>
          </span>
        </Space>

        {filtradas.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7f6b', padding: 40 }}>
            Nenhuma despesa encontrada.{' '}
            <Button type="link" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          </p>
        ) : (
          <Table
            dataSource={ordenadas}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 20, showSizeChanger: false }}
            size="small"
            scroll={{ x: 'max-content' }}
            rowClassName={(d) => (d.anulado ? 'row-anulada' : '')}
          />
        )}
      </Card>

      {editando && (
        <DespesaEditModal
          despesa={editando === 'nova' ? null : editando}
          onClose={() => setEditando(null)}
        />
      )}

      {anulando && (
        <Modal
          open
          onCancel={() => {
            setAnulando(null);
            setMotivo('');
          }}
          onOk={anular}
          title="Anular despesa"
          okText="Anular"
          okButtonProps={{ danger: true }}
          cancelText="Cancelar"
        >
          <p style={{ marginBottom: 8 }}>
            Motivo da anulação (obrigatório, mín. 3 caracteres):
          </p>
          <Input.TextArea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: despesa duplicada, valor errado…"
            rows={3}
            autoFocus
          />
        </Modal>
      )}
    </>
  );
}