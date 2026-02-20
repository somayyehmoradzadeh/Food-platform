import React from "react";
import "./Dashboard.css";

export default class OrderHistory extends React.Component {
  constructor(props) {
    super(props);
    this.state = { orders: [], loading: true };
  }

  componentDidMount() {
    const token = localStorage.getItem("access");
    fetch("http://127.0.0.1:8000/api/orders/", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => this.setState({ orders: data, loading: false }))
      .catch(() => this.setState({ orders: [], loading: false }));
  }

  render() {
    const { orders, loading } = this.state;
    if (loading) return <div className="card">Loading orders...</div>;
    return (
      <div className="card">
        <h3>Order History</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              {orders.length === 0 && <tr><td colSpan="5">No orders found</td></tr>}
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.created_at?.slice(0,10)}</td>
                  <td>{o.items_count ?? o.items?.length ?? "-"}</td>
                  <td>${o.total ?? o.amount ?? 0}</td>
                  <td>{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}