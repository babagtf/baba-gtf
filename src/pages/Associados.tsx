import { useState, useMemo } from 'react';
import {
  Card, Table, Input, Select, Button, Space, Tag, Modal, Form, App, Tooltip,
} from 'antd';
import { 
  PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined 
} from '@ant-design/icons';
import { useAppStore } from '../store/useAppStore';
import { totalAssoc, getMesRef, lancAssocMes } from '../lib/calculos';
import { fmtBR, months, monthShort, uid, todayISO } from '../lib/format';
import type { Associado, Lancamento } from '../types';
import { AssociadoDetalhe } from '../components/AssociadoDetalhe';
import { getAuditFields } from '../lib/audit';

export function Associados() {
  const { message, modal } = App.useApp();
  const state = useAppStore((s) => s.state);
  const setState = useAppStore((s) => s.setState);
  const mesRef = getMesRef(state);

  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [editando, setEditando] = useState<Associado | 'novo' | null>(null);
  const [detalhe, setDetalhe] = useState<Associado | null>(null);

  const filtrados = useMemo(() => {
    return state.associados.filter((a) => {
      if (busca) {
        const q = busca.toLowerCase();
        if (
          !a.nome.toLowerCase().includes(q) &&
          !(a.apelido || '').toLowerCase().includes(q)
        )
          return false;
      }
      if (statusFiltro !== 'todos' && a.status !== statusFiltro) return false;
      return true;
    });
  }, [state.associados, busca, statusFiltro]);

  const salvar = (dados: Omit<Associado, 'id'> & { id?: string }) => {
    setState((s) => {
      if (dados.id) {
        return {
          ...s,
          associados: s.associados.map((a) =>
            a.id === dados.id
              ? { ...a, ...dados, ...getAuditFields() }
              : a,
          ),
        };
      }
      return {
        ...s,
        associados: [
          ...s.associados,
          { ...dados, id: 'a' + Date.now() } as Associado,
        ],
      };
    });
    message.success(dados.id ? 'Associado atualizado' : 'Associado criado');
    setEditando(null);
  };

  const inativarComPerdao = (a: Associado) => {
    modal.confirm({
      title: `Inativar ${a.nome}?`,
      content: (
        <div>
          <p>Ao inativar este associado:</p>
          <ul style={{ marginLeft: 20, marginTop: 8, marginBottom: 16, fontSize: 13 }}>
            <li>Todas as dívidas em aberto até <strong>{monthShort(mesRef)}/{state.config.anoExercicio}</strong> serão <strong>perdoadas automaticamente</strong>.</li>
            <li>Os meses futuros ficarão bloqueados na Grade.</li>
            <li>O status mudará para <strong>INATIVO</strong>.</li>
          </ul>
          <p style={{ color: '#c62828', fontWeight: 600 }}>Deseja continuar?</p>
        </div>
      ),
      okText: 'Sim, inativar e perdoar',
      width: '30%',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () => {
        setState((s) => {
          const novosLancamentos: Lancamento[] = [];
          
          // Varre os meses desde a entrada até o mês atual
          for (let m = a.entrada; m <= mesRef; m++) {
            const temMensalidadeOuPerdao = s.lancamentos.some(
              (l) => l.associadoId === a.id && 
                     l.competencia?.mes === m && 
                     l.competencia?.ano === s.config.anoExercicio && 
                     !l.anulado && 
                     (l.tipo === 'mensalidade' || l.tipo === 'perdao')
            );

            // Se estiver em aberto, cria o perdão automático
            if (!temMensalidadeOuPerdao) {
              novosLancamentos.push({
                id: uid(),
                data: todayISO(),
                tipo: 'perdao',
                associadoId: a.id,
                competencia: { mes: m, ano: s.config.anoExercicio },
                valor: 0,
                formaPagamento: '-',
                observacao: 'Perdão automático na inativação',
                ...getAuditFields(),
              });
            }
          }

          return {
            ...s,
            associados: s.associados.map((x) =>
              x.id === a.id
                ? { ...x, status: 'inativo', saida: mesRef, ...getAuditFields() }
                : x,
            ),
            lancamentos: [...s.lancamentos, ...novosLancamentos],
          };
        });
        message.success('Associado inativado e dívidas perdoadas');
      },
    });
  };

  const reativar = (a: Associado) => {
    setState((s) => ({
      ...s,
      associados: s.associados.map((x) =>
        x.id === a.id
          ? { ...x, status: 'ativo', saida: undefined, ...getAuditFields() }
          : x,
      ),
    }));
    message.success('Associado reativado com sucesso');
  };

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      sorter: (a: Associado, b: Associado) => a.nome.localeCompare(b.nome),
      render: (nome: string, a: Associado) => (
        <Space>
          <span
            style={{ 
              color: a.status === 'ativo' ? '#1b5e20' : '#999', 
              fontWeight: 600, 
              cursor: 'pointer',
              textDecoration: a.status !== 'ativo' ? 'line-through' : 'none'
            }}
            onClick={() => setDetalhe(a)}
          >
            {nome}
          </span>
          {a.status === 'inativo' && (
            <Tag color="error" style={{ fontWeight: 'bold' }}>INATIVO</Tag>
          )}
          {a.status === 'ex-associado' && (
            <Tag color="warning" style={{ fontWeight: 'bold' }}>EX-ASSOCIADO</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Apelido',
      dataIndex: 'apelido',
      render: (v: string) => v || <span style={{ color: '#aaa' }}>—</span>,
    },
    {
      title: 'Entrada',
      dataIndex: 'entrada',
      width: 110,
      sorter: (a: Associado, b: Associado) => a.entrada - b.entrada,
      render: (m: number) => `${monthShort(m)}/${state.config.anoExercicio}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 140,
      filters: [
        { text: 'Ativo', value: 'ativo' },
        { text: 'Inativo', value: 'inativo' },
        { text: 'Ex-associado', value: 'ex-associado' },
      ],
      onFilter: (v: any, a: Associado) => a.status === v,
      render: (s: string) => {
        const color =
          s === 'ativo' ? 'success' : s === 'inativo' ? 'error' : 'warning';
        return <Tag color={color}>{s.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Total pago',
      key: 'total',
      width: 130,
      align: 'right' as const,
      sorter: (a: Associado, b: Associado) =>
        totalAssoc(state, a.id) - totalAssoc(state, b.id),
      render: (_: unknown, a: Associado) => (
        <strong style={{ color: a.status === 'ativo' ? '#1b5e20' : '#999' }}>
          {fmtBR(totalAssoc(state, a.id))}
        </strong>
      ),
    },
    {
      title: '',
      key: 'acoes',
      width: 110,
      render: (_: unknown, a: Associado) => (
        <Space size="small">
          <Tooltip title="Editar cadastro">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => setEditando(a)}
            />
          </Tooltip>
          
          <Tooltip title={a.status === 'ativo' ? 'Inativar associado' : 'Reativar associado'}>
            <Button
              size="small"
              type={a.status === 'ativo' ? 'default' : 'primary'}
              danger={a.status === 'ativo'}
              icon={a.status === 'ativo' ? <StopOutlined /> : <CheckCircleOutlined />}
              onClick={() => a.status === 'ativo' ? inativarComPerdao(a) : reativar(a)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title={`👥 Associados (${state.associados.length})`}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setEditando('novo')}
          >
            Novo
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Input.Search
            placeholder="🔎 Buscar nome ou apelido"
            allowClear
            style={{ width: 280 }}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Select
            value={statusFiltro}
            onChange={setStatusFiltro}
            style={{ width: 180 }}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'ativo', label: 'Ativos' },
              { value: 'inativo', label: 'Inativos' },
              { value: 'ex-associado', label: 'Ex-associados' },
            ]}
          />
          <span style={{ color: '#6b7f6b', fontSize: 13 }}>
            {filtrados.length} de {state.associados.length}
          </span>
        </Space>

        <Table
          dataSource={filtrados}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 20, showSizeChanger: false }}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {editando && (
        <ModalAssociado
          assoc={editando === 'novo' ? null : editando}
          onSave={salvar}
          onClose={() => setEditando(null)}
        />
      )}

      {detalhe && (
        <AssociadoDetalhe assoc={detalhe} onClose={() => setDetalhe(null)} />
      )}
    </>
  );
}

/* ============================================================
   MODAL DE CRIAÇÃO / EDIÇÃO
   ============================================================ */

function ModalAssociado({
  assoc,
  onSave,
  onClose,
}: {
  assoc: Associado | null;
  onSave: (dados: Omit<Associado, 'id'> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [form] = Form.useForm();
  const mesRef = getMesRef(useAppStore.getState().state);

  const initialValues = assoc
    ? { ...assoc }
    : { nome: '', apelido: '', entrada: mesRef, status: 'ativo' };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSave({ ...values, id: assoc?.id });
    } catch {
      /* validação falhou — o Ant Design já mostra o erro */
    }
  };

  return (
    <Modal
      open
      onCancel={onClose}
      onOk={handleOk}
      title={assoc ? '✏️ Editar associado' : '➕ Novo associado'}
      okText={assoc ? 'Salvar alterações' : 'Criar'}
      cancelText="Cancelar"
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item
          label="Nome"
          name="nome"
          rules={[{ required: true, message: 'Nome obrigatório' }]}
        >
          <Input autoFocus />
        </Form.Item>
        <Form.Item label="Apelido" name="apelido">
          <Input />
        </Form.Item>
        <Form.Item label="Mês de entrada" name="entrada">
          <Select
            options={months.map((m, i) => ({ value: i + 1, label: m }))}
          />
        </Form.Item>
        <Form.Item label="Status" name="status">
          <Select
            options={[
              { value: 'ativo', label: 'Ativo' },
              { value: 'inativo', label: 'Inativo' },
              { value: 'ex-associado', label: 'Ex-associado' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}