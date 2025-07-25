import React, { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import GoalEditor from "../components/GoalEditor";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

// Import icons
import {
  FiFileText,
  FiTrendingUp,
  FiCalendar,
  FiUpload,
  FiBarChart2,
  FiPlusCircle,
  FiTarget,
} from "react-icons/fi";
import { BiRupee } from "react-icons/bi";

const Dashboard = () => {
  
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value || 0);
  };

  useEffect(() => {
    setLoading(true);
    api
      .get("/dashboard/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-state">Loading dashboard...</div>;
  }
  if (!summary) {
    return <div className="error-state">Could not load dashboard data.</div>;
  }

  const goalProgress = Math.min(
    100,
    (summary.this_month_spent / (summary.monthly_goal || 1)) * 100
  );

  return (
    <div className="dashboard-container">
      {/* --- HEADER --- */}
      <div className="dashboard-header">
        <div>
          <h1 className="header-title">Dashboard</h1>
          <p className="header-subtitle">
            Here's your receipt overview.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/receipts', { state: { openUploader: true } })}>
          <FiUpload /> Upload Receipt
        </button>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="card-content">
            <span className="card-title">Total Spent</span>
            <strong className="card-value">
              {formatCurrency(summary.total_spent)}
            </strong>
          </div>
          <BiRupee className="card-icon" />
        </div>
        <div className="kpi-card">
          <div className="card-content">
            <span className="card-title">Receipts Processed</span>
            <strong className="card-value">{summary.receipts_processed}</strong>
          </div>
          <FiFileText className="card-icon" />
        </div>
        <div className="kpi-card">
          <div className="card-content">
            <span className="card-title">Average Amount</span>
            <strong className="card-value">
              {formatCurrency(summary.average_amount)}
            </strong>
          </div>
          <FiTrendingUp className="card-icon" />
        </div>
        <div className="kpi-card">
          <div className="card-content">
            <span className="card-title">This Month</span>
            <strong className="card-value">
              {formatCurrency(summary.this_month_spent)}
            </strong>
          </div>
          <FiCalendar className="card-icon" />
        </div>
      </div>

      {/* --- MAIN CONTENT GRID (2 Columns) --- */}
      <div className="main-grid">
        {/* --- LEFT COLUMN --- */}
        <div className="panel recent-receipts-panel">
          <div className="panel-header">
            <FiFileText className="panel-icon" />
            <h3 className="panel-title">Recent Receipts</h3>
          </div>
          <div className="receipt-list">
            {summary.recent_receipts && summary.recent_receipts.length > 0 ? (
              summary.recent_receipts.map((r) => (
                <div className="receipt-item" key={r.id}>
                  <div className="receipt-icon-wrapper">
                    <FiFileText />
                  </div>
                  <div className="receipt-details">
                    <span className="receipt-vendor">{r.vendor || "-"}</span>
                    <span className="receipt-category">{r.category || "General"}</span>
                  </div>
                  <div className="receipt-info">
                    <span className="receipt-amount">{formatCurrency(r.amount)}</span>
                    <span className="receipt-date">
                      {r.transaction_date
                        ? new Date(r.transaction_date).toLocaleDateString("en-CA")
                        : "-"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-text">No recent receipts to show.</p>
            )}
          </div>
          <div className="panel-footer">
            <button className="btn btn-secondary" onClick={() => navigate('/receipts')}>View All Receipts</button>
          </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="right-column">
          <div className="panel quick-actions-panel">
            <div className="panel-header">
              <FiPlusCircle className="panel-icon" />
              <h3 className="panel-title">Quick Actions</h3>
            </div>
            <div className="action-list">
              <button className="action-item" onClick={() => navigate('/receipts', { state: { openUploader: true } })}>
                <FiUpload /> Upload New Receipt
              </button>
              <button className="action-item" onClick={() => navigate('/analytics')}>
                <FiBarChart2 /> View Analytics
              </button>
            </div>
          </div>

          <div className="panel monthly-goal-panel">
            <div className="panel-header">
                <FiTarget className="panel-icon" />
                <h3 className="panel-title">Monthly Goal</h3>
            </div>
            <div className="goal-info">
                <span>{formatCurrency(summary.this_month_spent)}</span>
                <span className="goal-total">/ {formatCurrency(summary.monthly_goal)}</span>
            </div>
            <div className="goal-bar-outer">
              <div className="goal-bar-fill" style={{ width: `${goalProgress}%` }} ></div>
            </div>
            <div className="goal-footer">
                <button className="btn-link" onClick={() => setGoalModalOpen(true)}>Edit Goal</button>
                <span>{goalProgress.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Goal Editor Modal --- */}
      {goalModalOpen && (
        <GoalEditor
          currentGoal={summary.monthly_goal}
          onClose={() => setGoalModalOpen(false)}
          onGoalSaved={(newGoal) => {
            setSummary((s) => ({ ...s, monthly_goal: newGoal }));
            setGoalModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;