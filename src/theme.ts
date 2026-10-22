import type { ThemeConfig } from 'antd';

// Paleta do campo de futebol — ajuste fino à vontade
export const futebolTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1b5e20',      // verde gramado escuro
    colorSuccess: '#4caf50',      // verde claro
    colorWarning: '#ef6c00',      // laranja (em aberto)
    colorError: '#c62828',        // vermelho (anulado)
    colorInfo: '#0288d1',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'Segoe UI', Roboto, -apple-system, sans-serif",
  },
  components: {
    Layout: {
      headerBg: '#0d3d0d',        // topo bem escuro, tipo vestiário
      headerColor: '#ffffff',
      siderBg: '#ffffff',
    },
    Menu: {
      itemSelectedBg: '#c8e6c9',  // item ativo verde claro
      itemSelectedColor: '#1b5e20',
    },
    Table: {
      headerBg: '#f1f8e9',        // cabeçalho de tabela em verde bem pálido
      headerColor: '#1b5e20',
      rowHoverBg: '#f9fbe7',
    },
    Button: {
      fontWeight: 600,
    },
    Card: {
      headerBg: 'transparent',
    },
  },
};