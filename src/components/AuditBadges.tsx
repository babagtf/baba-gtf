import { Tag } from 'antd';

interface AuditItem {
  editedAt?: string;
  editedBy?: string;
  editedByName?: string;
  anulado?: boolean;
  anuladoEm?: string;
  anuladoPor?: string;
  anuladoPorNome?: string;
  motivoAnulacao?: string;
}

function brDateShort(iso?: string): string {
  if (!iso) return '—';
  const d = iso.slice(0, 10).split('-');
  return `${d[2]}/${d[1]}/${d[0]}`;
}

export function AuditBadges({ item }: { item: AuditItem }) {
  return (
    <>
      {item.anulado && (
        <Tag
          color="red"
          style={{ marginLeft: 4, fontSize: 9 }}
          title={`Anulado por ${
            item.anuladoPorNome || item.anuladoPor || 'desconhecido'
          } em ${brDateShort(item.anuladoEm)}${
            item.motivoAnulacao ? ' · ' + item.motivoAnulacao : ''
          }`}
        >
          anulado
        </Tag>
      )}
      {item.editedAt && (
        <Tag
          color="blue"
          style={{ marginLeft: 4, fontSize: 9 }}
          title={`Última edição: ${
            item.editedByName || item.editedBy || 'desconhecido'
          } em ${brDateShort(item.editedAt)}`}
        >
          editado
        </Tag>
      )}
    </>
  );
}