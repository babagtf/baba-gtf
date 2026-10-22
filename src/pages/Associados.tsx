import { useState, useMemo } from 'react';
import {
  Card, Table, Input, Select, Button, Space, Tag, Modal, Form, App,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppStore } from '../store/useAppStore';
import { totalAssoc, getMesRef } from '../lib/calculos';
import { fmtBR, months, monthShort } from '../lib/format';
import type { Associado } from '../types';
import { AssociadoDetalhe } from '../components/AssociadoDetalhe';
import { AuditBadges } from '../components/AuditBadges';
import { getAuditFields } from '../lib/audit';

export function Associados() {
  const { message, modal } = App.useApp();
  const state = useAppStore((s) => s.state);
  const setState = useAppStore((s) => s.setState);

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

  const excluir = (a: Associado) => {
    const total = totalAssoc(state, a.id);
    const temLancamentos = state.lancamentos.some((l) => l.associadoId === a.id);

    if (temLancamentos) {
      modal.confirm({
        title: `Excluir ${a.nome}?`,
        content: (
          <>
            <p>
              Este associado tem <strong>{fmtBR(total)}</strong> em lançamentos.
            </p>
            <p>
              Excluir vai remover <strong>também todos os lançamentos vinculados</strong>.
              Para preservar o histórico, prefira alterar o status para{' '}
              <strong>Inativo</strong> ou <strong>Ex-associado</strong>.
            </p>
          </>
        ),
        okText: 'Excluir mesmo assim',
        okButtonProps: { danger: true },
        cancelText: 'Cancelar',
        onOk: () => {
          setState((s) => ({
            ...s,
            associados: s.associados.filter((x) => x.id !== a.id),
            lancamentos: s.lancamentos.filter((l) => l.associadoId !== a.id),
          }));
          message.success('Associado e lançamentos removidos');
        },
      });
      return;
    }

    modal.confirm({
      title: `Excluir ${a.nome}?`,
      content: 'Este associado não tem lançamentos. Ação irreversível.',
      okText: 'Excluir',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () => {
        setState((s) => ({
          ...s,
          associados: s.associados.filter((x) => x.id !== a.id),
        }));
        message.success('Associado removido');
      },
    });
  };

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      sorter: (a: Associado, b: Associado) => a.nome.localeCompare(b.nome),
      render: (nome: string, a: Associado) => (
        <span>
          <span
            style={{ color: '#1b5e20', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setDetalhe(a)}
          >
            {nome}
          </span>
          <AuditBadges item={a} />
        </span>
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
          s === 'ativo' ? 'success' : s === 'inativo' ? 'default' : 'warning';
        return <Tag color={color}>{s}</Tag>;
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
        <strong style={{ color: '#1b5e20' }}>
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
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditando(a)}
            title="Editar"
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => excluir(a)}
            title="Excluir"
          />
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