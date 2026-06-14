import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function UserDetails() {
  const { id } = useParams();

  const statusMap = { 
    1: "Active", 
    0: "Inactive", 
    9: "Pending" 
  };

  const [userInfo, setUserInfo] = useState({ name: "", email: "", mobile: "", pincode: "", status: "", created_at: "" });
  const [addresses, setAddresses] = useState([]);
  const [employments, setEmployments] = useState([]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`http://localhost:5000/address/${id}`);
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
            created_at: firstRow?.created_at || ""
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
                pincode: row.pincode || row.Pincode, // Extracted specifically for the address block
                city_name: row.city_name || row.City,
                address_type: row.address_type,
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
                end_date: row.end_date
              });
            }
          });

          const groupedEmployments = Array.from(employmentMap.values()).map(({ salarySeen, ...employment }) => employment);
          setEmployments(groupedEmployments);
        }
      } catch (err) {
        console.error("Fetch Details Error:", err);
      }
    };

    if (id) fetchDetails();
  }, [id]);

  // Styling Declarations
  const containerStyle = { padding: "30px", maxWidth: "800px", margin: "0 auto", backgroundColor: "#f8f9fa", minHeight: "100vh" };
  const cardStyle = { backgroundColor: "white", borderRadius: "12px", marginBottom: "25px", padding: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontFamily: "Arial, sans-serif" };
  const sectionTitleStyle = { fontSize: "18px", fontWeight: "700", color: "#007bff", marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #007bff", textTransform: "uppercase" };
  const detailRowStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" };
  const detailItemStyle = { display: "flex", flexDirection: "column", marginBottom: "10px" };
  const labelStyle = { fontSize: "12px", fontWeight: "700", color: "#666", textTransform: "uppercase", marginBottom: "4px" };
  const valueStyle = { fontSize: "15px", color: "#333", fontWeight: "500" };
  const blockStyle = { background: "#fdfdfd", border: "1px solid #e0e0e0", padding: "15px", borderRadius: "8px", marginBottom: "15px" };
  const salaryBlockStyle = { marginTop: "10px", paddingTop: "10px", borderTop: "1px dashed #ddd" };

  const DetailField = ({ label, value }) => (
    <div style={detailItemStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value || "N/A"}</span>
    </div>
  );

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: "center", color: "#333", marginBottom: "30px" }}>User Profile Details</h2>

      <div style={cardStyle}>
        <div style={detailRowStyle}>
          {/* Handled safe Date Conversion to avoid rendering "Invalid Date" */}
          <DetailField 
            label="Created At" 
            value={userInfo.created_at ? new Date(userInfo.created_at).toLocaleString() : "N/A"} 
          />
        </div>
        <h3 style={sectionTitleStyle}>Personal Information</h3>
        <div style={detailRowStyle}>
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
              {/* FIXED: Displaying the address-specific pincode instead of userInfo.pincode */}
              <DetailField label="Pincode" value={addr.pincode} />
              <DetailField label="City" value={addr.city_name} />  
              <DetailField label="State Name" value={addr.state_name} />
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
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserDetails;