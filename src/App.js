import React, { useState } from "react";
import {
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate
} from "react-router-dom";

// Pages
import Register from "./Register";
import Login from "./Login";
import Users from "./Users";
import UserDetails from "./UserDetails";
import EditUser from "./EditUser";

export default function App() {
  const navigate = useNavigate();

  // Token ko state mein rakha taaki login/logout par UI bina refresh badle
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Logout function
  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLogin"); // optional cleanup
    setToken(null); // State null hote hi Navbar aur Routes turant badal jayenge
    navigate("/login");
  };

  return (
    <div>
      {/* NAVBAR */}
      <nav
        style={{
          display: "flex",
          gap: "20px",
          padding: "15px",
          background: "#007bff",
          alignItems: "center"
        }}
      >
        {/* BEFORE LOGIN (Guest Links) */}
        {!token && (
          <>
            <Link to="/" style={{ color: "white", textDecoration: "none", fontWeight: "600" }}>Register</Link>
            <Link to="/login" style={{ color: "white", textDecoration: "none", fontWeight: "600" }}>Login</Link>
          </>
        )}

        {/* AFTER LOGIN (Authenticated Links) */}
        {token && (
          <>
            <Link to="/users" style={{ color: "white", textDecoration: "none", fontWeight: "600" }}>Users</Link>

            <button
              onClick={logoutUser}
              style={{
                cursor: "pointer",
                marginLeft: "auto",
                padding: "8px 16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontWeight: "600"
              }}
            >
              Logout
            </button>
          </>
        )}
      </nav>

      {/* ROUTES */}
      <Routes>
        {/* Register & Login: login hone ke baad user yahan nahi aa sakta */}
        <Route path="/" element={token ? <Navigate to="/users" /> : <Register />} />
        
        {/* SAHI TARIKA: Login component ko setToken prop pass kiya */}
        <Route path="/login" element={token ? <Navigate to="/users" /> : <Login setToken={setToken} />} />

        {/* Protected Routes: Bina token ke access nahi ho sakte */}
        <Route path="/users" element={token ? <Users /> : <Navigate to="/login" />} />
        <Route path="/user/:id" element={token ? <UserDetails /> : <Navigate to="/login" />} />
        <Route path="/user/:id/edit" element={token ? <EditUser /> : <Navigate to="/login" />} />

        {/* Default / Fallback Route */}
        <Route path="*" element={<Navigate to={token ? "/users" : "/login"} />} />
      </Routes>
    </div>
  );
}