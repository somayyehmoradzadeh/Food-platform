import React from "react";
import "./Dashboard.css";

export default class Reservation extends React.Component {
  constructor(props) {
    super(props);
    this.state = { rows: [], loading: true };
  }

  componentDidMount() {
    const token = localStorage.getItem("access");
    fetch("http://127.0.0.1:8000/api/reservations/", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => this.setState({ rows: data, loading: false }))
      .catch(() => this.setState({ rows: [], loading: false }));
  }

  render() {
    const { rows, loading } = this.state;
    if (loading) return <div className="card">Loading reservations...</div>;
    return (
      <div className="card">
        <h3>Table Reservations</h3>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>Name</th><th>Date</th><th>Guests</th><th>Status</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan="5">No reservations found</td></tr>}
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.guest_name ?? r.name}</td>
                  <td>{r.date?.slice(0,19).replace("T"," ")}</td>
                  <td>{r.guests ?? r.num_guests}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}