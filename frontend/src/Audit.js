import { useEffect, useState } from "react";

export default function Audit() {
  const [users, setUsers] = useState([]); 

  const parseAuditData = (data) => {
    if (!data) return {};
    if (typeof data !== "string") return data;

    try {
      return JSON.parse(data);
    } catch (err) {
      console.error("Invalid audit JSON:", err);
      return {};
    }
  };

  useEffect(() => {
    fetch("http://localhost:5000/audit")
      .then((res) => res.json())
      .then((data) => {
    
        const fetchedData = data.data || data;
        
       
        if (Array.isArray(fetchedData)) {
          setUsers(fetchedData);
        } else {
          console.error("API se array nahi mila:", fetchedData);
          setUsers([]); 
        }
      })
      .catch((err) => {
        console.error("Error fetching audit data:", err);
        setUsers([]);
      });
  }, []);

  return (
    <div style={{ padding: "10px", fontFamily: "sans-serif" }}>
      <h2>User Audit Log</h2>
      
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", textAlign: "left" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th>Date & Time</th>
            <th>User_Name</th>
            <th>Mobile</th>
            <th>Address</th>
            <th>City</th>
            <th>Pincode</th>
          </tr>
        </thead>
        <tbody>
         
          {Array.isArray(users) && users.length > 0 ? (
            users.map((u, index) => {
              const auditData = parseAuditData(u.data);

              return (
                <tr key={`audit-${u.id || index}`}>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleString() : "N/A"}</td>
                  <td>{auditData.name || "N/A"}</td>
                  <td>{auditData.mobile || "N/A"}</td>
                  <td>{auditData.address || "N/A"}</td>
                  <td>{auditData.city || auditData.city_id || "N/A"}</td>
                  <td>{auditData.pincode || "N/A"}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>No records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
