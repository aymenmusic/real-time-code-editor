import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Header from '../components/common/Header';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import '../styles/AnalyticsPage.css';

interface AnalyticsData {
  total_users: number;
  active_users: number;
  inactive_users: number;
  signups_by_month: Record<string, number>;
  top_email_domains: Record<string, number>;
  summary_stats: {
    mean_signups_per_day: number;
    median_signups_per_day: number;
    max_signups_single_day: number;
    days_with_signups: number;
    total_days_span: number;
  };
}

const AnalyticsPage = () => {
  const { isDarkMode } = useThemeStore();
  const { token, isAuthenticated } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/analytics/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${response.status}`);
      }

      const json: AnalyticsData = await response.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Guard: authenticated users only
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={`analytics-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Header showNavLinks={false} />

      <main className="analytics-container">
        <div className="analytics-hero">
          <h2>📊 User Analytics</h2>
          <p className="analytics-subtitle">
            Powered by <strong>Pandas</strong> — real-time database analysis with Python
          </p>
        </div>

        {/* ── Refresh button ───────────────────────────────────────────── */}
        <div className="analytics-actions">
          <button
            className="analytics-refresh-btn"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {/* ── Error state ───────────────────────────────────────────────── */}
        {error && (
          <div className="analytics-error">
            <span className="analytics-error-icon">⚠️</span>
            <span>{error}</span>
            <button className="analytics-retry-btn" onClick={fetchAnalytics}>
              Retry
            </button>
          </div>
        )}

        {/* ── Loading skeleton ──────────────────────────────────────────── */}
        {loading && !data && (
          <div className="analytics-loading">
            <div className="analytics-spinner" />
            <p>Crunching numbers with Pandas…</p>
          </div>
        )}

        {/* ── Dashboard ─────────────────────────────────────────────────── */}
        {data && (
          <div className="analytics-dashboard">
            {/* KPI cards */}
            <div className="analytics-kpis">
              <div className="kpi-card kpi-total">
                <span className="kpi-label">Total Users</span>
                <span className="kpi-value">{data.total_users}</span>
              </div>
              <div className="kpi-card kpi-active">
                <span className="kpi-label">Active</span>
                <span className="kpi-value">{data.active_users}</span>
              </div>
              <div className="kpi-card kpi-inactive">
                <span className="kpi-label">Inactive</span>
                <span className="kpi-value">{data.inactive_users}</span>
              </div>
            </div>

            {/* Time-series & domains row */}
            <div className="analytics-row">
              {/* Signups per month */}
              <div className="analytics-card">
                <h3>📅 Signups per Month</h3>
                {Object.keys(data.signups_by_month).length > 0 ? (
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Signups</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.signups_by_month)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([month, count]) => (
                          <tr key={month}>
                            <td>{month}</td>
                            <td>
                              <span className="table-badge">{count}</span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="analytics-empty">No signup data yet</p>
                )}
              </div>

              {/* Top email domains */}
              <div className="analytics-card">
                <h3>🌐 Top Email Domains</h3>
                {Object.keys(data.top_email_domains).length > 0 ? (
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Domain</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.top_email_domains).map(([domain, count]) => (
                        <tr key={domain}>
                          <td>{domain}</td>
                          <td>
                            <span className="table-badge">{count}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="analytics-empty">No domain data yet</p>
                )}
              </div>
            </div>

            {/* Summary statistics */}
            <div className="analytics-card analytics-summary">
              <h3>📈 Summary Statistics</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Mean signups / day</span>
                  <span className="summary-value">{data.summary_stats.mean_signups_per_day}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Median signups / day</span>
                  <span className="summary-value">{data.summary_stats.median_signups_per_day}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Max single day</span>
                  <span className="summary-value">{data.summary_stats.max_signups_single_day}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Days with signups</span>
                  <span className="summary-value">{data.summary_stats.days_with_signups}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total span (days)</span>
                  <span className="summary-value">{data.summary_stats.total_days_span}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AnalyticsPage;