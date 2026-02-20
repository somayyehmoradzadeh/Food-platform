import React from "react";
import "./Dashboard.css";

export default class Payment extends React.Component {
  constructor(props) {
    super(props);
    this.state = { payments: [], loading: true };
  }

  componentDidMount() {
    const token = localStorage.getItem("access");
    fetch("http://127.0.0.1:8000/api/payments/", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => this.setState({ payments: data, loading: false }))
      .catch(() => this.setState({ payments: [], loading: false }));
  }

  render() {
    const { payments, loading } = this.state;
    if (loading) return <div className="card">Loading payments...</div>;
    return (
      <div className="card">
        <h3>Payments</h3>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {payments.length === 0 && <tr><td colSpan="4">No payments found</td></tr>}
              {payments.map(p => (
                <tr key={p.id}><td>{p.id}</td><td>{p.date?.slice(0,10)}</td><td>${p.amount}</td><td>{p.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}