import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/RestaurantDetail.css";

const API_BASE = "http://127.0.0.1:8000";

/** Extract user_id from JWT access token stored as localStorage.accessToken */
function getUserIdFromToken() {
  const token = localStorage.getItem("access");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user_id || payload.id || null;
  } catch (e) {
    return null;
  }
}

/** Your backend returns img like: "[http://...](http://...)" sometimes */
function extractUrlFromMarkdown(s) {
  if (!s || typeof s !== "string") return null;
  let m = s.match(/\((https?:\/\/[^\s)]+)\)/i);
  if (m && m[1]) return m[1];
  m = s.match(/\[(https?:\/\/[^\]]+)\]/i);
  if (m && m[1]) return m[1];
  m = s.match(/https?:\/\/[^\s)]+/i);
  return m ? m[0] : null;
}

function cleanImage(raw) {
  if (!raw) return "";
  const url = extractUrlFromMarkdown(raw);
  if (url) return url;
  if (raw.startsWith("http")) return raw;
  return `${API_BASE}${raw.startsWith("/") ? raw : "/" + raw}`;
}

/** WKT: "SRID=4326;POINT (lng lat)" -> {lat,lng} */
function parsePointWKT(wkt) {
  if (!wkt || typeof wkt !== "string") return null;
  const match = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (!match) return null;
  const lng = parseFloat(match[1]);
  const lat = parseFloat(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

function buildOSMEmbedUrl(lat, lng, delta) {
  const d = typeof delta === "number" ? delta : 0.01;
  const left = lng - d;
  const right = lng + d;
  const top = lat + d;
  const bottom = lat - d;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export default function RestaurantDetail() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState("");

  const [userId, setUserId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" | "online"

  const [cart, setCart] = useState([]); // [{id,name,price,qty}]
  const [location, setLocation] = useState(null); // {lat,lng}
  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState("");

  // 1) set userId from JWT once
  useEffect(() => {
    setUserId(getUserIdFromToken());
  }, []);

  // 2) fetch restaurant detail (menu is nested here)
  useEffect(() => {
    setLoading(true);
    setError("");
    setRestaurant(null);

    fetch(`${API_BASE}/api/restaurants/${id}/`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) {
          throw new Error(`HTTP ${res.status} - Failed to load restaurant`);
        }
        return data;
      })
      .then((data) => {
        setRestaurant(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "Failed to load restaurant");
        setLoading(false);
      });
  }, [id]);

  // cart helpers
  const addToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find((x) => x.id === item.id);
      if (exists) {
        return prev.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
      }
      return prev.concat([
        { id: item.id, name: item.name, price: Number(item.price) || 0, qty: 1 },
      ]);
    });
  };

  const changeQty = (itemId, nextQty) => {
    const q = Number(nextQty);
    setCart((prev) => {
      if (q <= 0) return prev.filter((x) => x.id !== itemId);
      return prev.map((x) => (x.id === itemId ? { ...x, qty: q } : x));
    });
  };

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 0),
      0
    );
  }, [cart]);

  // user location
  const handleSendMyLocation = () => {
    setToast("");
    if (!navigator.geolocation) {
      setToast("Geolocation is not supported by your browser.");
      return;
    }
    setToast("Requesting location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setToast("Location saved ✅");
      },
      () => setToast("Location permission denied ❌"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // place order
  const handlePlaceOrder = () => {
    setToast("");

    if (!restaurant) return;

    if (!userId) {
      setToast("User id not found. Please login again.");
      return;
    }

    if (cart.length === 0) {
      setToast("Cart is empty.");
      return;
    }

    const token = localStorage.getItem("access");
    if (!token) {
      setToast("Please login first.");
      return;
    }

    // payload expected by your serializer (based on your error screenshot)
    const items = cart.map((c) => ({
      menu_item: c.id,
      quantity: c.qty,
    }));

    setPlacing(true);

    fetch(`${API_BASE}/api/orders/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        restaurant: restaurant.id,
        user: userId,
        payment_method: paymentMethod,
        items: items,
        lat: location ? location.lat : null,
        lng: location ? location.lng : null,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data?.detail || JSON.stringify(data);
          throw new Error(msg || "Order failed");
        }
        return data;
      })
      .then(() => {
        // Celery tasks will run on backend after create — frontend just shows success
        setCart([]);
        setToast("Order placed ✅");
      })
      .catch((e) => setToast(e.message || "Order failed"))
      .finally(() => setPlacing(false));
  };

  // render states
  if (loading) return <div className="rd-loading">Loading...</div>;

  if (error) {
    return (
      <div className="rd-page">
        <div className="rd-errorBox">
          <div className="rd-errorTitle">Error</div>
          <div className="rd-errorMsg">{error}</div>
          <Link className="rd-backLink" to="/restaurants">
            ← Back to restaurants
          </Link>
        </div>
      </div>
    );
  }

  if (!restaurant) return <div className="rd-loading">Not found</div>;

  // derived
  const heroImg = cleanImage(restaurant.img || restaurant.image || "");
  const isOpen = !!restaurant.is_open;
  const rating = restaurant.rate ?? restaurant.rating ?? "-";
  const menu = Array.isArray(restaurant.menu) ? restaurant.menu : [];

  const restPoint = parsePointWKT(restaurant.location);
  const restEmbed = restPoint ? buildOSMEmbedUrl(restPoint.lat, restPoint.lng, 0.01) : null;
  const restOpenUrl = restPoint
    ? `https://www.openstreetmap.org/?mlat=${restPoint.lat}&mlon=${restPoint.lng}#map=16/${restPoint.lat}/${restPoint.lng}`
    : null;

  const userEmbed = location ? buildOSMEmbedUrl(location.lat, location.lng, 0.006) : null;

  return (
    <div className="rd-page">
      {/* HERO */}
      <div
        className="rd-hero"
        style={heroImg ? { backgroundImage: `url(${heroImg})` } : undefined}
      >
        <div className="rd-heroOverlay">
          <div className="rd-heroRow">
            <div>
              <h1 className="rd-title">{restaurant.name}</h1>
              <p className="rd-desc">{restaurant.description}</p>
            </div>
            <div className="rd-badges">
              <span className="rd-pill">★ {rating}</span>
              <span className={`rd-pill ${isOpen ? "rd-open" : "rd-closed"}`}>
                {isOpen ? "Open" : "Closed"}
              </span>
            </div>
          </div>

          <Link to="/restaurants" className="rd-backBtn">
            ← Back
          </Link>
        </div>
      </div>

      {/* INFO BAR */}
      <div className="rd-infoBar">
        <div className="rd-infoItem">
          <div className="rd-infoLabel">Address</div>
          <div className="rd-infoValue">📍 {restaurant.address || "-"}</div>
        </div>
        <div className="rd-infoItem">
          <div className="rd-infoLabel">Delivery radius</div>
          <div className="rd-infoValue">
            🚚{" "}
            {restaurant.delivery_radius_m
              ? `${(restaurant.delivery_radius_m / 1000).toFixed(1)} km`
              : "-"}
          </div>
        </div>
        <div className="rd-infoItem">
          <div className="rd-infoLabel">Base prep time</div>
          <div className="rd-infoValue">⏱ {restaurant.base_prep_time_min ?? "-"} min</div>
        </div>
        <div className="rd-infoItem">
          <div className="rd-infoLabel">Owner</div>
          <div className="rd-infoValue">👤 {restaurant.owner?.username || "-"}</div>
        </div>
      </div>

      {/* RESTAURANT MAP */}
      <div className="rd-mapCard">
        <div className="rd-mapHead">
          <h3>Restaurant Location</h3>
          {restOpenUrl ? (
            <a className="rd-mapLink" href={restOpenUrl} target="_blank" rel="noreferrer">
              Open ↗
            </a>
          ) : (
            <span className="rd-muted">No location</span>
          )}
        </div>

        <div className="rd-mapFrame">
          {restEmbed ? (
            <iframe
              title="Restaurant map"
              src={restEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="rd-mapEmpty">No location available.</div>
          )}
        </div>
      </div>

      {/* LAYOUT */}
      <div className="rd-layout">
        {/* MENU */}
        <div className="rd-menu">
          <div className="rd-sectionHead">
            <h2>Menu</h2>
            <span className="rd-muted">Add items to cart</span>
          </div>

          <div className="rd-grid">
            {menu.length === 0 && <div className="rd-muted">No menu items</div>}

            {menu.map((item) => {
              const available = item.is_available !== false;
              return (
                <div key={item.id} className={`rd-card ${available ? "" : "rd-disabled"}`}>
                  <div className="rd-cardTop">
                    <div className="rd-itemTitle">{item.name}</div>
                    <div className="rd-itemDesc">{item.description}</div>
                    <div className="rd-chips">
                      <span className="rd-chip">⏱ {item.prep_time_min ?? "-"} min</span>
                      <span className={`rd-chip ${available ? "rd-chipOk" : "rd-chipOff"}`}>
                        {available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>

                  <div className="rd-cardBottom">
                    <div className="rd-price">${Number(item.price || 0).toFixed(2)}</div>
                    <button
                      className="rd-addBtn"
                      disabled={!available}
                      onClick={() => addToCart({ id: item.id, name: item.name, price: item.price })}
                    >
                      {available ? "Add" : "Unavailable"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CART */}
        <aside className="rd-cart">
          <div className="rd-cartCard">
            <div className="rd-cartHead">
              <h3>Cart</h3>
              <span className="rd-muted">{cart.length} items</span>
            </div>

            <div className="rd-cartList">
              {cart.length === 0 ? (
                <div className="rd-muted">Cart is empty</div>
              ) : (
                cart.map((c) => (
                  <div className="rd-cartRow" key={c.id}>
                    <div>
                      <div className="rd-cartName">{c.name}</div>
                      <div className="rd-muted">${Number(c.price).toFixed(2)} each</div>
                    </div>
                    <div className="rd-qtyWrap">
                      <button className="rd-qtyBtn" onClick={() => changeQty(c.id, c.qty - 1)}>
                        -
                      </button>
                      <input
                        className="rd-qtyInput"
                        value={c.qty}
                        onChange={(e) => changeQty(c.id, e.target.value)}
                      />
                      <button className="rd-qtyBtn" onClick={() => changeQty(c.id, c.qty + 1)}>
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="rd-cartFoot">
              <div className="rd-totalRow">
                <span className="rd-muted">Subtotal</span>
                <strong>${subtotal.toFixed(2)}</strong>
              </div>

              {/* Payment method */}
              <div className="rd-payWrap">
                <div className="rd-payLabel">Payment Method</div>
                <select
                  className="rd-paySelect"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash on delivery</option>
                  <option value="online">Online payment</option>
                </select>
              </div>

              <div className="rd-actions">
                <button className="rd-btn rd-btnOutline" onClick={handleSendMyLocation}>
                  Send My Location
                </button>
                <button
                  className="rd-btn rd-btnPrimary"
                  disabled={placing || cart.length === 0}
                  onClick={handlePlaceOrder}
                >
                  {placing ? "Placing..." : "Place Order"}
                </button>
              </div>

              {/* User map under Send My Location */}
              {location && (
                <div className="rd-userMapWrap">
                  <div className="rd-userMapTitle">Your Location</div>
                  <div className="rd-userMap">
                    <iframe
                      title="Your location map"
                      src={userEmbed}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <div className="rd-muted">
                    📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                </div>
              )}

              {toast && <div className="rd-toast">{toast}</div>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}