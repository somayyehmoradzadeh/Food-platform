import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./components/dashboard/Dashboard.jsx";
import Restaurants from "./pages/Resturants";
import RestaurantDetail from "./pages/RestaurantDetail";

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/signup" element={<Signup/>}/>
                <Route path="/restaurants" element={<Restaurants/>}/>
                <Route path="/restaurants/:id" element={<RestaurantDetail/>}/>
                <Route path="/dashboard" element={<Dashboard/>}/>
            </Routes>
        </Router>
    );
}
