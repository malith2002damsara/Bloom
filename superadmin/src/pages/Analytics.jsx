import React, { useState, useEffect } from 'react';
import { superAdminAPI } from '../utils/api';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    revenue: [],
    userGrowth: [],
    productPerformance: [],
    adminActivity: []
  });
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await superAdminAPI.getAnalyticsData(period);
      if (response.success) {
        setAnalyticsData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Analytics</h1>
          <p className="welcome-text">Monitor platform performance and insights</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">
            <svg style={{ width: '1.5rem', height: '1.5rem', marginRight: '8px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
            </svg>
            Total Revenue
          </div>
          <div className="stat-value">$45,231</div>
          <div className="stat-change positive">+12% from last month</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">
            <svg style={{ width: '1.5rem', height: '1.5rem', marginRight: '8px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            Total Orders
          </div>
          <div className="stat-value">1,847</div>
          <div className="stat-change positive">+8% from last month</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">
            <svg style={{ width: '1.5rem', height: '1.5rem', marginRight: '8px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            New Users
          </div>
          <div className="stat-value">342</div>
          <div className="stat-change positive">+15% from last month</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">
            <svg style={{ width: '1.5rem', height: '1.5rem', marginRight: '8px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
            </svg>
            Active Admins
          </div>
          <div className="stat-value">24</div>
          <div className="stat-change positive">+2% from last month</div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Revenue Trend</h2>
          </div>
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--gray)' }}>
            <svg style={{ width: '64px', height: '64px', margin: '0 auto 16px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <p>Chart Coming Soon</p>
          </div>
        </div>
        
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">User Growth</h2>
          </div>
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--gray)' }}>
            <svg style={{ width: '64px', height: '64px', margin: '0 auto 16px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            <p>Chart Coming Soon</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Top Performing Products</h2>
        </div>
        <table className="orders-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Sales</th>
              <th>Revenue</th>
              <th>Growth</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Premium T-Shirt</td>
              <td>234</td>
              <td>$4,680</td>
              <td><span className="status-badge status-completed">+15%</span></td>
            </tr>
            <tr>
              <td>Cotton Hoodie</td>
              <td>189</td>
              <td>$3,780</td>
              <td><span className="status-badge status-completed">+12%</span></td>
            </tr>
            <tr>
              <td>Denim Jacket</td>
              <td>156</td>
              <td>$3,120</td>
              <td><span className="status-badge status-completed">+8%</span></td>
            </tr>
            <tr>
              <td>Casual Pants</td>
              <td>134</td>
              <td>$2,680</td>
              <td><span className="status-badge status-pending">+2%</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Analytics;
