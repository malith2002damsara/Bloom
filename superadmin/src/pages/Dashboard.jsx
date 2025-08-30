import React, { useState, useEffect } from 'react';
import { superAdminAPI } from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await superAdminAPI.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set some default mock data for demo
      setStats({
        totalAdmins: 12,
        totalUsers: 4,
        totalOrders: 26,
        totalRevenue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, change }) => (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{loading ? '...' : value}</div>
      {change && (
        <div className={`stat-change ${change > 0 ? 'positive' : 'negative'}`}>
          <i className={`fas fa-arrow-${change > 0 ? 'up' : 'down'}`}></i>
          {change > 0 ? '+' : ''}{change}% from last month
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="welcome-text">Welcome back! Here's what's happening with your store.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Sales"
          value="$0"
          change={12.5}
        />
        
        <StatCard
          title="Total Orders"
          value="26"
          change={8.2}
        />
        
        <StatCard
          title="Total Products"
          value="8"
          change={null}
        />
        
        <StatCard
          title="Total Users"
          value="4"
          change={5.1}
        />
      </div>

      {/* Pending Orders Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Pending Orders</h2>
          <span className="alert-badge">You have 0 orders waiting for processing</span>
        </div>
        <p>All orders have been processed. No pending orders at this time.</p>
      </div>

      {/* Recent Orders Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Recent Orders</h2>
          <a href="#" className="view-all">View All</a>
        </div>

        <table className="orders-table">
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>CUSTOMER</th>
              <th>AMOUNT</th>
              <th>STATUS</th>
              <th>DATE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>6895aa508e8a1347f460b61</td>
              <td>
                <div className="user-info">
                  <div className="user-avatar">J</div>
                  John Doe
                </div>
              </td>
              <td>$120.00</td>
              <td><span className="status-badge status-completed">Completed</span></td>
              <td>08/08/2025</td>
            </tr>
            <tr>
              <td>66956526ffeae9433b749570</td>
              <td>
                <div className="user-info">
                  <div className="user-avatar">S</div>
                  Sarah Smith
                </div>
              </td>
              <td>$85.50</td>
              <td><span className="status-badge status-completed">Completed</span></td>
              <td>08/08/2025</td>
            </tr>
            <tr>
              <td>6692ffdblc7f7038038186ca</td>
              <td>
                <div className="user-info">
                  <div className="user-avatar">M</div>
                  Michael Brown
                </div>
              </td>
              <td>$210.75</td>
              <td><span className="status-badge status-completed">Completed</span></td>
              <td>06/08/2025</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Low Stock Alert Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Low Stock Alert</h2>
          <span className="alert-badge">8 products are running low on stock</span>
        </div>
        <p>Check your inventory and restock these items to avoid running out.</p>
      </div>
    </>
  );
};

export default Dashboard;
