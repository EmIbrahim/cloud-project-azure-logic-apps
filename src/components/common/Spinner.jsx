const Spinner = ({ label = 'Loading...' }) => (
  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        border: '3px solid #bfdbfe',
        borderTopColor: '#2563eb',
        animation: 'spin 1s linear infinite'
      }}
    />
    <span>{label}</span>
    <style>
      {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg);} }`}
    </style>
  </div>
);

export default Spinner;

