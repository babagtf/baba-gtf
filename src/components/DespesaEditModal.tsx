import { Modal, Form, Select, Input, InputNumber, DatePicker, App } from 'antd';
import { useState } from 'react';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { uid, todayISO } from '../lib/format';
import type { Despesa } from '../types';

// Helpers para máscara de moeda brasileira (R$ 1.000,00)
const currencyFormatter = (value: number | string | undefined) => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const currencyParser = (value: string | undefined) => {
  if (!value) return 0;
  return Number(value.replace(/\./g, '').replace(',', '.')) || 0;
};

export function DespesaEditModal({
  despesa,
  onClose,
}: {
  despesa?: Despesa | null;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const state = useAppStore((s) => s.state);
  const setState = useAppStore((s) => s.setState);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isEdit = !!despesa;

  const initial = despesa
    ? {
        data: dayjs(despesa.data),
        categoria: despesa.categoria,
        descricao: despesa.descricao || '',
        valor: despesa.valor,
        observacao: despesa.observacao || '',
      }
    : {
        data: dayjs(),
        categoria: 'juiz',
        descricao: '',
        valor: 0,
        observacao: '',
      };

  const handleOk = async () => {
    try {
      const v = await form.validateFields();

      if (!v.valor || v.valor <= 0) {
        message.error('Valor inválido');
        return;
      }

      const dataISO = v.data.format('YYYY-MM-DD') || todayISO();

      setLoading(true); // Bloqueia o botão para evitar clique duplo

      setState((s) => {
        if (isEdit) {
          return {
            ...s,
            despesas: s.despesas.map((d) =>
              d.id === despesa!.id
                ? {
                    ...d,
                    data: dataISO,
                    categoria: v.categoria,
                    descricao: v.descricao || '',
                    valor: v.valor,
                    observacao: v.observacao || '',
                    editedAt: new Date().toISOString(),
                  }
                : d,
            ),
          };
        }
        const nova: Despesa = {
          id: uid(),
          data: dataISO,
          categoria: v.categoria,
          descricao: v.descricao || '',
          valor: v.valor,
          observacao: v.observacao || '',
        };
        return { ...s, despesas: [...s.despesas, nova] };
      });

      message.success(isEdit ? 'Despesa atualizada' : 'Despesa registrada');
      onClose();
    } catch {
      // Se falhar na validação, apenas remove o loading (o AntD já mostra o erro)
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      title={isEdit ? '✏️ Editar despesa' : '➕ Nova despesa'}
      okText={isEdit ? 'Salvar' : 'Registrar'}
      cancelText="Cancelar"
      width={520}
    >
      <Form form={form} layout="vertical" initialValues={initial}>
        <Form.Item
          label="Data"
          name="data"
          rules={[{ required: true, message: 'Informe a data' }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item
          label="Categoria"
          name="categoria"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: 'juiz', label: 'Juiz' },
              { value: 'goleiro', label: 'Goleiro' },
              { value: 'bola', label: 'Bola' },
              { value: 'outras', label: 'Outras' },
            ]}
          />
        </Form.Item>

        <Form.Item label="Descrição" name="descricao">
          <Input placeholder="Ex: jogo de sábado" />
        </Form.Item>

        <Form.Item
          label="Valor"
          name="valor"
          rules={[{ required: true, message: 'Informe o valor' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            addonBefore="R$"
            min={0}
            step={0.01}
            formatter={currencyFormatter}
            parser={currencyParser}
          />
        </Form.Item>

        <Form.Item label="Observação" name="observacao">
          <Input placeholder="Opcional" />
        </Form.Item>
      </Form>
    </Modal>
  );
}