import React, { useState } from "react";
import {
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Register from "./Register";
import Login from "./Login";
import Users from "./Users";
import UserDetails from "./UserDetails";
import EditUser from "./EditUser";
import Audit from "./Audit";
import PendingApprovals from "./PendingApprovals";

export default function App() {
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem("token"));

  // Logged in user
  const user = JSON.parse(localStorage.getItem("user"));

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isLogin");

    setToken(null);

    navigate("/login");
  };

  return (
    <div>
      {/* Navbar */}

      <nav
        style={{
          display: "flex",
          gap: "20px",
          padding: "15px",
          background: "#007bff",
          alignItems: "center",
        }}
      >
        {!token && (
          <>
            <Link to="/" style={{ color: "white" }}>
              Register
            </Link>

            <Link to="/login" style={{ color: "white" }}>
              Login
            </Link>
          </>
        )}

        {token && (
          <>
            {/* Sirf Admin ke liye */}
            {user?.role === "admin" && (
              <>
                <Link to="/users" style={{ color: "white" }}>
                  Users
                </Link>

                <Link to="/pending" style={{ color: "white" }}>
                  Pending Approvals
                </Link>

                <Link to="/Audit" style={{ color: "white" }}>
                  
                </Link>
              </>
            )}

            {/* Normal User ke liye */}
            {user?.role !== "admin" && (
              <Link
                to={`/user/${user?.id}`}
                style={{ color: "white" }}
              >
                My Profile
              </Link>
            )}

            <button
              onClick={logoutUser}
              style={{
                marginLeft: "auto",
                background: "#dc3545",
                color: "white",
                border: "none",
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </>
        )}
      </nav>

      {/* Routes */}

      <Routes>
        {/* Public */}

        <Route
          path="/"
          element={
            token ? (
              user?.role === "admin" ? (
                <Navigate to="/users" />
              ) : (
                <Navigate to={`/user/${user?.id}`} />
              )
            ) : (
              <Register />
            )
          }
        />

        <Route
          path="/login"
          element={
            token ? (
              user?.role === "admin" ? (
                <Navigate to="/users" />
              ) : (
                <Navigate to={`/user/${user?.id}`} />
              )
            ) : (
              <Login setToken={setToken} />
            )
          }
        />

        {/* Admin */}

        <Route
          path="/users"
          element={
            token ? (
              user?.role === "admin" ? (
                <Users logoutUser={logoutUser} />
              ) : (
                <Navigate to={`/user/${user?.id}`} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/pending"
          element={
            token ? (
              user?.role === "admin" ? (
                <PendingApprovals />
              ) : (
                <Navigate to={`/user/${user?.id}`} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/Audit"
          element={
            token ? (
              user?.role === "admin" ? (
                <Audit logoutUser={logoutUser} />
              ) : (
                <Navigate to={`/user/${user?.id}`} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* User Details */}

        <Route
          path="/user/:id"
          element={
            token ? (
              <UserDetails />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/user/:id/edit"
          element={
            token ? (
              <EditUser />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Default */}

        <Route
          path="*"
          element={
            token ? (
              user?.role === "admin" ? (
                <Navigate to="/users" />
              ) : (
                <Navigate to={`/user/${user?.id}`} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </div>
  );
}