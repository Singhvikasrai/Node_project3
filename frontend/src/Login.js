import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ setToken }) {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");


  const handleLogin = async (e) => {

    e.preventDefault();

    setLoading(true);
    setErrorMessage("");


    try {

      const response = await fetch(
        "http://localhost:5000/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email,
            password
          })
        }
      );


      const data = await response.json();


      console.log("LOGIN RESPONSE:", data);


     if (response.ok && data.success) {

  localStorage.setItem("token", data.token);

  localStorage.setItem(
    "user",
    JSON.stringify(data.user)
  );

  if (setToken) {
    setToken(data.token);
  }

  if (data.user.role === "admin") {
    navigate("/users");
  } else {
   navigate(`/view/${data.user.id}`);
  }

} else {


        setErrorMessage(
          data.message || "Invalid Email or Password"
        );

      }


    } catch (error) {

      console.log(error);

      setErrorMessage(
        "Network Error: Server is not responding."
      );


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



      {
        errorMessage && (

          <div
            style={{
              backgroundColor:"#ffe6e6",
              color:"#cc0000",
              padding:"10px",
              borderRadius:"5px",
              marginBottom:"20px",
              textAlign:"left",
              borderLeft:"5px solid #cc0000"
            }}
          >
             {errorMessage}
          </div>

        )
      }



      <form onSubmit={handleLogin}>


        <input

          type="email"

          placeholder="Enter Email"

          value={email}

          onChange={(e)=>setEmail(e.target.value)}

          required

          style={{
            width:"100%",
            padding:"12px",
            marginBottom:"20px",
            boxSizing:"border-box",
            borderRadius:"5px",
            border:"1px solid #ccc"
          }}

        />



        <input

          type="password"

          placeholder="Enter Password"

          value={password}

          onChange={(e)=>setPassword(e.target.value)}

          required

          style={{
            width:"100%",
            padding:"12px",
            marginBottom:"20px",
            boxSizing:"border-box",
            borderRadius:"5px",
            border:"1px solid #ccc"
          }}

        />



        <button

          type="submit"

          disabled={loading}

          style={{

            width:"100%",

            padding:"12px",

            backgroundColor:
            loading ? "#cccccc" : "#0056b3",

            color:"white",

            border:"none",

            borderRadius:"5px",

            cursor:
            loading ? "not-allowed" : "pointer",

            fontSize:"16px",

            fontWeight:"bold"

          }}

        >

          {
            loading 
            ? "Logging in..."
            : "Login"
          }

        </button>


      </form>


    </div>

  );
}


export default Login;