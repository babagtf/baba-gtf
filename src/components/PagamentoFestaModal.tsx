import { useState } from 'react';
import { Modal, Input, InputNumber, Select, App } from 'antd';
import { useAppStore } from '../store/useAppStore';
import { uid, todayISO, fmtBR } from '../lib/format';
import { getAuditFields } from '../lib/audit';
import type { Associado } from '../types';

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

export function PagamentoFestaModal({
  assoc,
  onClose,
}: {
  assoc: Associado;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const state = useAppStore((s) => s.state);
  const setState = useAppStore((s) => s.setState);

  const [valor, setValor] = useState<number>(state.config.valorFesta);
  const [forma, setForma] = useState('pix');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false); // Bloqueia clique duplo

  const salvar = () => {
    if (saving) return;
    if (!valor || valor <= 0) {
      message.error('Valor inválido');
      return;
    }
    
    setSaving(true);

    setState((s) => ({
      ...s,
      lancamentos: [
        ...s.lancamentos,
        {
          id: uid(),
          data: todayISO(),
          tipo: 'festa',
          associadoId: assoc.id,
          convidadorId: null,
          nome: null,
          competencia: { mes: new Date().getMonth() + 1, ano: s.config.anoExercicio },
          valor,
          formaPagamento: forma,
          observacao: obs.trim() || 'Confra',
          ...getAuditFields(), // Registra quem adicionou
        },
      ],
    }));
    
    message.success(`Festa registrada: ${assoc.nome} — ${fmtBR(valor)}`);
    onClose();
  };

  return (
    <Modal
      open
      onCancel={onClose}
      onOk={salvar}
      confirmLoading={saving}
      title={`🏆 Registrar pagamento — ${assoc.nome}`}
      okText="Registrar"
      cancelText="Cancelar"
    >
      <p style={{ color: '#6b7f6b', marginBottom: 16 }}>
        Valor sugerido: <strong>{fmtBR(state.config.valorFesta)}</strong>
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
          <span style={{ color: '#6b7f6b', fontWeight: 600 }}>Valor</span>
          <InputNumber
            value={valor}
            onChange={(v) => setValor(typeof v === 'number' ? v : 0)}
            addonBefore="R$"
            min={0}
            step={0.01}
            style={{ width: '100%' }}
            autoFocus
            formatter={currencyFormatter}
            parser={currencyParser}
            onPressEnter={salvar}
          />
        </label>

        <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
          <span style={{ color: '#6b7f6b', fontWeight: 600 }}>
            Forma de pagamento
          </span>
          <Select
            value={forma}
            onChange={setForma}
            options={[
              { value: 'pix', label: 'PIX' },
              { value: 'dinheiro', label: 'Dinheiro' },
              { value: 'transferencia', label: 'Transferência' },
              { value: 'outro', label: 'Outro' },
            ]}
          />
        </label>

        <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
          <span style={{ color: '#6b7f6b', fontWeight: 600 }}>
            Observação (opcional)
          </span>
          <Input
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Ex: 2ª parcela, pago junto com a mensalidade…"
            onPressEnter={salvar}
          />
        </label>
      </div>
    </Modal>
  );
}