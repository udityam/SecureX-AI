import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function App() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [baitResponse, setBaitResponse] = useState(null);
  const [isGeneratingBait, setIsGeneratingBait] = useState(false);

  const downloadReport = (id) => {
    window.open(`http://localhost:8000/api/report/${id}`, '_blank');
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const analyzeFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setBaitResponse(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/analyze-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to analyze file threat');
      }

      const data = await response.json();
      setResult(data);
      fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setBaitResponse(null);

    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to analyze threat');
      }

      const data = await response.json();
      setResult(data);
      fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deployCounterMeasure = async () => {
    if (!result) return;
    setIsGeneratingBait(true);
    setBaitResponse(null);
    try {
      const response = await fetch('http://localhost:8000/api/generate-bait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original_threat: content || result.target }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate bait');
      }
      const data = await response.json();
      setBaitResponse(data.bait_response);
    } catch (err) {
      console.error(err);
      setBaitResponse("ERROR: FAILED TO DEPLOY COUNTER-MEASURE");
    } finally {
      setIsGeneratingBait(false);
    }
  };

  // Data Processing
  const severityData = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    history.forEach(item => {
      if (counts[item.threat_level] !== undefined) {
        counts[item.threat_level]++;
      }
    });
    return [
      { name: 'CRITICAL', value: counts.CRITICAL, color: '#ef4444' },
      { name: 'HIGH', value: counts.HIGH, color: '#f97316' },
      { name: 'MEDIUM', value: counts.MEDIUM, color: '#facc15' },
      { name: 'LOW', value: counts.LOW, color: '#22c55e' }
    ].filter(d => d.value > 0);
  }, [history]);

  const timelineData = useMemo(() => {
    const counts = {};
    // Sort ascending for timeline
    const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    sorted.forEach(item => {
      if (!item.timestamp) return;
      const date = new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.keys(counts).map(date => ({ date, scans: counts[date] }));
  }, [history]);

  const getThreatColor = (level) => {
    if (!level) return 'inherit';
    switch (level.toUpperCase()) {
      case 'LOW': return '#22c55e';
      case 'MEDIUM': return '#facc15';
      case 'HIGH': return '#f97316';
      case 'CRITICAL': return '#ef4444';
      default: return 'inherit';
    }
  };

  return (
    <div className="cyber-container">
      <header className="cyber-header">
        <h1>SECUREX_AI<span className="cursor">_</span></h1>
        <div className="status-bar">
          <span className="status-item">[SYS: ONLINE]</span>
          <span className="status-item">[DB: CONNECTED]</span>
          <span className="status-item">[OCR: READY]</span>
        </div>
      </header>

      <main className="cyber-grid">
        {/* Top Half: Scanning & Results */}
        <div className="grid-top">
          <section className="terminal-panel">
            <div className="panel-header">&gt;&nbsp;INPUT_TERMINAL</div>
            <div className="panel-body">
              <textarea
                className="cyber-input"
                placeholder="Enter raw data payload, suspicious URL, or text..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              ></textarea>

              <div className="file-upload-wrapper">
                <label>&gt; UPLOAD_FILE (PDF/PNG/JPG):</label>
                <input
                  type="file"
                  className="cyber-file"
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                />
              </div>

              <div className="action-buttons">
                <button className="cyber-btn primary" onClick={handleScan} disabled={loading || !content.trim()}>
                  {loading && !uploadFile ? '[PROCESSING...]' : '[EXECUTE_TEXT_SCAN]'}
                </button>
                <button className="cyber-btn secondary" onClick={() => analyzeFile(uploadFile)} disabled={loading || !uploadFile}>
                  {loading && uploadFile ? '[PROCESSING...]' : '[EXECUTE_FILE_SCAN]'}
                </button>
              </div>

              {error && (
                <div className="cyber-error">
                  ERROR: {error}
                </div>
              )}
            </div>
          </section>

          <section className="terminal-panel">
            <div className="panel-header">&gt;&nbsp;ACTIVE_THREAT_ANALYSIS</div>
            <div className="panel-body">
              {!result && !loading && (
                <div className="idle-state">
                  <div className="radar-animation"></div>
                  <p>AWAITING_PAYLOAD...</p>
                </div>
              )}

              {loading && (
                <div className="idle-state">
                  <span className="cyber-loader"></span>
                  <p>ANALYZING_THREAT_VECTORS...</p>
                </div>
              )}

              {result && !loading && (
                <div className="scan-result-card">
                  <div className="result-top">
                    <div className="threat-level-box" style={{ borderColor: getThreatColor(result.threat_level), color: getThreatColor(result.threat_level) }}>
                      <span className="label">SEVERITY</span>
                      <span className="value">{result.threat_level}</span>
                    </div>
                    <div className="risk-score-box" style={{ color: getThreatColor(result.threat_level) }}>
                      <span className="value">{result.risk_score}</span>
                      <span className="label">SCORE</span>
                    </div>
                  </div>

                  <div className="data-row">
                    <span className="key">&gt; TARGET_TYPE:</span>
                    <span className="val">{result.threat_type}</span>
                  </div>
                  <div className="data-row">
                    <span className="key">&gt; SUBJECT:</span>
                    <span className="val">{result.target}</span>
                  </div>

                  <div className="data-section">
                    <span className="key">&gt; INDICATORS:</span>
                    <ul className="cyber-list">
                      {result.indicators.map((indicator, index) => (
                        <li key={index}>{indicator}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="data-section highlight-box">
                    <span className="key">&gt; RECOMMENDED_ACTION:</span>
                    <p>{result.recommended_action}</p>
                  </div>

                  {(result.threat_level?.toUpperCase() === 'HIGH' || result.threat_level?.toUpperCase() === 'CRITICAL') && (
                    <div className="counter-measure-section" style={{ marginTop: '20px', borderTop: '1px dashed #333', paddingTop: '15px' }}>
                      <button
                        className="cyber-btn"
                        style={{ backgroundColor: 'transparent', borderColor: '#ef4444', color: '#ef4444', width: '100%', marginBottom: '15px' }}
                        onClick={deployCounterMeasure}
                        disabled={isGeneratingBait}
                      >
                        {isGeneratingBait ? '[ GENERATING COUNTER-MEASURE... ]' : '[ DEPLOY COUNTER-MEASURE ]'}
                      </button>

                      {baitResponse && (
                        <div className="bait-response-terminal" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', padding: '15px', color: '#22c55e', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                          <span className="key" style={{ color: '#22c55e' }}>&gt; SCAM_BAIT_PAYLOAD:</span>
                          <p style={{ marginTop: '10px', wordBreak: 'break-word' }}>{baitResponse}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Bottom Half: Analytics & History */}
        <div className="grid-bottom">
          <section className="terminal-panel analytics-panel">
            <div className="panel-header">&gt;&nbsp;SYSTEM_ANALYTICS</div>
            <div className="panel-body charts-container">
              <div className="chart-box">
                <h4 className="chart-title">THREAT_DISTRIBUTION</h4>
                {severityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="no-data">NO_DATA_AVAILABLE</p>
                )}
              </div>

              <div className="chart-box">
                <h4 className="chart-title">SCAN_ACTIVITY_TIMELINE</h4>
                {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #00f0ff', color: '#00f0ff' }} cursor={{ fill: '#111' }} />
                      <Bar dataKey="scans" fill="#00f0ff" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="no-data">NO_DATA_AVAILABLE</p>
                )}
              </div>
            </div>
          </section>

          <section className="terminal-panel table-panel">
            <div className="panel-header">&gt;&nbsp;RECENT_SCANS_LOG</div>
            <div className="panel-body">
              <div className="cyber-table-wrapper">
                <table className="cyber-table">
                  <thead>
                    <tr>
                      <th>TIMESTAMP</th>
                      <th>PAYLOAD</th>
                      <th>TYPE</th>
                      <th>SEVERITY</th>
                      <th>SCORE</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr key={record.id}>
                        <td className="timestamp">
                          {record.timestamp ? new Date(record.timestamp).toLocaleString() : 'N/A'}
                        </td>
                        <td className="payload">
                          {record.content_scanned?.length > 40
                            ? record.content_scanned.substring(0, 40) + '...'
                            : record.content_scanned}
                        </td>
                        <td>{record.threat_type}</td>
                        <td style={{ color: getThreatColor(record.threat_level), textShadow: `0 0 5px ${getThreatColor(record.threat_level)}` }}>
                          [{record.threat_level}]
                        </td>
                        <td>{record.risk_score}</td>
                        <td>
                          <button
                            className="cyber-btn"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--text-dim)', color: 'var(--text-bright)' }}
                            onClick={() => downloadReport(record.id)}
                          >
                            [DOWNLOAD_REPORT]
                          </button>
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan="6" className="no-data">NO_LOGS_FOUND</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
