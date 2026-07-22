import React from "react";
import { Link } from "react-router-dom";

const linkStyle = { color: "white" };

/** Presentational navigation for the application shell. */
export default function AppNavigation({ token, user, onLogout }) {
  return (
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
          <Link to="/" style={linkStyle}>Register</Link>
          <Link to="/login" style={linkStyle}>Login</Link>
        </>
      )}

      {token && (
        <>
          {user?.role === "admin" && (
            <>
              <Link to="/users" style={linkStyle}>Users</Link>
              <Link to="/pending" style={linkStyle}>Pending Approvals</Link>
              <Link to="/Audit" style={linkStyle} aria-label="Audit" />
            </>
          )}

          {user?.role !== "admin" && (
            <Link to={`/user/${user?.id}`} style={linkStyle}>My Profile</Link>
          )}

          <button
            type="button"
            onClick={onLogout}
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
  );
}
