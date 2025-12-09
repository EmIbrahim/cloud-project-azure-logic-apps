// Placeholder for PowerBI embedding. For Phase 2, swap the iframe src with
// an embedded report URL and provide an access token retrieved from Azure AD.
// For Phase 3, wire this component to Azure SQL via PowerBI dataset refresh.
const PowerBIPlaceholder = () => (
  <div className="card" style={{ gridColumn: '1 / -1' }}>
    <h3>PowerBI (placeholder)</h3>
    <p style={{ color: '#475569' }}>
      This iframe demonstrates where a PowerBI report would render. Replace the sample embed URL
      with a secured PowerBI report URL and inject an embed token via your backend or Logic App.
      Connect to Azure SQL by pointing the dataset connection string to your database and schedule
      refresh via Logic Apps or PowerBI Gateway.
    </p>
    <div
      style={{
        border: '1px dashed #cbd5e1',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#f8fafc'
      }}
    >
      <iframe
        title="PowerBI Sample"
        style={{ width: '100%', height: 320, border: 'none' }}
        src="https://app.powerbi.com/view?r=eyJrIjoiMDJhMDA4MDgtMWQzOC00MmM4LWFjZTctYzRhY2E4YjhjN2Q5IiwidCI6ImFhZDI5MmY1LTNmMTgtNDc2Ny1hMTgyLWJhYjE5MzI3MDQ5NiJ9"
      />
    </div>
    <p style={{ color: '#0f172a', marginTop: 12 }}>
      To plug in Azure SQL + SAS tokens:
      <br />
      - Add an API route that returns an embed token and reportId/workspaceId from Azure AD.
      <br />
      - Pass those props into a PowerBI React component and set the iframe src to the embed URL.
      <br />
      - Use a Logic App to refresh the dataset after new receipts are ingested or processed.
    </p>
  </div>
);

export default PowerBIPlaceholder;

