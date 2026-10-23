import { Modal, Table, Tag } from 'antd';
import type { ReactNode } from 'react';
import { useAppStore } from '../store/useAppStore';
import { lancAssocMes, totalAssoc, getMesRef } from '../lib/calculos';
import { fmtBR, monthName, monthShort, tipoLabel } from '../lib/format';
import { AuditBadges } from './AuditBadges';
import type { Associado } from '../types';

export function AssociadoDetalhe({
  assoc,
  onClose,
}: {
  assoc: Associado;
  onClose: () => void;
}) {
  const state = useAppStore((s) => s.state);
  const mesRef = getMesRef(state);
  const total = totalAssoc(state, assoc.id);

  const rows: Array<{
    key: number;
    mes: number;
    status: string;
    detalhe: ReactNode;
    cor: string;
  }> = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    if (m < assoc.entrada) {
      return { key: m, mes: m, status: 'não associado', detalhe: '', cor: 'default' };
    }
    const ls = lancAssocMes(state, assoc.id, m);
    if (ls.length === 0) {
      const emAberto = m <= mesRef;
      return {
        key: m,
        mes: m,
        status: emAberto ? 'em aberto' : '—',
        detalhe: '',
        cor: emAberto ? 'warning' : 'default',
      };
    }
    const sub = ls.reduce((s, l) => s + l.valor, 0);
    const detalhe = (
      <>
        {ls.map((l) => (
          <div key={l.id}>
            {tipoLabel[l.tipo]}: {fmtBR(l.valor)}
            <AuditBadges item={l} />
          </div>
        ))}
      </>
    );
    return {
      key: m,
      mes: m,
      status: fmtBR(sub),
      detalhe,
      cor: 'success',
    };
  });

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      width={640}
      title={`${assoc.nome}${assoc.apelido ? ` (${assoc.apelido})` : ''}`}
    >
      <p style={{ color: '#6b7f6b', marginBottom: 16 }}>
        Entrada: {monthShort(assoc.entrada)}/{state.config.anoExercicio} · Total
        pago: <strong>{fmtBR(total)}</strong>
      </p>

      <Table
        dataSource={rows}
        columns={[
          {
            title: 'Mês',
            dataIndex: 'mes',
            width: 120,
            render: (m: number) => monthName(m),
          },
          {
            title: 'Status',
            dataIndex: 'status',
            width: 130,
            render: (s: string, r: { cor: string }) => (
              <Tag color={r.cor}>{s}</Tag>
            ),
          },
          {
            title: 'Detalhes',
            dataIndex: 'detalhe',
            render: (d: ReactNode) => (
              <span style={{ fontSize: 11 }}>{d || '—'}</span>
            ),
          },
        ]}
        pagination={false}
        size="small"
      />
    </Modal>
  );
}