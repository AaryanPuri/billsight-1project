import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { FiHome, FiFileText, FiBarChart2, FiShare2 } from "react-icons/fi"; 

const Sidebar = () => (
  <aside className={styles.sidebar}>
    <div className={styles.brand}>Billsight</div>
    <nav className={styles.nav}>
      <NavLink to="/dashboard" className={styles.link} activeClassName={styles.active}>
        <FiHome style={{ marginRight: 10 }} /> Dashboard
      </NavLink>
      <NavLink to="/receipts" className={styles.link} activeClassName={styles.active}>
        <FiFileText style={{ marginRight: 10 }} /> Receipts
      </NavLink>
      <NavLink to="/analytics" className={styles.link} activeClassName={styles.active}>
        <FiBarChart2 style={{ marginRight: 10 }} /> Analytics
      </NavLink>
      <NavLink to="/export" className={styles.link} activeClassName={styles.active}>
        <FiShare2 style={{ marginRight: 10 }} /> Export
      </NavLink>
    </nav>
    {/* Optionally add user/logout at bottom */}
    <div className={styles.footer}>
      <span className={styles.footerUser}>Hi, User</span>
      <button className={styles.logoutBtn}>Logout</button>
    </div>
  </aside>
);

export default Sidebar;