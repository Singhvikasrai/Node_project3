import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ setToken }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 🛑 Error message dikhane ke liye state
  const [errorMessage, setErrorMessage] = useState(""); 

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(""); // Nayi request bhejte hi purana error clear kar dein

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("isLogin", "true");

        if (setToken) {
          setToken(data.token);
        }
        navigate("/users");
      } else {
        // 🛑 Alert ki jagah state mein backend ka message ("Email not found" ya "Incorrect Password") set kar rahe hain
        setErrorMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Network Error: Server is not responding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "400px",
        margin: "100px auto",
        padding: "30px",
        border: "1px solid #ccc",
        borderRadius: "10px",
        textAlign: "center",
        boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <h2>Login Page</h2>

      {/* 🛑 ERROR MESSAGE BOX: Agar errorMessage state mein kuch hoga, tabhi yeh dikhega */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: "#ffe6e6",
            color: "#cc0000",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "20px",
            fontSize: "14px",
            textAlign: "left",
            borderLeft: "5px solid #cc0000"
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "12px", marginBottom: "20px", boxSizing: "border-box", borderRadius: "5px", border: "1px solid #ccc" }}
          required
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "12px", marginBottom: "20px", boxSizing: "border-box", borderRadius: "5px", border: "1px solid #ccc" }}
          required
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: loading ? "#cccccc" : "#0056b3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default Login;