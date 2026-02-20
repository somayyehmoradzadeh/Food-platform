import { useState } from "react";
import "../styles/Auth.css";
import { Link } from "react-router-dom";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRestaurant, setIsRestaurant] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://127.0.0.1:8000/api/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password,
        is_restaurant: isRestaurant,
      }),
    });
    const data = await res.json();
    if (res.status === 201) {
      alert("Signup successful!");
      window.location.href = "/login";
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account 🚀</h2>
        <p className="subtitle">Join FoodFinder today</p>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isRestaurant}
            onChange={(e) => setIsRestaurant(e.target.checked)}
          />
          Register as a Restaurant
        </label>

        <button onClick={handleSubmit}>Create Account</button>

        <p className="switch-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
