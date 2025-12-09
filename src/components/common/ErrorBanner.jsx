const ErrorBanner = ({ message }) => {
  if (!message) return null;
  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 8,
        background: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fecdd3',
        marginBottom: 12
      }}
    >
      {message}
    </div>
  );
};

export default ErrorBanner;

