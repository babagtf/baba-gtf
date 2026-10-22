import { useState, useMemo } from 'react';
import {
  Card, Table, Input, Select, Modal, Button, InputNumber, Space, Tag, App,
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppStore } from '../store/useAppStore';
import { lancAssocMes, totalAssoc, getMesRef } from '../lib/calculos';
import {
  fmtBR, monthShort, monthName, tipoLabel, todayISO, uid,
} from '../lib/format';
import { AssociadoDetalhe } from '../components/AssociadoDetalhe';
import type { Associado, Lancamento } from '../types';
import { getAuditFields, getAnularFields } from '../lib/audit';
import { AuditBadges } from '../components/AuditBadges';
import { useSessionState } from '../hooks/useSessionState';

export function Grade() {
  const state = useAppStore((s) => s.state);
  const mesRef = getMesRef(state);

  const [busca, setBusca] = useSessionState('grade_busca', '');
  const [statusFiltro, setStatusFiltro] = useSessionState('grade_status', 'todos');
  const [cellSel, setCellSel] = useState<{ assoc: Associado; mes: number } | null>(null);
  const [detailAssoc, setDetailAssoc] = useState<Associado | null>(null);

  const associadosFiltrados = useMemo(() => {
    return state.associados.filter((a) => {
      if (busca) {
        const q = busca.toLowerCase();
        const nomeOk =
          a.nome.toLowerCase().includes(q) ||
          (a.apelido || '').toLowerCase().includes(q);
        if (!nomeOk) return false;
      }
      if (statusFiltro === 'ativos' && a.status !== 'ativo') return false;
      if (statusFiltro === 'inadimplentes') {
        if (a.entrada > mesRef) return false;
        const temMens = lancAssocMes(state, a.id, mesRef).some(
          (l) => l.tipo === 'mensalidade',
        );
        if (temMens) return false;
      }
      return true;
    });
  }, [state, busca, statusFiltro, mesRef]);

  const renderCell = (a: Associado, m: number) => {
    if (m < a.entrada) {
      return <span style={{ color: '#ccc' }}>—</span>;
    }
    const ls = lancAssocMes(state, a.id, m);
    if (ls.length === 0) {
      const emAberto = m <= mesRef;
      return (
        <span
          style={{
            color: emAberto ? '#ef6c00' : '#aaa',
            background: emAberto ? '#fff8e1' : 'transparent',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {emAberto ? 'em aberto' : '—'}
        </span>
      );
    }
    const total = ls.reduce((s, l) => s + l.valor, 0);
    const hasFesta = ls.some((l) => l.tipo === 'festa');
    const multiplos = ls.length > 1;
    return (
      <span
        style={{
          color: '#1b5e20',
          background: '#e8f5e9',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 700,
          display: 'inline-block',
        }}
      >
        {fmtBR(total)}
        {hasFesta && ' 🎉'}
        {multiplos && ` ×${ls.length}`}
      </span>
    );
  };

  const columns = [
    {
      title: 'Associado',
      dataIndex: 'nome',
      fixed: 'left' as const,
      width: 200,
      render: (_: unknown, a: Associado) => (
        <div>
          <div
            style={{ fontWeight: 600, color: '#1b5e20', cursor: 'pointer' }}
            onClick={() => setDetailAssoc(a)}
          >
            {a.nome}
          </div>
          {a.apelido && (
            <div style={{ fontSize: 11, color: '#6b7f6b' }}>({a.apelido})</div>
          )}
        </div>
      ),
    },
    ...Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return {
        title: monthShort(m),
        key: `m${m}`,
        align: 'center' as const,
        width: 82,
        render: (_: unknown, a: Associado) => renderCell(a, m),
        onCell: (a: Associado) => ({
          onClick: () => {
            if (m >= a.entrada) setCellSel({ assoc: a, mes: m });
          },
          style: { cursor: m >= a.entrada ? 'pointer' : 'default' },
        }),
      };
    }),
    {
      title: 'Total',
      key: 'total',
      fixed: 'right' as const,
      align: 'right' as const,
      width: 100,
      render: (_: unknown, a: Associado) => (
        <strong style={{ color: '#1b5e20' }}>
          {fmtBR(totalAssoc(state, a.id))}
        </strong>
      ),
    },
  ];

  const totaisMes = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return associadosFiltrados.reduce((s, a) => {
      return s + lancAssocMes(state, a.id, m).reduce((x, l) => x + l.valor, 0);
    }, 0);
  });

  const totalGeral = associadosFiltrados.reduce(
    (s, a) => s + totalAssoc(state, a.id),
    0,
  );

  return (
    <>
      <Card
        title={`📋 Grade de Mensalidades ${state.config.anoExercicio}`}
        extra={
          <Space wrap>
            <Tag color="success">Pago</Tag>
            <Tag color="warning">Em aberto</Tag>
            <Tag>Não associado</Tag>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Input.Search
            placeholder="🔎 Buscar associado"
            allowClear
            style={{ width: 260 }}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Select
            value={statusFiltro}
            onChange={setStatusFiltro}
            style={{ width: 220 }}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'ativos', label: 'Somente ativos' },
              { value: 'inadimplentes', label: `Inadimplentes em ${monthShort(mesRef)}` },
            ]}
          />
          <span style={{ color: '#6b7f6b', fontSize: 13 }}>
            {associadosFiltrados.length} de {state.associados.length}
          </span>
        </Space>

        <Table
          dataSource={associadosFiltrados}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          bordered
          scroll={{ x: 'max-content' }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <strong>Total mês</strong>
              </Table.Summary.Cell>
              {totaisMes.map((t, i) => (
                <Table.Summary.Cell key={i} index={i + 1} align="center">
                  <strong style={{ fontSize: 11, color: '#1b5e20' }}>
                    {fmtBR(t)}
                  </strong>
                </Table.Summary.Cell>
              ))}
              <Table.Summary.Cell index={13} align="right">
                <strong style={{ color: '#1b5e20' }}>{fmtBR(totalGeral)}</strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>

      {cellSel && (
        <ModalCell
          assoc={cellSel.assoc}
          mes={cellSel.mes}
          onClose={() => setCellSel(null)}
        />
      )}

      {detailAssoc && (
        <AssociadoDetalhe
          assoc={detailAssoc}
          onClose={() => setDetailAssoc(null)}
        />
      )}
    </>
  );
}

/* ============================================================
   MODAL DE CÉLULA — pagamentos do mês + add/edit/anular
   ============================================================ */

function ModalCell({
  assoc,
  mes,
  onClose,
}: {
  assoc: Associado;
  mes: number;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const state = useAppStore((s) => s.state);
  const setState = useAppStore((s) => s.setState);

  const [editando, setEditando] = useState<Lancamento | null>(null);
  const [anulando, setAnulando] = useState<Lancamento | null>(null);
  const [motivo, setMotivo] = useState('');

  const [tipo, setTipo] = useState<Lancamento['tipo']>('mensalidade');
  const [valor, setValor] = useState<number>(state.config.mensalidadePadrao);
  const [forma, setForma] = useState('pix');
  const [obs, setObs] = useState('');

  const lancamentos = state.lancamentos.filter(
    (l) => l.associadoId === assoc.id && l.competencia?.mes === mes,
  );

  const resetForm = () => {
    setEditando(null);
    setTipo('mensalidade');
    setValor(state.config.mensalidadePadrao);
    setForma('pix');
    setObs('');
  };

  const salvar = () => {
    if (!valor || valor <= 0) {
      message.error('Valor inválido');
      return;
    }
    setState((s) => {
      if (editando) {
        return {
          ...s,
          lancamentos: s.lancamentos.map((l) =>
            l.id === editando.id
              ? {
                  ...l,
                  tipo,
                  valor,
                  formaPagamento: forma,
                  observacao: obs,
                  ...getAuditFields(),
                }
              : l,
          ),
        };
      }
      const novo: Lancamento = {
        id: uid(),
        data: todayISO(),
        tipo,
        associadoId: assoc.id,
        competencia: { mes, ano: s.config.anoExercicio },
        valor,
        formaPagamento: forma,
        observacao: obs,
      };
      return { ...s, lancamentos: [...s.lancamentos, novo] };
    });
    message.success(editando ? 'Lançamento atualizado' : 'Lançamento registrado');
    resetForm();
  };

  const editar = (l: Lancamento) => {
    setEditando(l);
    setTipo(l.tipo);
    setValor(l.valor);
    setForma(l.formaPagamento || 'pix');
    setObs(l.observacao || '');
  };

  const confirmarAnular = () => {
    if (!anulando || motivo.trim().length < 3) {
      message.error('Motivo obrigatório (mín. 3 caracteres)');
      return;
    }
    setState((s) => ({
      ...s,
      lancamentos: s.lancamentos.map((x) =>
        x.id === anulando.id
          ? {
              ...x,
              anulado: true,
              ...getAnularFields(),
              motivoAnulacao: motivo.trim(),
            }
          : x,
      ),
    }));
    message.success('Lançamento anulado');
    setAnulando(null);
    setMotivo('');
  };

  const reativar = (l: Lancamento) => {
    setState((s) => ({
      ...s,
      lancamentos: s.lancamentos.map((x) =>
        x.id === l.id
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
    message.success('Lançamento reativado');
  };

  return (
    <>
      <Modal
        open
        onCancel={onClose}
        title={`${assoc.nome} — ${monthName(mes)}/${state.config.anoExercicio}`}
        footer={null}
        width={640}
      >
        <h4 style={{ color: '#1b5e20', marginBottom: 12 }}>
          Pagamentos registrados
        </h4>

        {lancamentos.length === 0 && (
          <p style={{ color: '#6b7f6b', fontSize: 13 }}>
            Nenhum pagamento registrado neste mês.
          </p>
        )}

        {lancamentos.map((l) => (
          <div
            key={l.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 10,
              background: '#f1f8e9',
              borderRadius: 6,
              marginBottom: 6,
              opacity: l.anulado ? 0.55 : 1,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <strong style={{ textDecoration: l.anulado ? 'line-through' : 'none' }}>
                {tipoLabel[l.tipo]}
              </strong>{' '}
              · {fmtBR(l.valor)}
              {l.observacao && (
                <span style={{ fontSize: 11, color: '#6b7f6b' }}>
                  {' '}
                  ({l.observacao})
                </span>
              )}
              <AuditBadges item={l} />
            </div>
            <Space>
              {!l.anulado && (
                <>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => editar(l)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => setAnulando(l)}
                  >
                    Anular
                  </Button>
                </>
              )}
              {l.anulado && (
                <Button size="small" onClick={() => reativar(l)}>
                  ↩️ Reativar
                </Button>
              )}
            </Space>
          </div>
        ))}

        <hr
          style={{
            margin: '20px 0',
            border: 'none',
            borderTop: '1px solid #dcedc8',
          }}
        />

        <h4 style={{ color: '#1b5e20', marginBottom: 12 }}>
          {editando ? '✏️ Editar lançamento' : '➕ Adicionar pagamento'}
        </h4>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Select
            value={tipo}
            onChange={(v) => {
              setTipo(v);
              if (v === 'mensalidade') setValor(state.config.mensalidadePadrao);
              else if (v === 'festa') setValor(state.config.valorFesta);
            }}
            style={{ width: '100%' }}
            options={[
              {
                value: 'mensalidade',
                label: `Mensalidade (${fmtBR(state.config.mensalidadePadrao)})`,
              },
              {
                value: 'festa',
                label: `Festa (${fmtBR(state.config.valorFesta)})`,
              },
              { value: 'extra', label: 'Extra' },
            ]}
          />
          <InputNumber
            value={valor}
            onChange={(v) => setValor(typeof v === 'number' ? v : 0)}
            addonBefore="R$"
            style={{ width: '100%' }}
            min={0}
            step={0.01}
          />
          <Select
            value={forma}
            onChange={setForma}
            style={{ width: '100%' }}
            options={[
              { value: 'pix', label: 'PIX' },
              { value: 'dinheiro', label: 'Dinheiro' },
              { value: 'transferencia', label: 'Transferência' },
              { value: 'outro', label: 'Outro' },
            ]}
          />
          <Input
            placeholder="Observação (opcional)"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
          <Space>
            <Button type="primary" onClick={salvar}>
              {editando ? '💾 Salvar alterações' : '✅ Adicionar'}
            </Button>
            {editando && <Button onClick={resetForm}>Cancelar edição</Button>}
          </Space>
        </Space>
      </Modal>

      {anulando && (
        <Modal
          open
          onCancel={() => {
            setAnulando(null);
            setMotivo('');
          }}
          onOk={confirmarAnular}
          title="Anular lançamento"
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
            placeholder="Ex: pagamento duplicado, erro de digitação, estorno…"
            rows={3}
            autoFocus
          />
        </Modal>
      )}
    </>
  );
}