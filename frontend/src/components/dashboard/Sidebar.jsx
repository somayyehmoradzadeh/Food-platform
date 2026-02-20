import React from "react";
import { FaHome, FaHistory, FaCreditCard, FaBell, FaChair } from "react-icons/fa"; // ← اضافه شد
import "./Dashboard.css";

export default class Sidebar extends React.Component {
  render() {
    const { isOpen, toggleSidebar, setActive, active } = this.props;
    return (
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand">FoodApp</div>
          <button className="close" onClick={toggleSidebar}>✕</button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className={active==="overview" ? "active" : ""} onClick={() => setActive("overview")}>
              <FaHome className="side-icon" /> <span className="side-text">Overview</span>
            </li>

            <li className={active==="orders" ? "active" : ""} onClick={() => setActive("orders")}>
              <FaHistory className="side-icon" /> <span className="side-text">Order History</span>
            </li>

            <li className={active==="payment" ? "active" : ""} onClick={() => setActive("payment")}>
              <FaCreditCard className="side-icon" /> <span className="side-text">Payment</span>
            </li>

            <li className={active==="notifications" ? "active" : ""} onClick={() => setActive("notifications")}>
              <FaBell className="side-icon" /> <span className="side-text">Notifications</span>
              {this.props.unreadCount > 0 && <span className="badge">{this.props.unreadCount}</span>}
            </li>

            <li className={active==="reservation" ? "active" : ""} onClick={() => setActive("reservation")}>
              <FaChair className="side-icon" /> <span className="side-text">Table Reservation</span>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <small>v1.0 • Dashboard</small>
        </div>
      </aside>
    );
  }
}