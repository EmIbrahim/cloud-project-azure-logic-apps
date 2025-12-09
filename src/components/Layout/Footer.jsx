const Footer = () => (
  <footer className="footer">
    <div>
      <span style={{ fontWeight: '500' }}>Receipt Automation System</span>
      <span style={{ margin: '0 8px', color: '#64748b' }}>•</span>
      <span style={{ color: '#94a3b8' }}>Powered by Azure Logic Apps & Document Intelligence</span>
    </div>
    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
      {new Date().getFullYear()} • Cloud Computing Project
    </div>
  </footer>
);

export default Footer;

