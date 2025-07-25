import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FiCalendar, FiDownload, FiBarChart2, FiDollarSign, FiPercent, FiHash } from 'react-icons/fi';
import './AnalyticsPage.css'; 

const COLORS = ["#0d6efd", "#6c757d", "#198754", "#ffc107", "#dc3545", "#6610f2"];

const AnalyticsPage = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    Promise.all([
      api.get("/analytics/summary"),
      api.get("/analytics/trends"),
      api.get("/analytics/categories"),
      api.get("/analytics/vendors"),
    ])
      .then(([s, t, c, v]) => {
        setSummary(s.data);
        setTrends(t.data);
        setCategories(c.data);
        setVendors(v.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading Analytics...</div>;
  if (!summary) return <div className="page-error">Could not load analytics data.</div>;


  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">₹{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Insights and trends from your receipt data.</p>
        </div>
        <div className="header-actions">
        </div>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="kpi-grid">
        <div className="kpi-card"><FiBarChart2 /><p>Monthly Average</p><span>₹{summary.monthly_average?.toFixed(2)}</span></div>
        <div className="kpi-card"><FiDollarSign /><p>Median Spend</p><span>₹{summary.monthly_median?.toFixed(2)}</span></div>
        <div className="kpi-card"><FiHash /><p>Top Category</p><span>{summary.top_category}</span></div>
        <div className="kpi-card"><FiPercent /><p>Processing Rate</p><span>{summary.processing_rate}%</span></div>
      </div>

      {/* --- CHARTS --- */}
      <div className="charts-grid">
        <div className="chart-panel">
          <h3 className="panel-title">Monthly Spending Trend</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#0d6efd" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-panel">
          <h3 className="panel-title">Spending by Category</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- TOP VENDORS --- */}
      <div className="vendors-panel">
        <h3 className="panel-title">Top Vendors</h3>
        <div className="vendors-grid">
          {vendors.map(vendor => (
            <div key={vendor.vendor} className="vendor-card">
              <span className="vendor-name">{vendor.vendor}</span>
              <strong className="vendor-total">₹{vendor.total.toFixed(2)}</strong>
              <span className="vendor-avg">{vendor.count} receipts &middot; Avg. ₹{(vendor.total / vendor.count).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;