import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/RestaurantDetail.css";

export default function RestaurantDetail() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  const API = "http://127.0.0.1:8000";

  const cleanImage = (img) => {
    if (!img) return null;
    const match = img.match(/\((.*?)\)/);
    if (match && match[1]) return match[1];
    if (img.startsWith("http")) return img;
    return API + img;
  };

  useEffect(() => {
    fetch(`${API}/api/restaurants/${id}/`)
      .then(res => res.json())
      .then(data => {
        setRestaurant(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="rd-loading">Loading...</div>;
  if (!restaurant) return <div className="rd-loading">Not Found</div>;

  return (
    <div className="rd-page">

      {/* HERO */}
      <div
        className="rd-hero"
        style={{ backgroundImage: `url(${cleanImage(restaurant.img)})` }}
      >
        <div className="rd-hero-overlay">
          <h1>{restaurant.name}</h1>
          <p>{restaurant.description}</p>

          <div className="rd-meta">
            ⭐ {restaurant.rate}
            <span className={restaurant.is_open ? "open" : "closed"}>
              {restaurant.is_open ? "Open Now" : "Closed"}
            </span>
          </div>
        </div>
      </div>

      {/* INFO BAR */}
      <div className="rd-info-bar">
        <div>
          📍 {restaurant.address}
        </div>

        <div>
          🚚 Delivery Radius: {(restaurant.delivery_radius_m / 1000).toFixed(1)} km
        </div>

        <div>
          ⏱ Base Prep Time: {restaurant.base_prep_time_min} min
        </div>

        <div>
          👤 Owner: {restaurant.owner?.username}
        </div>
      </div>

      {/* MENU */}
      <div className="rd-container">
        <h2 className="rd-section-title">Menu</h2>

        <div className="rd-grid">
          {restaurant.menu.map(item => (
            <div
              key={item.id}
              className={`rd-card ${!item.is_available ? "disabled" : ""}`}
            >
              <div className="rd-card-content">
                <h3>{item.name}</h3>
                <p>{item.description}</p>

                <div className="rd-small-info">
                  ⏱ {item.prep_time_min} min
                </div>
              </div>

              <div className="rd-card-footer">
                <span>${Number(item.price).toFixed(2)}</span>

                {item.is_available ? (
                  <button>Add</button>
                ) : (
                  <button disabled>Unavailable</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}