import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css'; 

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  if (!user) {
    return null;
  }

  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <NavLink to="/dashboard" className="navbar-brand">
          Billsight
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/receipts">Receipts</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
          <NavLink to="/export">Export</NavLink>
        </nav>
      </div>

      <div className="navbar-right">
        <span className="user-greeting">Hi, {user.username}</span>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;