import React from "react";
import "./Dashboard.css";

export default class Notifications extends React.Component {
  constructor(props) {
    super(props);
    this.state = { notes: [], loading: true };
  }

  componentDidMount() {
    const token = localStorage.getItem("access");
    fetch("http://127.0.0.1:8000/api/notifications/", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => this.setState({ notes: data, loading: false }))
      .catch(() => this.setState({ notes: [], loading: false }));
  }

  render() {
    const { notes, loading } = this.state;
    if (loading) return <div className="card">Loading notifications...</div>;
    return (
      <div className="card">
        <h3>Notifications</h3>
        <ul className="notif-list">
          {notes.length === 0 && <li>No notifications</li>}
          {notes.map(n => (
            <li key={n.id}>
              <div className="notif-title">{n.title}</div>
              <div className="notif-body">{n.message}</div>
              <small className="muted">{n.created_at?.slice(0,19).replace("T"," ")}</small>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}