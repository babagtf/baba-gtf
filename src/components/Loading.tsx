export function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #1b5e20 0%, #061a06 100%)',
      }}
    >
      <img
        src="/icon-192.png"
        alt="Carregando..."
        style={{
          width: 100,
          height: 100,
          animation: 'pulse 1.5s infinite ease-in-out',
          filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))',
          borderRadius: 20,
        }}
      />
      <div
        style={{
          marginTop: 24,
          color: '#fff',
          fontSize: 16,
          fontWeight: 500,
          letterSpacing: 1,
        }}
      >
        Sincronizando dados...
      </div>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 0.8; }
          }
        `}
      </style>
    </div>
  );
}