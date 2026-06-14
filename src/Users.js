import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Users() {
  const statusMap = {
    1: "Active",
    0: "Inactive",
    9: "Pending"
  };
  
  const [mobileError, setMobileError] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [mobileSearch, setMobileSearch] = useState("");
  const [pincodeSearch, setPincodeSearch] = useState("");
  const [statusSearch, setStatusSearch] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    email: "",
    mobile: "",
    pincode: "",
    status: ""
  });

  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/users", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      setUsers(data.data || []);
      console.log("API Response =", data);
    } catch (err) {
      console.log(err);
    }
  };

  const deleteUser = async (id) => {
   
      const token = localStorage.getItem("token");

      await fetch(`http://localhost:5000/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      fetchUsers();
    
  };

 
  const handleSearch = () => {
     if (mobileSearch && mobileSearch.length !== 10) {
    setMobileError("Mobile number must be 10 digits");
    return;
  }
  setMobileError("");
    setFilters({
      search,
      email: emailSearch,
      mobile: mobileSearch,
      pincode: pincodeSearch,
      status: statusSearch
    });
  };

 
 
  const handleReset = () => {
    setSearch("");
    setEmailSearch("");
    setMobileSearch("");
    setPincodeSearch("");
    setStatusSearch("");
     setMobileError("");
    
   
    setFilters({
      search: "",
      email: "",
      mobile: "",
      pincode: "",
      status: ""
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- STYLES ---
  const containerStyle = {
    padding: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif"
  };

  const titleStyle = {
    textAlign: "center",
    color: "#333",
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "30px",
    textTransform: "uppercase",
    letterSpacing: "1px"
  };

  const searchContainerStyle = {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "25px",
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    alignItems: "center"
  };

  const inputWrapperStyle = {
    flex: "1",
    minWidth: "160px"
  };

  const inputStyle = {
    width: "100%", 
    padding: "12px 15px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s",
    height: "44px"
  };

  const searchButtonStyle = {
    padding: "0 24px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    boxSizing: "border-box",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "100px"
  };

  // Clear button ke liye alag se thoda grey/red color style
  const clearButtonStyle = {
    ...searchButtonStyle,
    backgroundColor: "#6c757d", // Grey color
  };

  const tableContainerStyle = {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    overflowX: "auto"
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    tableLayout: "fixed"
  };

  const headerStyle = {
    backgroundColor: "#007bff",
    color: "white",
    padding: "14px 12px",
    textAlign: "left",
    fontWeight: "700",
    letterSpacing: "0.5px",
    textTransform: "uppercase"
  };

  const rowStyle = {
    borderBottom: "1px solid #eee",
    backgroundColor: "#fff",
    transition: "background-color 0.2s"
  };

  const cellStyle = {
    padding: "15px 12px",
    color: "#555",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  };

  const buttonGroupStyle = {
    display: "flex",
    gap: "6px",
    flexWrap: "nowrap"
  };

  const buttonStyle = (variant = "primary") => ({
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    ...(variant === "primary" && {
      backgroundColor: "#007bff",
      color: "white"
    }),
    ...(variant === "danger" && {
      backgroundColor: "#dc3545",
      color: "white"
    })
  });

  const getStatusBadgeStyle = (status) => {
    const normalizeStatus = status !== undefined && status !== null ? status.toString().trim() : "";
    if (normalizeStatus === "1" || normalizeStatus.toLowerCase() === "active" || normalizeStatus === "true") {
      return { backgroundColor: "#e6f4ea", color: "#137333" };
    } else if (normalizeStatus === "0" || normalizeStatus.toLowerCase() === "inactive" || normalizeStatus === "false") {
      return { backgroundColor: "#fce8e6", color: "#c5221f" };
    } else {
      return { backgroundColor: "#e8f0fe", color: "#1a73e8" };
    }
  };

  const filteredUsers = users ? users.filter((u) =>
    (u.name?.toLowerCase() || "").includes(filters.search.toLowerCase()) &&
    (u.email?.toLowerCase() || "").includes(filters.email.toLowerCase()) &&
    (u.mobile?.toString() || "").includes(filters.mobile) &&
    (u.pincode?.toString() || "").includes(filters.pincode) &&
    (u.status?.toString() || "").includes(filters.status)
  ) : [];

  const emptyStateStyle = {
    textAlign: "center",
    padding: "60px 20px",
    color: "#999",
    fontSize: "18px",
    fontWeight: "500"
  };

  return (
    <form
  style={searchContainerStyle}
  onSubmit={(e) => {
    e.preventDefault();
    handleSearch();
  }}
>
    <div style={containerStyle}>

      <h1 style={titleStyle}>👥 User Management</h1>

      {/* Search Filter Bar */}
      <div style={searchContainerStyle}>
        <div style={inputWrapperStyle}>
          <input
            type="text"
            placeholder="Search by Name"
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[A-Za-z ]*$/.test(value)) {
                setSearch(value);
              }
            }}
            style={inputStyle}
          />
        </div>

        <div style={inputWrapperStyle}>
          <input
            type="text"
            placeholder="Search by Email"
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={inputWrapperStyle}>
          <input
            type="text"
            placeholder="Search by Mobile"
            value={mobileSearch}
              maxLength={10}
             onChange={(e) => {
    const value = e.target.value;
     if (!/^\d*$/.test(value)) {
      setMobileError("Only numbers are allowed");
      return;
    }
     setMobileError("");
     setMobileSearch(value);
  }}
  
  
     style={inputStyle}
          />
           {mobileError && (
    <span style={{ color: "red", fontSize: "12px" }}>
      {mobileError}
    </span>
  )}
        </div>

        <div style={inputWrapperStyle}>
          <input
            type="text"
            placeholder="Search by Pincode"
            value={pincodeSearch}
            maxLength={6}
            onChange={(e) => setPincodeSearch(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={inputWrapperStyle}>
          <select
            value={statusSearch}
            onChange={(e) => setStatusSearch(e.target.value)}
            style={inputStyle}
          >
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
            <option value="9">Pending</option>
          </select>
        </div>

       
        <button onClick={handleSearch} style={searchButtonStyle}>
          Search
        </button>

        {/* --- NEW: Clear Button --- */}
        <button onClick={handleReset} style={clearButtonStyle}>
          Clear
        </button>
      </div>

      {/* Data Table / Empty State */}
      {filteredUsers.length === 0 ? (
        <div style={{ ...tableContainerStyle, ...emptyStateStyle }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>📭</div>
          No users found
        </div>
      ) : (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...headerStyle, width: "20%" }}>Name</th>
                <th style={{ ...headerStyle, width: "25%" }}>Email</th>
                <th style={{ ...headerStyle, width: "15%" }}>Mobile</th>
                <th style={{ ...headerStyle, width: "15%" }}>Pincode</th>
                <th style={{ ...headerStyle, width: "13%" }}>Status</th>
                <th style={{ ...headerStyle, width: "16%" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((u, idx) => (
                <tr
                  key={u.id || idx}
                  style={{
                    ...rowStyle,
                    backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f8ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#fff" : "#f9f9f9")}
                >
                  <td style={cellStyle} title={u.name}>
                    <strong>{u.name}</strong>
                  </td>
                  <td style={cellStyle} title={u.email}>{u.email}</td>
                  <td style={cellStyle}>{u.mobile}</td>
                  <td style={cellStyle}>{u.pincode}</td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        ...getStatusBadgeStyle(u.status),
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        display: "inline-block",
                        textTransform: "capitalize"
                      }}
                    >
                      {u.status !== undefined && u.status !== null 
                        ? (statusMap[u.status] || u.status.toString()) 
                        : "Pending"
                      }
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <div style={buttonGroupStyle}>
                      <button style={buttonStyle("primary")} onClick={() => navigate(`/user/${u.id}`)}>
                        View
                      </button>
                      <button style={buttonStyle("primary")} onClick={() => navigate(`/user/${u.id}/edit`)}>
                        Edit
                      </button>
                      <button style={buttonStyle("danger")} onClick={() => deleteUser(u.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </form>
  );
}

export default Users;