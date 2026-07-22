import React from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login/Login.jsx";
import Users from "./pages/Users";
import UserDetails from "./pages/UserDetails";
import EditUser from "./pages/EditUser";
import Audit from "./pages/Audit/Audit.jsx";
import PendingApprovals from "./pages/PendingApprovals";
import AppNavigation from "./components/AppNavigation/AppNavigation.js";
import useAuth from "./hooks/useAuth";

export default function App() {
  const { token, setToken, user, logoutUser } = useAuth();

  return (
    <div>
      <AppNavigation token={token} user={user} onLogout={logoutUser} />

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
