import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFileUrl } from "../utils/fileUrl";
import { apiRoutes } from "../config/api";


function UserDetails() {
  const { id } = useParams(); 
  const navigate = useNavigate(); 

  const [userInfo, setUserInfo] = useState({ name: "", email: "", mobile: "", pincode: "", status: "", created_at: "", profile_image: null });
  const [addresses, setAddresses] = useState([]);
  const [employments, setEmployments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = loggedInUser?.role === "admin";

  const isPdfFile = (url) => {
    if (!url) return false;
    return url.toLowerCase().split(/[?#]/)[0].endsWith('.pdf');
  };

  const statusMap = { 
    1: "Active", 
    0: "Inactive", 
    9: "Pending"
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(apiRoutes.userDetails(id));
        
        if (!res.ok) throw new Error("Failed to fetch user details");
        
        const result = await res.json();

        if (result?.data?.length > 0) {
          const rawRows = result.data;
          const [firstRow] = rawRows; 

          setUserInfo({
            name: firstRow?.name || "",
            email: firstRow?.email || "",
            mobile: firstRow?.mobile || "",
            pincode: firstRow?.pincode || "",
            status: firstRow?.user_status ?? "",
            created_at: firstRow?.created_at || "",
            profile_image: firstRow?.profile_image 
          });

          const uniqueAddresses = [];
          const addressSeen = new Set();

          rawRows.forEach((row) => { 
            const addrKey = row.address_id;
            if (row.address && !addressSeen.has(addrKey)) {
              addressSeen.add(addrKey);
              uniqueAddresses.push({
                address: row.address,
                landmark: row.landmark,
                pincode: row.pincode || row.Pincode,
                city_name: row.city_name || row.City,
                address_type: row.address_type,
                address_image: row.address_image || null,
                state_name: row.state_name || row.State_Name
              });
            }
          });

          setAddresses(uniqueAddresses);
          const employmentMap = new Map();

          rawRows.forEach((row) => {
            if (!row.employment_id || !row.company_name) return;

            if (!employmentMap.has(row.employment_id)) {
              employmentMap.set(row.employment_id, {
                employment_id: row.employment_id,
                company_name: row.company_name,
                company_address: row.company_address,
                company_pincode: row.company_pincode,
                company_mobile: row.company_mobile,
                company_email: row.company_email,
                employment_status: row.employment_status || "",
                salaries: [],
                salarySeen: new Set()
              });
            }

            const employment = employmentMap.get(row.employment_id);
            const salaryKey = row.salary_id;

            if (row.salary && !employment.salarySeen.has(salaryKey)) {
              employment.salarySeen.add(salaryKey);
              employment.salaries.push({
                salary_id: row.salary_id,
                salary: row.salary,
                start_date: row.start_date,
                end_date: row.end_date,
                salary_image: row.salary_image || null
              });
            }
          });

          const groupedEmployments = Array.from(employmentMap.values()).map(({ salarySeen, ...employment }) => employment);
          setEmployments(groupedEmployments);
        }
      } catch (err) {
        console.error("Fetch Details Error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchDetails();
  }, [id]);


  useEffect(() => {
    if (isAdmin) return;

    const fetchPendingEditStatus = async () => {
      try {
        const response = await fetch(apiRoutes.pendingEditStatus, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await response.json();

        if (response.ok) setHasPendingRequest(Boolean(data.hasPendingRequest));
      } catch (err) {
        console.error("Error checking pending update status:", err);
      }
    };

    fetchPendingEditStatus();
  }, [isAdmin]);

  // CSS Styles
  const containerStyle = { padding: "30px", maxWidth: "800px", margin: "0 auto", backgroundColor: "#f8f9fa", minHeight: "100vh" };
  const cardStyle = { backgroundColor: "white", borderRadius: "12px", marginBottom: "25px", padding: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontFamily: "Arial, sans-serif" };
  const sectionTitleStyle = { fontSize: "18px", fontWeight: "700", color: "#007bff", marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #007bff", textTransform: "uppercase" };
  const detailRowStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" };
  const detailItemStyle = { display: "flex", flexDirection: "column", marginBottom: "10px" };
  const labelStyle = { fontSize: "12px", fontWeight: "700", color: "#666", textTransform: "uppercase", marginBottom: "4px" };
  const valueStyle = { fontSize: "15px", color: "#333", fontWeight: "500" };
  const blockStyle = { background: "#fdfdfd", border: "1px solid #e0e0e0", padding: "15px", borderRadius: "8px", marginBottom: "15px" };
  const salaryBlockStyle = { marginTop: "10px", paddingTop: "10px", borderTop: "1px dashed #ddd" };

  const clickableImageStyle = { cursor: "pointer", transition: "transform 0.2s ease" };

  const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
  const modalContentStyle = { position: "relative", width: "80%", height: "85%", borderRadius: "8px", boxShadow: "0 5px 15px rgba(0,0,0,0.3)", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" };
  const closeButtonStyle = { position: "absolute", top: "10px", right: "10px", background: "white", border: "none", borderRadius: "50%", width: "40px", height: "40px", fontSize: "25px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.2)", zIndex: 1001 };

  const DetailField = ({ label, value }) => (
    <div style={detailItemStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value || "N/A"}</span>
    </div>
  );

  if (isLoading) return <div style={{ textAlign: "center", padding: "50px" }}>Loading user details...</div>;
  if (error) return <div style={{ textAlign: "center", padding: "50px", color: "red" }}>Error: {error}</div>;

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: "center", color: "#333", marginBottom: "30px" }}>User Profile Details</h2>
      

      {selectedFile && (
        <div style={modalOverlayStyle} onClick={() => setSelectedFile(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <button style={closeButtonStyle} onClick={() => setSelectedFile(null)}>×</button>
            
            {isPdfFile(selectedFile) ? (
              <iframe 
                src={selectedFile} 
                title="PDF Document" 
                width="100%" 
                height="100%" 
                style={{ border: "none" }}
              />
            ) : (
              <img 
                src={selectedFile} 
                alt="Large View" 
                style={{ maxWidth: "100%", maxHeight: "100%"}} 
              />
            )}
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <div style={detailRowStyle}>
          <DetailField 
            label="Created At" 
            value={userInfo.created_at ? new Date(userInfo.created_at).toLocaleString() : "N/A"} 
            
          />
          <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
       

        {hasPendingRequest && !isAdmin ? (
          <div
            role="status"
            style={{
              marginLeft: "auto",
              padding: "8px 12px",
              backgroundColor: "#fff3cd",
              color: "#856404",
              border: "1px solid #ffeeba",
              borderRadius: "6px",
              fontWeight: "600",
            }}
          >
            Approval Pending
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate(`/user/${id}/edit`)}
            style={{
              padding: "8px 18px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              marginLeft: "auto",
            }}
          >
            Edit
          </button>
        )}
      </div>
        </div>
        <h3 style={sectionTitleStyle}>Personal Information</h3>
        <div style={detailRowStyle}>
          <DetailField 
            label="Profile Image" 
            value={userInfo.profile_image ? (
              <img 
                src={getFileUrl(userInfo.profile_image)} 
                alt="Profile" 
                style={{ ...clickableImageStyle, width: "100px", height: "100px", borderRadius: "50%" }} 
                onClick={() => setSelectedFile(getFileUrl(userInfo.profile_image))}
              />
            ) : "N/A"} 
          />
          <DetailField label="Full Name" value={userInfo.name} />
          <DetailField label="Email Address" value={userInfo.email} />
          <DetailField label="Mobile Number" value={userInfo.mobile} />
          <DetailField label="Status" value={statusMap[userInfo.status] || "Pending"} />
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>Address Information</h3>
        {addresses.map((addr, index) => (
          <div key={index} style={blockStyle}>
            <strong style={{ color: "#007bff", display: "block", marginBottom: "10px" }}>
              Address {index + 1}
            </strong>
            <div style={detailRowStyle}>
              <DetailField label="Address" value={addr.address} />
              <DetailField label="Address Type" value={addr.address_type} />
              <DetailField label="Landmark" value={addr.landmark} />
              <DetailField label="Pincode" value={addr.pincode} />
              <DetailField label="City" value={addr.city_name} />  
              <DetailField label="State Name" value={addr.state_name} />
              
              <DetailField 
                label="Address Image / PDF" 
                value={addr.address_image ? (
                  isPdfFile(getFileUrl(addr.address_image)) ? (
                    <button 
                      onClick={() => setSelectedFile(getFileUrl(addr.address_image))}
                      style={{ padding: "8px 12px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                    >
                      View PDF Document
                    </button>
                  ) : (
                    <img 
                      src={getFileUrl(addr.address_image)} 
                      alt="Address" 
                      style={{ ...clickableImageStyle, width: "150px", height: "80px", borderRadius: "8px" }} 
                      onClick={() => setSelectedFile(getFileUrl(addr.address_image))}
                    />
                  )
                ) : "N/A"} 
              />
            </div>
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>Employment & Salary Details</h3>
        {employments.map((emp, index) => (
          <div key={emp.employment_id || index} style={blockStyle}>
            <strong style={{ color: "#28a745", display: "block", marginBottom: "10px" }}>
              Company {index + 1}
            </strong>
            <div style={detailRowStyle}>
              <DetailField label="Company Name" value={emp.company_name} />
              <DetailField label="Company Email" value={emp.company_email} />
              <DetailField label="Company Mobile" value={emp.company_mobile} />
              <DetailField label="Company Address" value={emp.company_address} />
              <DetailField label="Company Pincode" value={emp.company_pincode} />
              <DetailField label="Employee Status" value={statusMap[emp.employment_status] || "Pending"} />
            </div>

            {(emp.salaries || []).map((salaryRow, salaryIndex) => (
              <div key={salaryRow.salary_id || salaryIndex} style={{ ...detailRowStyle, ...salaryBlockStyle }}>
                <DetailField label={`Salary ${salaryIndex + 1}`} value={salaryRow.salary ? `Rs.${salaryRow.salary}` : "N/A"} />
                <DetailField label="Start Date" value={salaryRow.start_date ? new Date(salaryRow.start_date).toLocaleDateString() : "N/A"} />
                <DetailField label="End Date" value={salaryRow.end_date ? new Date(salaryRow.end_date).toLocaleDateString() : "N/A"} />
                
                <DetailField 
                  label="Salary PDF" 
                  value={salaryRow.salary_image ? (
                    <button 
                      onClick={() => setSelectedFile(getFileUrl(salaryRow.salary_image))}
                      style={{ padding: "8px 12px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                    >
                      View Salary PDF
                    </button>
                  ) : "N/A"} 
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserDetails;
