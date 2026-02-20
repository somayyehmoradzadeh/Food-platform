import React from "react";
import Sidebar from "./Sidebar";
import OrderHistory from "./OrderHistory";
import Payment from "./Payment";
import Notifications from "./Notifications";
import Reservation from "./Reservations.jsx";
import { Bar } from "react-chartjs-2";
import "./Dashboard.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";


ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sidebarOpen: window.innerWidth >= 992,
      active: "overview",
      loading: true,
      error: null,
      userInfo: null,
      orderStats: [],        // for small chart
      unreadNotifs: 0,
    };
  }

  componentDidMount() {
    const token = localStorage.getItem("access");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // get main dashboard info (username, is_restaurant, totals...)
    fetch("http://127.0.0.1:8000/api/dashboard/", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or server error");
        return res.json();
      })
      .then((data) => this.setState({ userInfo: data, loading: false }))
      .catch((err) => this.setState({ error: err.message, loading: false }));

    // small chart data (last 7 days)
    fetch("http://127.0.0.1:8000/api/orders/", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => this.setState({ orderStats: data || [] }))
      .catch(() => this.setState({ orderStats: [] }));

    // unread notifications count
    fetch("http://127.0.0.1:8000/api/notifications/", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => (res.ok ? res.json() : { unread: 0 }))
      .then((d) => this.setState({ unreadNotifs: d.unread || 0 }))
      .catch(() => this.setState({ unreadNotifs: 0 }));

    window.addEventListener("resize", this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = () => {
    if (window.innerWidth >= 992 && !this.state.sidebarOpen) this.setState({ sidebarOpen: true });
    if (window.innerWidth < 992 && this.state.sidebarOpen) this.setState({ sidebarOpen: false });
  };

  toggleSidebar = () => this.setState((s) => ({ sidebarOpen: !s.sidebarOpen }));
  setActive = (section) => this.setState({ active: section });

  handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    window.location.href = "/login";
  };

  renderContent() {
    const { active, orderStats, userInfo } = this.state;

    if (active === "orders") return <OrderHistory />;
    if (active === "payment") return <Payment />;
    if (active === "notifications") return <Notifications />;
    if (active === "reservation") return <Reservation />;

    // Overview: mini stats + small chart
    const slice = (orderStats || []).slice(-7);
    const labels = slice.length ? slice.map((i) => i.date || "") : ["No data"];
    const values = slice.length ? slice.map((i) => i.count || 0) : [0];

    const chartData = {
      labels,
      datasets: [{ data: values, backgroundColor: "#6C63FF" }],
    };

    const chartOptions = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { grid: { display: false }, beginAtZero: true } },
    };

    const orders7 = values.reduce((a, b) => a + b, 0);
    const activeOrders = userInfo?.active_orders ?? 0;
    const revenue = userInfo?.total_revenue ?? 0;

    return (
      <div className="dashboard-overview">
        <div className="overview-row">
          <div className="card stats-summary">
            <h3>Welcome back, {userInfo?.username}</h3>
            <p className="muted">Here's a quick look at your recent activity</p>

            <div className="mini-stats">
              <div className="mini-card">
                <div className="label">Orders (7d)</div>
                <div className="value">{orders7}</div>
              </div>
              <div className="mini-card">
                <div className="label">Active Orders</div>
                <div className="value">{activeOrders}</div>
              </div>
              <div className="mini-card">
                <div className="label">Revenue</div>
                <div className="value">${revenue}</div>
              </div>
            </div>
            <div className="recent-activity">
              <h4>Recent Activity</h4>
              <p className="muted">Quick actions and summary — wire endpoints where needed</p>
              <div className="actions">
                <button className="btn-primary">New Order</button>
                <button className="btn-outline">Make Payment</button>
                <button className="btn-outline" onClick={() => this.setActive("notifications")}>View Notifications</button>
              </div>
            </div>
          </div>

          <div className="card small-chart">
            <h3>Orders Overview</h3>
            <div className="chart-wrap">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="overview-row">
          <div className="card wide">
            <h3>Recent Activity</h3>
            <p className="muted">Actions and shortcuts</p>
            <div className="actions">
              <button className="btn-primary">New Order</button>
              <button className="btn-outline">Make Payment</button>
              <button className="btn-outline" onClick={() => this.setActive("orders")}>Order History</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { sidebarOpen, loading, error, unreadNotifs, active } = this.state;

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return (
      <div className="error">
        <p>{error}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );

    return (
      <div className="dashboard-layout">
        <Sidebar
          isOpen={sidebarOpen}
          toggleSidebar={this.toggleSidebar}
          setActive={this.setActive}
          active={active}
          unreadCount={unreadNotifs}
        />

        <div className={`main-content ${sidebarOpen ? "with-sidebar" : ""}`}>
          <div className="topbar">
            <button className="menu-btn" onClick={this.toggleSidebar}>☰</button>
            <div className="topbar-title">Dashboard</div>

            <div className="topbar-actions">
              <button className="icon-btn" title="Notifications" onClick={() => this.setActive("notifications")}>
                🔔{unreadNotifs > 0 && <span className="badge-top">{unreadNotifs}</span>}
              </button>
              <button className="icon-btn" onClick={this.handleLogout}>Logout</button>
            </div>
          </div>

          <div className="content-area">{this.renderContent()}</div>
        </div>
      </div>
    );
  }
}