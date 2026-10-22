import { Modal, Form, Select, Input, InputNumber, DatePicker, App } from 'antd';
import { useState } from 'react';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { months, uid, tipoLabel, todayISO } from '../lib/format';
import type { Lancamento } from '../types';
import { getAuditFields } from '../lib/audit';

export function LancamentoEditModal({
  lancamento,
  initialTipo,
  onClose,
}: {
  lancamento?: Lancamento | null;
  initialTipo?: Lancamento['tipo'];
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const state = useAppStore((s) => s.state);
  const setState = useAppStore((s) => s.setState);
  const [form] = Form.useForm();

  const [tipo, setTipo] = useState<Lancamento['tipo']>(
    lancamento?.tipo || initialTipo || 'mensalidade',
  );

  const isEdit = !!lancamento;

  const initial = lancamento
    ? {
        tipo: lancamento.tipo,
        associadoId: lancamento.associadoId || undefined,
        convidadorId: lancamento.convidadorId || undefined,
        nome: lancamento.nome || '',
        data: dayjs(lancamento.data),
        mesComp: lancamento.competencia?.mes || new Date().getMonth() + 1,
        valor: lancamento.valor,
        formaPagamento: lancamento.formaPagamento || 'pix',
        observacao: lancamento.observacao || '',
      }
    : {
        tipo: initialTipo || 'mensalidade',
        associadoId: undefined,
        convidadorId: undefined,
        nome: '',
        data: dayjs(),
        mesComp: new Date().getMonth() + 1,
        valor:
          initialTipo === 'festa'
            ? state.config.valorFesta
            : initialTipo === 'visitante'
            ? 15
            : state.config.mensalidadePadrao,
        formaPagamento: 'pix',
        observacao: '',
      };

  const handleTipoChange = (novoTipo: Lancamento['tipo']) => {
    setTipo(novoTipo);
    form.setFieldValue('associadoId', undefined);
    form.setFieldValue('convidadorId', undefined);
    form.setFieldValue('nome', '');
    if (novoTipo === 'mensalidade')
      form.setFieldValue('valor', state.config.mensalidadePadrao);
    else if (novoTipo === 'festa')
      form.setFieldValue('valor', state.config.valorFesta);
    else if (novoTipo === 'visitante') form.setFieldValue('valor', 15);
  };

  const handleOk = async () => {
    try {
      const v = await form.validateFields();

      if (!v.valor || v.valor <= 0) {
        message.error('Valor inválido');
        return;
      }

      const dataISO = v.data.format('YYYY-MM-DD') || todayISO();

      const finalAssociadoId = ['mensalidade', 'festa', 'extra'].includes(v.tipo)
        ? v.associadoId
        : null;
      const finalConvidadorId = v.tipo === 'visitante' ? v.convidadorId : null;
      const finalNome = ['visitante', 'ex-associado', 'rendimento'].includes(v.tipo)
        ? v.nome?.trim() || null
        : null;

      setState((s) => {
        if (isEdit) {
          return {
            ...s,
            lancamentos: s.lancamentos.map((l) =>
              l.id === lancamento!.id
                ? {
                    ...l,
                    tipo: v.tipo,
                    associadoId: finalAssociadoId,
                    convidadorId: finalConvidadorId,
                    nome: finalNome,
                    data: dataISO,
                    competencia: { mes: v.mesComp, ano: s.config.anoExercicio },
                    valor: v.valor,
                    formaPagamento: v.formaPagamento,
                    observacao: v.observacao || '',
                    ...getAuditFields(),
                  }
                : l,
            ),
          };
        }
        const novo: Lancamento = {
          id: uid(),
          data: dataISO,
          tipo: v.tipo,
          associadoId: finalAssociadoId,
          convidadorId: finalConvidadorId,
          nome: finalNome,
          competencia: { mes: v.mesComp, ano: s.config.anoExercicio },
          valor: v.valor,
          formaPagamento: v.formaPagamento,
          observacao: v.observacao || '',
        };
        return { ...s, lancamentos: [...s.lancamentos, novo] };
      });
      message.success(isEdit ? 'Lançamento atualizado' : 'Lançamento criado');
      onClose();
    } catch {
      /* validação falhou — Ant Design mostra */
    }
  };

  const assocOptions = state.associados.map((a) => ({
    value: a.id,
    label: `${a.nome}${a.apelido ? ` (${a.apelido})` : ''}`,
  }));

  return (
    <Modal
      open
      onCancel={onClose}
      onOk={handleOk}
      title={isEdit ? '✏️ Editar lançamento' : '➕ Novo lançamento'}
      okText={isEdit ? 'Salvar' : 'Criar'}
      cancelText="Cancelar"
      width={560}
    >
      <Form form={form} layout="vertical" initialValues={initial}>
        <Form.Item label="Tipo" name="tipo" rules={[{ required: true }]}>
          <Select
            onChange={handleTipoChange}
            options={Object.entries(tipoLabel).map(([k, v]) => ({
              value: k,
              label: v,
            }))}
          />
        </Form.Item>

        {['mensalidade', 'festa', 'extra'].includes(tipo) && (
          <Form.Item
            label="Associado"
            name="associadoId"
            rules={[{ required: true, message: 'Selecione o associado' }]}
          >
            <Select
              showSearch
              placeholder="Selecione…"
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={assocOptions}
            />
          </Form.Item>
        )}

        {tipo === 'visitante' && (
          <>
            <Form.Item
              label="Convidado de (associado)"
              name="convidadorId"
              rules={[
                { required: true, message: 'Selecione o associado convidador' },
              ]}
            >
              <Select
                showSearch
                placeholder="Quem trouxe o visitante?"
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={assocOptions}
              />
            </Form.Item>
            <Form.Item
              label="Nome do visitante"
              name="nome"
              rules={[{ required: true, message: 'Informe o nome do visitante' }]}
            >
              <Input placeholder="Ex: João Silva / Grupo de 5 pessoas" />
            </Form.Item>
          </>
        )}

        {['ex-associado', 'rendimento'].includes(tipo) && (
          <Form.Item
            label="Nome / Descrição"
            name="nome"
            rules={[{ required: true, message: 'Informe o nome/descrição' }]}
          >
            <Input placeholder="Ex: Ex-associados de janeiro / Rendimento da poupança" />
          </Form.Item>
        )}

        <Form.Item
          label="Data do pagamento"
          name="data"
          rules={[{ required: true }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item label="Competência (mês)" name="mesComp">
          <Select options={months.map((m, i) => ({ value: i + 1, label: m }))} />
        </Form.Item>

        <Form.Item label="Valor" name="valor" rules={[{ required: true }]}>
          <InputNumber
            style={{ width: '100%' }}
            addonBefore="R$"
            min={0}
            step={0.01}
          />
        </Form.Item>

        <Form.Item label="Forma de pagamento" name="formaPagamento">
          <Select
            options={[
              { value: 'pix', label: 'PIX' },
              { value: 'dinheiro', label: 'Dinheiro' },
              { value: 'transferencia', label: 'Transferência' },
              { value: 'outro', label: 'Outro' },
            ]}
          />
        </Form.Item>

        <Form.Item label="Observação" name="observacao">
          <Input placeholder="Opcional" />
        </Form.Item>
      </Form>
    </Modal>
  );
}