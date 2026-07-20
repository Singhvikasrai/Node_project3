import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000";

const parseJsonData = (val) => {
  if (!val) return {};
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch (err) {
    console.error("JSON parsing error", err);
    return {};
  }
};

const formatDateOnly = (value) => {
  if (!value) return "";
  return String(value).split("T")[0];
};

const valuesDiffer = (currentVal, pendingVal) =>
  String(currentVal ?? "") !== String(pendingVal ?? "");

const getFileUrl = (filePath) => {
  if (typeof filePath !== "string" || !filePath.trim()) return null;
  return filePath.startsWith("http")
    ? filePath
    : `${API_BASE_URL}/${filePath.replace(/^\/+/, "").replace(/\\/g, "/")}`;
};

const FilePreview = ({ value, label, onPreview }) => {
  const url = getFileUrl(value);
  if (!url) return <span style={{ color: "#aaa" }}>N/A</span>;

  if (url.toLowerCase().split("?")[0].endsWith(".pdf")) {
    return <a href={url} target="_blank" rel="noreferrer">View PDF</a>;
  }

  return (
    <button
      type="button"
      onClick={() => onPreview(url)}
      title="Click to view full image"
      style={{ border: "none", background: "none", padding: 0, cursor: "zoom-in" }}
    >
      <img src={url} alt={label} style={{ width: "72px", height: "56px", objectFit: "cover", border: "1px solid #ccc", borderRadius: "4px", display: "block" }} />
    </button>
  );
};

const formatStatus = (value) => {
  const labels = { 0: "Inactive", 1: "Active", 3: "Pending Approval", 9: "Pending" };
  return value === undefined || value === null || value === "" ? "N/A" : (labels[String(value)] || String(value));
};

// --- Helper Component: Field Comparison Dikhane Ke Liye ---
const CompareField = ({ label, currentVal, pendingVal, isFile = false, onPreview }) => {
  const cVal = currentVal || "";
  const pVal = pendingVal || "";
  const isChanged = valuesDiffer(cVal, pVal);

  // Pending request contains the complete form payload. Show only edited fields.
  if (!isChanged) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", padding: "8px 10px", borderBottom: "1px solid #eee", fontSize: "14px" }}>
      <div style={{ fontWeight: "bold", color: "#555" }}>{label}</div>
      
      {/* Current Data */}
      <div style={{ color: isChanged && cVal ? "#dc3545" : "#333", textDecoration: isChanged && cVal ? "non" : "none", overflow: "hidden", textOverflow: "ellipsis" }}>
        {isFile ? (
          <FilePreview value={cVal} label={`Current ${label}`} onPreview={onPreview} />
        ) : (
          cVal || <span style={{ color: "#aaa" }}>N/A</span>
        )}
      </div>

      {/* Pending Data */}
      <div style={{ color: isChanged ? "#28a745" : "#333", fontWeight: isChanged ? "bold" : "normal", overflow: "hidden", textOverflow: "ellipsis" }}>
        {isFile ? (
          <FilePreview value={pVal} label={`Pending ${label}`} onPreview={onPreview} />
        ) : (
          pVal || <span style={{ color: "#aaa" }}>N/A</span>
        )}
        {isChanged && pVal && <span style={{ marginLeft: "6px" }}></span>}
      </div>
    </div>
  );
};

function PendingApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentDbData, setCurrentDbData] = useState(null);
  const [fetchingCurrentData, setFetchingCurrentData] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filePreview, setFilePreview] = useState(null);

  const navigate = useNavigate();

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/pending`, { headers: authHeaders() });

      if (res.status === 401) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      const result = await res.json();
      if (res.ok) {
        setRequests(result.data || []);
      } else {
        setMessage({ type: "error", text: result.message || "Failed to load requests" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Error loading pending requests" });
    } finally {
      setLoading(false);
    }
  }, [authHeaders, navigate]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

 
  const handleReviewClick = async (req) => {
    setSelectedRequest(req);
    setCurrentDbData(null); 

    if (req.created_by) {
      try {
        setFetchingCurrentData(true);
        // Using the same API from UserDetails
        const res = await fetch(`${API_BASE_URL}/address/${req.created_by}`, {
          headers: authHeaders() 
        });
        
        if (!res.ok) throw new Error("Failed to fetch user details");
        
        const result = await res.json();

        if (result?.data?.length > 0) {
          const rawRows = result.data;
          const [firstRow] = rawRows; 

          // Structure the data to match pendingJSON format
          const formattedCurrentData = {
            user: {
              name: firstRow?.name || "",
              email: firstRow?.email || "",
              mobile: firstRow?.mobile || "",
              pincode: firstRow?.pincode || "",
              status: firstRow?.user_status ?? "",
              profile_image: firstRow?.profile_image 
            },
            addresses: [],
            employments: []
          };

          // 1. Parse Addresses
          const addressSeen = new Set();
          rawRows.forEach((row) => { 
            const addrKey = row.address_id;
            if (row.address && !addressSeen.has(addrKey)) {
              addressSeen.add(addrKey);
              formattedCurrentData.addresses.push({
                id: addrKey,
                address: row.address,
                landmark: row.landmark,
                pincode: row.pincode || row.Pincode,
                city_name: row.city_name || row.City,
                address_type: row.address_type,
                address_status: row.address_status ?? "",
                address_image: row.address_image || null,
                state_name: row.state_name || row.State_Name
              });
            }
          });

          // 2. Parse Employments and Salaries
          const employmentMap = new Map();
          rawRows.forEach((row) => {
            if (!row.employment_id || !row.company_name) return;

            if (!employmentMap.has(row.employment_id)) {
              employmentMap.set(row.employment_id, {
                id: row.employment_id, // Important: mapped to 'id' for comparison
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
                id: salaryKey, // Important: mapped to 'id' for comparison
                salary: row.salary,
                start_date: row.start_date,
                end_date: row.end_date,
                salary_status: row.salary_status ?? "",
                salary_image: row.salary_image || null
              });
            }
          });

          // Remove the temporary 'salarySeen' Set
          formattedCurrentData.employments = Array.from(employmentMap.values()).map(
            ({ salarySeen, ...employment }) => employment
          );

          setCurrentDbData(formattedCurrentData);
        } else {
          setCurrentDbData({});
        }
      } catch (err) {
        console.error("Error fetching current DB data", err);
        setCurrentDbData({});
      } finally {
        setFetchingCurrentData(false);
      }
    }
  };

  const handleApprove = async (id) => {
    try {
      setProcessing(true);
      setMessage({ type: "", text: "" });
      const res = await fetch(`${API_BASE_URL}/pending/${id}/approve`, {
        method: "PUT",
        headers: authHeaders()
      });
      const result = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Request approved successfully!" });
        setSelectedRequest(null);
        fetchPendingRequests();
      } else {
        setMessage({ type: "error", text: result.message || "Failed to approve request" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Server error occurred during approval" });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setProcessing(true);
      setMessage({ type: "", text: "" });
      const res = await fetch(`${API_BASE_URL}/pending/${id}/reject`, {
        method: "PUT",
        headers: authHeaders()
      });
      const result = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Request rejected successfully!" });
        setSelectedRequest(null);
        fetchPendingRequests();
      } else {
        setMessage({ type: "error", text: result.message || "Failed to reject request" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Server error occurred during rejection" });
    } finally {
      setProcessing(false);
    }
  };

  const containerStyle = { maxWidth: "1200px", margin: "30px auto", padding: "20px", fontFamily: "Arial, sans-serif" };
  const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
  const tableStyle = { width: "100%", borderCollapse: "collapse", backgroundColor: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" };
  const thStyle = { padding: "14px 12px", backgroundColor: "#007bff", color: "white", textAlign: "left", fontWeight: "bold" };
  const tdStyle = { padding: "12px", borderBottom: "1px solid #eee", color: "#333" };
  const badgeStyle = (type) => ({ padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", backgroundColor: type === "Register" ? "#e6f4ea" : "#e8f0fe", color: type === "Register" ? "#137333" : "#1a73e8" });

  const modalBgStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(4px)" };
  const modalContentStyle = { backgroundColor: "white", padding: "25px", borderRadius: "12px", width: "95%", maxWidth: "1000px", maxHeight: "90vh", overflowY: "auto", position: "relative", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };
  const closeBtnStyle = { position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#aaa" };
  const sectionTitleStyle = { fontSize: "16px", fontWeight: "bold", color: "#0066cc", borderBottom: "2px solid #eee", paddingBottom: "6px", marginTop: "20px", marginBottom: "12px" };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>Admin Pending Approvals</h2>
        <button onClick={fetchPendingRequests} style={{ padding: "8px 16px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {message.text && (
        <div style={{ padding: "15px", marginBottom: "20px", borderRadius: "4px", backgroundColor: message.type === "success" ? "#d4edda" : "#f8d7da", color: message.type === "success" ? "#155724" : "#721c24", border: "1px solid" }}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", fontSize: "18px" }}>Loading pending requests...</p>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <p style={{ color: "#666", fontSize: "16px" }}>No pending approval requests found.</p>
        </div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Details</th>
              <th style={thStyle}>Requested By</th>
              <th style={thStyle}>Date & Time</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => {
              const parsedData = parseJsonData(req.data);
              const isRegister = !req.created_by;
              return (
                <tr key={req.id}>
                  <td style={tdStyle}><strong>{req.id}</strong></td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(isRegister ? "Register" : "Profile Update")}>
                      {isRegister ? "Registration" : "Profile Edit"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div>{parsedData.user?.name || "Unknown"}</div>
                    <small style={{ color: "#777" }}>{parsedData.user?.email}</small>
                  </td>
                  <td style={tdStyle}>
                    {isRegister ? "New Guest" : `User ID: ${req.created_by}`}
                  </td>
                  <td style={tdStyle}>
                    {new Date(req.created_at).toLocaleString("en-GB")}
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleReviewClick(req)}
                      style={{ padding: "6px 12px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* DETAIL DIALOG / MODAL (Current vs Pending Comparison) */}
      {selectedRequest && (() => {
        const pendingReqData = parseJsonData(selectedRequest.data);
        const currentData = currentDbData || {}; 
        const hasPersonalChanges = [
          [currentData.user?.name, pendingReqData.user?.name],
          [currentData.user?.email, pendingReqData.user?.email],
          [currentData.user?.mobile, pendingReqData.user?.mobile],
          [currentData.user?.pincode, pendingReqData.user?.pincode],
          [currentData.user?.status, pendingReqData.user?.status],
          [currentData.user?.profile_image, pendingReqData.user?.profile_image]
        ].some(([currentVal, pendingVal]) => valuesDiffer(currentVal, pendingVal));

        const changedAddresses = (pendingReqData.addresses || []).map((pendingAddr) => {
          const currentAddr = currentData.addresses?.find(
            (address) => String(address.id) === String(pendingAddr.address_id)
          ) || {};
          const hasChanges = pendingAddr.address_status === "9" || [
            [currentAddr.address, pendingAddr.address],
            [currentAddr.address_type, pendingAddr.address_type],
            [currentAddr.landmark, pendingAddr.landmark],
            [currentAddr.city_name, pendingAddr.city_name || pendingAddr.city_id],
            [currentAddr.address_status, pendingAddr.address_status],
            [currentAddr.address_image, pendingAddr.address_image]
          ].some(([currentVal, pendingVal]) => valuesDiffer(currentVal, pendingVal));
          return { pendingAddr, currentAddr, hasChanges };
        }).filter(({ hasChanges }) => hasChanges);

        const changedEmployments = (pendingReqData.employments || []).map((pendingEmp) => {
          const currentEmp = currentData.employments?.find(
            (employment) => String(employment.id) === String(pendingEmp.employment_id)
          ) || {};
          const changedSalaries = (pendingEmp.salaries || []).map((pendingSal) => {
            const currentSal = currentEmp.salaries?.find(
              (salary) => String(salary.id) === String(pendingSal.salary_id)
            ) || {};
            const hasChanges = [
              [currentSal.salary, pendingSal.salary],
              [formatDateOnly(currentSal.start_date), formatDateOnly(pendingSal.start_date)],
              [formatDateOnly(currentSal.end_date), formatDateOnly(pendingSal.end_date)],
              [currentSal.salary_status, pendingSal.salary_status],
              [currentSal.salary_image, pendingSal.salary_image]
            ].some(([currentVal, pendingVal]) => valuesDiffer(currentVal, pendingVal));
            return { pendingSal, currentSal, hasChanges };
          }).filter(({ hasChanges }) => hasChanges);
          const hasChanges = pendingEmp.employment_status === "9" || changedSalaries.length > 0 || [
             [currentEmp.company_name, pendingEmp.company_name],
            [currentEmp.company_address, pendingEmp.company_address],
            [currentEmp.company_email, pendingEmp.company_email],
            [currentEmp.company_mobile, pendingEmp.company_mobile],
            [currentEmp.company_pincode || currentEmp.pincode, pendingEmp.company_pincode || pendingEmp.pincode]
            ,
          ].some(([currentVal, pendingVal]) => valuesDiffer(currentVal, pendingVal));
          return { pendingEmp, currentEmp, changedSalaries, hasChanges };
        }).filter(({ hasChanges }) => hasChanges);

        return (
          <div style={modalBgStyle}>
            <div style={modalContentStyle}>
              <button style={closeBtnStyle} onClick={() => setSelectedRequest(null)}>&times;</button>
              
              <h3 style={{ margin: "0 0 10px 0" }}>Pending Approval</h3>
              
              {fetchingCurrentData ? (
                <p>Loading current data for comparison...</p>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", backgroundColor: "#f4f4f4", padding: "12px", fontWeight: "bold", borderRadius: "6px", marginTop: "20px" }}>
                    <div>Field Name</div>
                    <div>Current Data</div>
                    <div>Pending Data</div>
                  </div>

                  {/* Personal Info Section */}
                  {hasPersonalChanges && <>
                  <div style={sectionTitleStyle}>Personal Information</div>
                  <div style={{ border: "1px solid #ddd", borderRadius: "6px" }}>
                    <CompareField label="Full Name" currentVal={currentData.user?.name} pendingVal={pendingReqData.user?.name} />
                    <CompareField label="Email Address" currentVal={currentData.user?.email} pendingVal={pendingReqData.user?.email} />
                    <CompareField label="Mobile Number" currentVal={currentData.user?.mobile} pendingVal={pendingReqData.user?.mobile} />
                    <CompareField label="Pincode" currentVal={currentData.user?.pincode} pendingVal={pendingReqData.user?.pincode} />
                   
                    
                    <CompareField label="Profile Image" currentVal={currentData.user?.profile_image} pendingVal={pendingReqData.user?.profile_image} isFile={true} onPreview={setFilePreview} />

                  </div>
                  </>}

                  {/* Location Info Section */}
                  {changedAddresses.length > 0 && <>
                  <div style={sectionTitleStyle}>Addresses</div>
                  {changedAddresses.map(({ pendingAddr, currentAddr }, idx) => {
                    return (
                      <div key={idx} style={{ border: "1px solid #ddd", borderRadius: "6px", marginBottom: "10px" }}>
                        <div style={{ backgroundColor: "#f9f9f9", padding: "8px", fontWeight: "bold", borderBottom: "1px solid #ddd" }}>
                          Address {idx + 1} {pendingAddr.address_status === "9" && <span style={{ color: "red" }}>(Requested to Delete)</span>}
                        </div>
                        <CompareField label="Address" currentVal={currentAddr.address} pendingVal={pendingAddr.address} />
                        <CompareField label="Address Type" currentVal={currentAddr.address_type} pendingVal={pendingAddr.address_type} />
                        <CompareField label="Landmark" currentVal={currentAddr.landmark} pendingVal={pendingAddr.landmark} />
                        <CompareField label="City" currentVal={currentAddr.city_name} pendingVal={pendingAddr.city_name || pendingAddr.city_id} />
                        <CompareField label="Address Status" currentVal={formatStatus(currentAddr.address_status)} pendingVal={formatStatus(pendingAddr.address_status)} />
                        <CompareField label="Document File" currentVal={currentAddr.address_image} pendingVal={pendingAddr.address_image} isFile={true} onPreview={setFilePreview} />
                      </div>
                    );
                  })}
                  </>}

                  {/* Employment Section */}
                  {changedEmployments.length > 0 && <>
                  <div style={sectionTitleStyle}>Employment & Salaries</div>
                  {changedEmployments.map(({ pendingEmp, currentEmp, changedSalaries }, idx) => {
                    return (
                      <div key={idx} style={{ border: "1px solid #ddd", borderRadius: "6px", marginBottom: "15px" }}>
                        <div style={{ backgroundColor: "#e9ecef", padding: "8px", fontWeight: "bold", borderBottom: "1px solid #ddd" }}>
                          Company: {pendingEmp.company_name} 
                        </div>
                        <CompareField label="Company Name" currentVal={currentEmp.company_name} pendingVal={pendingEmp.company_name} />
                        <CompareField label="Company Address" currentVal={currentEmp.company_address} pendingVal={pendingEmp.company_address} />
                        <CompareField label="Company Email" currentVal={currentEmp.company_email} pendingVal={pendingEmp.company_email} />
                        <CompareField label="Company Mobile" currentVal={currentEmp.company_mobile} pendingVal={pendingEmp.company_mobile} />
                        <CompareField label="Company Pincode" currentVal={currentEmp.company_pincode || currentEmp.pincode} pendingVal={pendingEmp.company_pincode || pendingEmp.pincode} />
                        
                        
                        {/* Nested Salaries */}
                        {changedSalaries.length > 0 && (
                           <div style={{ padding: "10px" }}>
                             <strong style={{ fontSize: "13px", color: "#555" }}>Salaries:</strong>
                             {changedSalaries.map(({ pendingSal, currentSal }, sIdx) => {
                                return (
                                  <div key={sIdx} style={{ border: "1px dashed #ccc", padding: "5px", margin: "5px 0", borderRadius: "4px" }}>
                                     <CompareField label="Amount" currentVal={currentSal.salary ? `₹${currentSal.salary}` : null} pendingVal={pendingSal.salary ? `₹${pendingSal.salary}` : null} />
                                     <CompareField
                                       label="Dates"
                                       currentVal={currentSal.start_date ? `${formatDateOnly(currentSal.start_date)} to ${formatDateOnly(currentSal.end_date)}` : null}
                                       pendingVal={pendingSal.start_date ? `${formatDateOnly(pendingSal.start_date)} to ${formatDateOnly(pendingSal.end_date)}` : null}
                                     />
                                     <CompareField label="Salary Status" currentVal={formatStatus(currentSal.salary_status)} pendingVal={formatStatus(pendingSal.salary_status)} />
                                     <CompareField label="Salary Proof" currentVal={currentSal.salary_image} pendingVal={pendingSal.salary_image} isFile={true} onPreview={setFilePreview} />
                                  </div>
                                )
                             })}
                           </div>
                        )}
                      </div>
                    );
                  })}
                  </>}

                  {!hasPersonalChanges && changedAddresses.length === 0 && changedEmployments.length === 0 && (
                    <p style={{ color: "#777" }}>No field changes found in this request.</p>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "15px", marginTop: "30px", borderTop: "1px solid #ddd", paddingTop: "20px" }}>
                    <button onClick={() => setSelectedRequest(null)} style={{ flex: 1, padding: "12px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }} disabled={processing}>Cancel</button>
                    <button onClick={() => handleReject(selectedRequest.id)} style={{ flex: 1, padding: "12px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }} disabled={processing}>{processing ? "Processing..." : "Reject"}</button>
                    <button onClick={() => handleApprove(selectedRequest.id)} style={{ flex: 1, padding: "12px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }} disabled={processing}>{processing ? "Processing..." : "Approve & Save"}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {filePreview && (
        <div
          onClick={() => setFilePreview(null)}
          style={{ ...modalBgStyle, zIndex: 1100, backgroundColor: "rgba(0,0,0,0.82)" }}
        >
          <div onClick={(event) => event.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <button
              type="button"
              onClick={() => setFilePreview(null)}
              aria-label="Close image preview"
              style={{ position: "absolute", top: "-12px", right: "-12px", width: "32px", height: "32px", borderRadius: "50%", border: "none", background: "white", fontSize: "22px", cursor: "pointer", zIndex: 1 }}
            >
              &times;
            </button>
            <img src={filePreview} alt="Full size preview" style={{ display: "block", maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "6px" }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingApprovals;
