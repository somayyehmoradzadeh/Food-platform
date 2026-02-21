//
// import React from "react";
//  import { Link } from "react-router-dom";
//  import "../components/dashboard/Dashboard.css";
//
//  export default class Restaurants extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = { restaurants: [], loading: true, error: null };
//   }
//
//      componentDidMount() {
//          const token = localStorage.getItem("access");
//          fetch("http://127.0.0.1:8000/api/restaurants/", {
//              headers: token ? {Authorization: "Bearer " + token} : {},
//          })
//              .then((res) => {
//                  if (!res.ok) throw new Error("Failed to load restaurants");
//                  return res.json();
//              })
//              .then((data) => this.setState({restaurants: data || [], loading: false}))
//              .catch((err) => this.setState({error: err.message, loading: false}));
//      }
//
//      render() {
//          const {restaurants, loading, error} = this.state;
//          if (loading) return <div className="card">Loading restaurants...</div>;
//          if (error) return <div className="card" style={{color: "red"}}>{error}</div>;
//
//          return (
//              <div className="page">
//                  <div className="card">
//                      <h3>Restaurants</h3>
//                      <div className="table-wrap">
//                          <div className="restaurant-grid">
//                              {restaurants.length === 0 && <div>No restaurants found</div>}
//                              {restaurants.map((r) => (
//                                  <div className="restaurant-card" key={r.id} style={{maxWidth: 320}}>
//                                      <div className="image-wrapper" style={{height: 140, overflow: "hidden"}}>
//                                          <img src={r.img || r.img || ""} alt={r.name}
//                                               style={{width: "100%", objectFit: "cover"}}/>
//                                      </div>
//                                      <div className="card-content">
//                                          <h4>{r.name}</h4>
//                                          <p className="muted">⭐ {r.rate ?? r.rate ?? "-"}</p>
//                                          <div style={{marginTop: 8}}>
//                                              <Link to={`/restaurants/${r.id}`} className="btn-primary">View Menu</Link>
//                                          </div>
//                                      </div>
//                                  </div>
//                              ))}
//                          </div>
//                      </div>
//                  </div>
//              </div>
//          );
//      }
//  }
//
//
//
// // src/pages/Restaurants.jsx
// // import React from "react";
// // import {Link} from "react-router-dom";
// // import "../components/dashboard/Dashboard.css";
// //
// // export default class Restaurants extends React.Component {
// //     constructor(props) {
// //         super(props);
// //         this.state = {restaurants: [], loading: true, error: null,};
// //     }
// //
// //     componentDidMount() {
// //         this.loadRestaurants();
// //     }
// //
// //     loadRestaurants = async () => {
// //         try {
// //             const response = await fetch("http://127.0.0.1:8000/api/restaurants/");
// //             if (!response.ok) {
// //                 throw new Error("Failed to fetch restaurants");
// //             }
// //             const data = await response.json();
// //             // اگر pagination فعال باشه      const list = Array.isArray(data) ? data : data.results;
// //             this.setState({restaurants: list || [], loading: false,});
// //         } catch (error) {
// //             console.error("Restaurants Error:", error);
// //             this.setState({error: error.message, loading: false,});
// //         }
// //     };
// //
// //     render() {
// //         const {restaurants, loading, error} = this.state;
// //         if (loading) {
// //             return (<div className="page">
// //                 <div className="card"><h3>Loading restaurants...</h3></div>
// //             </div>);
// //         }
// //         if (error) {
// //             return (<div className="page">
// //                 <div className="card" style={{color: "red"}}><h3>Error: {error}</h3></div>
// //             </div>);
// //         }
// //         return (<div className="page">
// //             <div className="card"><h2>Restaurants</h2>
// //                 <div style={{
// //                     display: "grid",
// //                     gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
// //                     gap: "20px",
// //                     marginTop: "20px",
// //                 }}>            {restaurants.length === 0 && (<p>No restaurants found.</p>)}
// //                     {restaurants.map((restaurant) => (<Link key={restaurant.id} to={`/restaurant/${restaurant.id}`}
// //                                                             style={{textDecoration: "none", color: "inherit"}}>
// //                         <div style={{
// //                             background: "#fff",
// //                             padding: "15px",
// //                             borderRadius: "12px",
// //                             boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
// //                             transition: "0.3s",
// //                         }}><img
// //                             src={restaurant.image ? `http://127.0.0.1:8000${restaurant.image}` : "https://via.placeholder.com/300x150"}
// //                             alt={restaurant.name}
// //                             style={{width: "100%", height: "150px", objectFit: "cover", borderRadius: "10px",}}/>
// //                             <h3 style={{marginTop: "10px"}}>                    {restaurant.name}                  </h3>
// //                             <p> {restaurant.rating || "No rating"}</p></div>
// //                     </Link>))}          </div>
// //             </div>
// //         </div>);
// //     }
// // }


// src/pages/Restaurants.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../styles/Restaurants.css";

export default class Restaurants extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      restaurants: [],
      loading: true,
      error: null,
      query: "",
      sort: "popular", // "popular" | "new" | "rating"
    };
    // set your backend base if needed
    this.apiBase = "http://127.0.0.1:8000";
    this.placeholder = "https://images.unsplash.com/photo-1541544180-3d4a5f4fe6d6?w=1200&q=80&auto=format&fit=crop";
  }

  componentDidMount() {
    this.loadRestaurants();
  }

  loadRestaurants = async () => {
    this.setState({ loading: true, error: null });
    try {
      const res = await fetch(`${this.apiBase}/api/restaurants/`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server responded ${res.status}: ${txt}`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.results || [];
      this.setState({ restaurants: list, loading: false });
    } catch (err) {
      console.error("Restaurants load error:", err);
      this.setState({ error: err.message || "Failed to load restaurants", loading: false });
    }
  };

  // normalize image url (handles relative paths from Django)
  imgUrl = (raw) => {
    if (!raw) return this.placeholder;
    if (/^https?:\/\//i.test(raw)) return raw;
    // raw may start with /media/...
    const stripped = raw.startsWith("/") ? raw : `/${raw}`;
    return `${this.apiBase}${stripped}`;
  };

  onSearchChange = (e) => this.setState({ query: e.target.value });
  onSortChange = (v) => this.setState({ sort: v });

  filteredList = () => {
    const { restaurants, query, sort } = this.state;
    let list = restaurants.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) => (r.name || r.title || "").toLowerCase().includes(q));
    }
    if (sort === "rating") {
      list.sort((a, b) => (b.rating ?? b.rate ?? 0) - (a.rating ?? a.rate ?? 0));
    } else if (sort === "new") {
      list.sort((a, b) => new Date(b.created_at || b.date_added || 0) - new Date(a.created_at || a.date_added || 0));
    } else {
      // popular or default: keep API order
    }
    return list;
  };

  renderCard = (r) => {
    const img = this.imgUrl(r.image || r.img || r.photo || r.image_url);
    const name = r.name || r.title || "Unnamed";
    const rating = r.rating ?? r.rate ?? null;
    const desc = r.short_description || r.description || r.address || "";

    return (
      <Link
        key={r.id  ?? name}
        to={`/restaurants/${r.id  ?? name}`}
        className="rest-link"
        aria-label={`Open ${name} menu`}
      >
        <article className="rest-card">
          <div className="rest-media">
            <img src={img} alt={name} loading="lazy" />
            {rating !== null && <div className="badge">★ {Number(rating).toFixed(1)}</div>}
          </div>

          <div className="rest-body">
            <div className="rest-top">
              <h3 className="rest-title">{name}</h3>
              <div className="rest-sub muted">{desc}</div>
            </div>

            <div className="rest-footer">
              <div style={{display:"flex", gap:8, alignItems:"center"}}>
                <svg className="icon-clock" viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                  <path fill="currentColor" d="M12 1a11 11 0 1 0 11 11A11.012 11.012 0 0 0 12 1zm1 12.59V7h-2v6.17l5.03 3.01 1-1.66z"></path>
                </svg>
                <small className="small muted">{r.delivery_time_min ? `${r.delivery_time_min}-${r.delivery_time_min+20} min` : "–"}</small>
              </div>

              <button className="btn btn-primary">View Menu</button>
            </div>
          </div>
        </article>
      </Link>
    );
  };

  render() {
    const { loading, error, query, sort } = this.state;
    const list = this.filteredList();

    return (
      <div className="page restaurants-page modern">
        <header className="top-row">
          <div>
            <h1 className="page-title">Restaurants</h1>
            <p className="muted">Best places around — tap to view menu and order.</p>
          </div>

          <div className="controls">
            <div className="search-wrap">
              <input value={query} onChange={this.onSearchChange} placeholder="Search restaurants or dishes" aria-label="Search restaurants" />
              <button className="icon-btn" onClick={() => this.setState({ query: "" })} title="Clear">✕</button>
            </div>

            <div className="sort">
              <select value={sort} onChange={(e) => this.onSortChange(e.target.value)} aria-label="Sort restaurants">
                <option value="popular">Recommended</option>
                <option value="rating">Highest rating</option>
                <option value="new">Newest</option>
              </select>
            </div>
          </div>
        </header>

        {loading && (
          <div className="grid-restaurants">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="skeleton-card" key={i}>
                <div className="skeleton-media" />
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
              </div>
            ))}
          </div>
        )}

        {error && <div className="card error-card">Error: {error}</div>}

        {!loading && !error && (
          <main>
            <div className="grid-restaurants">
              {list.length === 0 ? <div className="card">No restaurants found.</div> : list.map(this.renderCard)}
            </div>
          </main>
        )}
      </div>
    );
  }
}
