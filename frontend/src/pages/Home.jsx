import "../styles/Home.css";
import {useState, useEffect} from "react";

export default function Home() {
    const [restaurants, setRestaurants] = useState([]);
    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/restaurants/")
            .then((res) => res.json())
            .then((data) => setRestaurants(data))
            .catch((err) => console.error("API Error:", err));
    }, []);


    return (
        <div className="home">
            {/* NAVBAR */}
            <header className="navbar">
                <div className="logo">FoodApp</div>
                <div className="nav-buttons">
                    <a href="/login" className="btn-outline">Login</a>
                    <a href="/signup" className="btn-primary">Sign Up</a>
                </div>
            </header>

            {/* HERO */}
            <section className="hero">
                <h1>Delicious food, delivered fast</h1>
                <p>Find the best restaurants near you in seconds.</p>

                <div className="search-box">
                    <input type="text" placeholder="Search for restaurants or dishes..."/>
                    <button>Search</button>
                </div>
            </section>

            {/* RESTAURANTS */}
            <section className="restaurants">
                <h2>Top Restaurants</h2>

                <div className="restaurant-grid">
                    {restaurants.map((rest,index) => (
                        <div className="restaurant-card" key={index}>
                            <div className="icon">
                                <img src={rest.img} alt={rest.name}/>
                            </div>
                            <div className="card-content">
                                <h3>{rest.name}</h3>
                                <p>⭐{rest.rate}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FEATURES */}
            <section className="features">
                <div className="feature">
                    <h3>⚡ Fast Delivery</h3>
                    <p>Your food arrives hot and fresh.</p>
                </div>

                <div className="feature">
                    <h3>🏆 Top Rated</h3>
                    <p>Only the best restaurants are listed.</p>
                </div>

                <div className="feature">
                    <h3>💳 Easy Payment</h3>
                    <p>Secure and fast checkout process.</p>
                </div>
            </section>

            {/* CTA */}
            <section className="cta">
                <h2>Ready to order?</h2>
                <button className="btn-primary large-btn">Get Started</button>
            </section>
        </div>
    );


}