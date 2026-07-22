import { useState } from "react";
import { useNavigate } from "react-router-dom";

/** Keeps authentication storage and navigation logic outside UI components. */
export default function useAuth() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const user = JSON.parse(localStorage.getItem("user"));

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isLogin");
    setToken(null);
    navigate("/login");
  };

  return { token, setToken, user, logoutUser };
}
