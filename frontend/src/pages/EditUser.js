import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFileUrl } from "../utils/fileUrl";
import { apiRoutes } from "../config/api";


const emptyUser = {
  name: "",
  email: "",
  mobile: "",
  pincode: "",
  user_status: "9",
  profile_image: null,
};

const formatToLocalDate = (dateString) => {
  if (!dateString) return "";
  return String(dateString).split("T")[0];
};

function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const loggedInUser = JSON.parse(localStorage.getItem("user"));
const isAdmin = loggedInUser?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [user, setUser] = useState(emptyUser);
  const [addresses, setAddresses] = useState([]);
  const [employments, setEmployments] = useState([]);
  const [states, setStates] = useState([]);
  const [citiesByState, setCitiesByState] = useState({});

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchCities = useCallback(async (stateId) => {
    if (!stateId) return;
    try {
      const res = await fetch(apiRoutes.cities(stateId));
      const data = await res.json();
      setCitiesByState((prev) => ({
        ...prev,
        [stateId]: data.data || []
      }));
    } catch (err) {
      console.error("Error fetching cities:", err);
    }
  }, []);

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const [detailRes, stateRes] = await Promise.all([
        fetch(apiRoutes.userDetails(id), { headers: authHeaders() }),
        fetch(apiRoutes.states)
      ]);

      if (!detailRes.ok) {
        setMessage({ type: "error", text: "Failed to load user details" });
        return;
      }

      const detailData = await detailRes.json();
      const stateData = stateRes.ok ? await stateRes.json() : { data: [] };
      const rows = detailData.data || [];
      setStates(stateData.data || []);

      if (rows.length === 0) return;

      const firstRow = rows[0];
      setUser({
        name: firstRow.name || "",
        email: firstRow.email || "",
        mobile: firstRow.mobile || "",
        pincode: firstRow.pincode || "",
        profile_image: firstRow.profile_image || "",
        user_status: firstRow.user_status !== undefined && firstRow.user_status !== null ? String(firstRow.user_status) : ""
      });

      const uniqueAddresses = [];
      const addressSeen = new Set();

      rows.forEach((row) => {
        if (!row.address_id || addressSeen.has(row.address_id)) return;
        addressSeen.add(row.address_id); 
        uniqueAddresses.push({
          address_id: row?.address_id,
          address_type: row?.address_type || "",
          address: row?.address || "",
          landmark: row?.landmark || "",
          state_id: row?.state_id || "",
          state_name: row?.state_name || "",
          city_id: row?.city_id || "",
          city_name: row?.city_name || "",
          address_status: row?.address_status !== undefined ? String(row.address_status) : "",
          address_image: row?.address_image || ""
        });
      });

      const employmentMap = new Map();

      rows.forEach((row) => {
        if (!row.employment_id) return;

        if (!employmentMap.has(row.employment_id)) {
          employmentMap.set(row.employment_id, {
            employment_id: row.employment_id,
            company_name: row.company_name || "",
            company_address: row.company_address || "",
            company_pincode: row.company_pincode || "",
            company_mobile: row.company_mobile || "",
            company_email: row.company_email || "",
            employment_status: row.employment_status !== undefined ? String(row.employment_status) : " ",
            salaries: [],
            salarySeen: new Set()
          });
        }

        const employment = employmentMap.get(row.employment_id);
        const salaryKey = row.salary_id || `${row.salary}-${row.start_date}-${row.end_date}`;
        if (row.salary_id && !employment.salarySeen.has(salaryKey)) {
          employment.salarySeen.add(salaryKey);
          
          employment.salaries.push({
            salary_id: row.salary_id,
            salary: row.salary || "",
            start_date: formatToLocalDate(row.start_date),
            end_date: formatToLocalDate(row.end_date),
            salary_status: row.salary_status !== undefined ? String(row.salary_status) : " ",
            salary_image: row.salary_image || ""
          });
        }
      });

      const uniqueEmployments = Array.from(employmentMap.values()).map(({ salarySeen, ...employment }) => employment);

      setAddresses(uniqueAddresses);
      setEmployments(uniqueEmployments);

      const stateIds = [...new Set(uniqueAddresses.map((addr) => addr.state_id).filter(Boolean))];
      await Promise.all(stateIds.map((stateId) => fetchCities(stateId)));
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Error loading user details" });
    } finally {
      setLoading(false);
    }
  }, [id, fetchCities]);

  const fetchPendingEditStatus = useCallback(async () => {
    if (isAdmin) return;

    try {
      const response = await fetch(apiRoutes.pendingEditStatus, {
        headers: authHeaders()
      });
      const data = await response.json();

      if (response.ok) {
        setHasPendingRequest(Boolean(data.hasPendingRequest));
      }
    } catch (err) {
      console.error("Error checking pending update status:", err);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (id) {
      fetchUserDetails();
      fetchPendingEditStatus();
    }
  }, [id, fetchUserDetails, fetchPendingEditStatus]);

  const handleUserChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleProfileImageChange = (e) => {
    setUser({ ...user, profile_image: e.target.files[0] });
  };

  const addAddressBlock = () => {
    setAddresses([...addresses, { isNew: true, address_type: "Home", address: "", landmark: "", state_id: "", city_id: "", address_status: "1", address_image: null }]);
  };

  const removeAddressBlock = (index) => {
    const updated = [...addresses];
    if (updated[index].address_id) {
      updated[index].address_status = "9"; 
    } else {
      updated.splice(index, 1); 
    }
    setAddresses(updated);
  };

  const addCompanyBlock = () => {
    setEmployments([...employments, { isNew: true, company_name: "", company_address: "", company_pincode: "", company_mobile: "", company_email: "", employment_status: "1", salaries: [{ isNew: true, salary: "", start_date: "", end_date: "", salary_status: " ", salary_image: null }] }]);
  };

  const removeCompanyBlock = (index) => {
    const updated = [...employments];
    if (updated[index].employment_id) {
      updated[index].employment_status = "9";
    } else {
      updated.splice(index, 1);
    }
    setEmployments(updated);
  };

  const addSalaryBlock = (empIndex) => {
    const updated = [...employments];
    updated[empIndex].salaries = [...updated[empIndex].salaries, { isNew: true, salary: "", start_date: "", end_date: "", salary_status: " ", salary_image: null }];
    setEmployments(updated);
  };

  const removeSalaryBlock = (empIndex, salIndex) => {
    const updated = [...employments];
    const salary = updated[empIndex].salaries[salIndex];
    if (salary.salary_id) {
      salary.salary_status = "9"; 
    } else {
      updated[empIndex].salaries.splice(salIndex, 1);
    }
    setEmployments(updated);
  };

  const handleAddressChange = async (index, field, value) => {
    const nextAddresses = addresses.map((address, addressIndex) => {
      if (addressIndex !== index) return address;

      if (field === "state_id") {
        const selectedState = states.find((state) => String(state.id) === String(value));
        return {
          ...address,
          state_id: value,
          state_name: selectedState?.state_name || "",
          city_id: "",
          city_name: ""
        };
      }

      if (field === "city_id") {
        const cityList = citiesByState[address.state_id] || [];
        const selectedCity = cityList.find((city) => String(city.id) === String(value));
        return {
          ...address,
          city_id: value,
          city_name: selectedCity?.city_name || ""
        };
      }

      return { ...address, [field]: value };
    });

    setAddresses(nextAddresses);

    if (field === "state_id" && value) {
      await fetchCities(value);
    }
  };

  const handleEmploymentChange = (index, field, value) => {
    setEmployments((prev) =>
      prev.map((employment, employmentIndex) =>
        employmentIndex === index ? { ...employment, [field]: value } : employment
      )
    );
  };

  const handleSalaryChange = (employmentIndex, salaryIndex, field, value) => {
    setEmployments((prev) =>
      prev.map((employment, currentEmploymentIndex) => {
        if (currentEmploymentIndex !== employmentIndex) return employment;

        return {
          ...employment,
          salaries: employment.salaries.map((salary, currentSalaryIndex) =>
            currentSalaryIndex === salaryIndex ? { ...salary, [field]: value } : salary
          )
        };
      })
    );
  };

 
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasPendingRequest) {
      setMessage({ type: "error", text: "Your previous update request is still pending admin approval." });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ type: "", text: "" });

      const token = localStorage.getItem("token");
      const formData = new FormData();

      // 1. Append user_id to main body
      formData.append("user_id", id);

      // 2. Map structure for JSON metadata
      const textData = {
        user: {
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          pincode: user.pincode,
          status: isAdmin ? user.user_status : "9",
         
          profile_image: typeof user.profile_image === "string" ? user.profile_image : ""
        },
        addresses: addresses.map((addr, idx) => ({
          ...addr,
          
         
          address_image: typeof addr.address_image === "string" ? addr.address_image : ""
        })),
        employments: employments.map((emp, empIdx) => ({
          ...emp,
          salaries: (emp.salaries || []).map((sal, salIdx) => ({
            ...sal,
            
            salary_image: typeof sal.salary_image === "string" ? sal.salary_image : ""
          }))
        }))
      };

      
      formData.append("data", JSON.stringify(textData));

     
      if (user.profile_image instanceof File) {
        formData.append("profile_image", user.profile_image);
      }

      addresses.forEach((addr, idx) => {
        if (addr.address_image instanceof File) {
          formData.append(`address_image_${idx}`, addr.address_image);
        }
      });

      employments.forEach((emp, empIdx) => {
        (emp.salaries || []).forEach((sal, salIdx) => {
          if (sal.salary_image instanceof File) {
            formData.append(`salary_image_${empIdx}_${salIdx}`, sal.salary_image);
          }
        });
      });

      
      const response = await fetch(apiRoutes.pending, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit pending update request!");
      }

      const result = await response.json();
      setMessage({ type: "success", text: result.message || "Changes submitted for admin approval" });
      setHasPendingRequest(true);
      setTimeout(() => navigate("/users"), 1500);

    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "An error occurred while updating" });
    } finally {
      setSubmitting(false);
    }
  };
  // ----------------------------------------------------------------------

  const containerStyle = { maxWidth: "980px", margin: "30px auto", padding: "40px", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", backgroundColor: "#f9f9f9", fontFamily: "Arial, sans-serif" };
  const titleStyle = { textAlign: "center", color: "#333", marginBottom: "10px", fontSize: "32px", fontWeight: "700" };
  const subtitleStyle = { textAlign: "center", color: "#666", marginBottom: "30px", fontSize: "14px" };
  const sectionStyle = { marginBottom: "30px", paddingBottom: "20px", borderBottom: "2px solid #e0e0e0" };
  const sectionTitleStyle = { fontSize: "18px", fontWeight: "700", color: "#0066cc", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" };
  const blockStyle = { backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "6px", padding: "18px", marginBottom: "18px", position: "relative" };
  const blockTitleStyle = { color: "#333", fontWeight: "700", marginBottom: "14px", display: "flex", justifyContent: "space-between" };
  const fieldRowStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "15px" };
  const fieldGroupStyle = { display: "flex", flexDirection: "column", marginBottom: "15px" };
  const labelStyle = { marginBottom: "6px", color: "#333", fontWeight: "600", fontSize: "13px" };
  const inputStyle = { padding: "11px", border: "1px solid #bbb", borderRadius: "4px", fontSize: "14px", fontFamily: "Arial, sans-serif" };
  const buttonStyle = { padding: "14px 40px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "700", cursor: submitting ? "not-allowed" : "pointer", marginTop: "20px", opacity: submitting ? 0.7 : 1, width: "100%" };
  const cancelButtonStyle = { padding: "14px 40px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "700", cursor: submitting ? "not-allowed" : "pointer", marginTop: "20px", width: "100%", opacity: submitting ? 0.7 : 1 };
  const addBtnStyle = { background: "#a8ada9", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" };
  const removeBtnStyle = { background: "#dc3545", color: "white", border: "none", padding: "4px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
  const messageStyle = { padding: "15px", marginBottom: "20px", borderRadius: "4px", fontSize: "14px", fontWeight: "600", textAlign: "center", ...(message.type === "success" && { backgroundColor: "#d4edda", color: "#155724", border: "1px solid #c3e6cb" }), ...(message.type === "error" && { backgroundColor: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb" }) };
  const topBackBtnStyle = { background: "#6c757d", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", marginBottom: "20px", outline: "none" };
  
  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "40px", fontSize: "18px" }}>Loading user details...</div>
      </div>
    );
  }

  const visibleAddressesCount = addresses.filter(addr => addr.address_status !== "9").length;

  return (
    <div style={containerStyle}>
      <button type="button" onClick={() => navigate("/users")} style={topBackBtnStyle}>
        ←
      </button>

      <h1 style={titleStyle}>Edit User Details</h1>
      <p style={subtitleStyle}>Update personal, address, employment, and salary information</p>

      {message.text && <div style={messageStyle}>{message.text}</div>}

      {hasPendingRequest && !isAdmin && (
        <div style={{ ...messageStyle, backgroundColor: "#fff3cd", color: "#856404", border: "1px solid #ffeeba" }}>
          Your previous update request is pending admin approval. Editing will be available after approval or rejection.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={hasPendingRequest && !isAdmin}
          style={{ border: "none", padding: 0, margin: 0, minWidth: 0 }}
        >
      
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Personal Information</div>
          <div style={fieldRowStyle}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Full Name</label>
              <input name="name" value={user.name} onChange={handleUserChange} style={inputStyle} disabled={submitting} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Email Address</label>
              <input name="email" type="email" value={user.email} onChange={handleUserChange} style={inputStyle} disabled={submitting} />
            </div>
          </div>
          <div style={fieldRowStyle}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Mobile Number</label>
              <input name="mobile" value={user.mobile} onChange={handleUserChange} style={inputStyle} disabled={submitting} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Pincode</label>
              <input name="pincode" value={user.pincode} onChange={handleUserChange} style={inputStyle} disabled={submitting} />
            </div>
          </div>
          <div style={fieldRowStyle}>
           {isAdmin && (
  <div style={fieldGroupStyle}>
    <label style={labelStyle}>User Status</label>
    <select
      name="user_status"
      value={user.user_status}
      onChange={handleUserChange}
      style={inputStyle}
      disabled={submitting}
    >
      <option value="1">Active</option>
      <option value="0">Inactive</option>
      <option value="9">Pending</option>
      <option value="3">Pending Approval</option>
    </select>
  </div>
)}
        
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Profile Image</label>
              <input type="file" accept="image/*" onChange={handleProfileImageChange} style={inputStyle} disabled={submitting} />
              {typeof user.profile_image === 'string' && user.profile_image && (
                <div style={{ marginTop: '5px' }}>
                  <small style={{ display: 'block' }}>Current: {user.profile_image.split('/').pop()}</small>
                  <a 
                    href={getFileUrl(user.profile_image)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <img 
                      src={getFileUrl(user.profile_image)} 
                      alt="Profile" 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', marginTop: '5px', border: '1px solid #ccc', cursor: 'pointer' }} 
                    />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <span>Address Information</span>
            <button type="button" onClick={addAddressBlock} style={addBtnStyle}>+ Add Address</button>
          </div>
          {addresses.map((address, index) => {
            if (address.address_status === "9") return null;

            return (
              <div key={address.address_id || index} style={blockStyle}>
                <div style={blockTitleStyle}>
                  <span>Address {index + 1} {address.isNew && <small style={{color: "green"}}>(New)</small>}</span>
                  {visibleAddressesCount > 1 && (
                    <button type="button" onClick={() => removeAddressBlock(index)} style={removeBtnStyle}>Remove</button>
                  )}
                </div>
                <div style={fieldRowStyle}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Address Type</label>
                    <select value={address.address_type} onChange={(e) => handleAddressChange(index, "address_type", e.target.value)} style={inputStyle} disabled={submitting}>
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>State Name</label>
                    <select value={address.state_id} onChange={(e) => handleAddressChange(index, "state_id", e.target.value)} style={inputStyle} disabled={submitting}>
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state.id} value={state.id}>{state.state_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={fieldRowStyle}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>City</label>
                    <select value={address.city_id} onChange={(e) => handleAddressChange(index, "city_id", e.target.value)} style={inputStyle} disabled={submitting || !address.state_id}>
                      <option value="">{address.state_id ? "Select City" : "Select State First"}</option>
                      {(citiesByState[address.state_id] || []).map((city) => (
                        <option key={city.id} value={city.id}>{city.city_name}</option>
                      ))}
                    </select>
                  </div>
                  {isAdmin && (
  <div style={fieldGroupStyle}>
    <label style={labelStyle}>Address Status</label>
    <select
      value={address.address_status}
      onChange={(e) => handleAddressChange(index, "address_status", e.target.value)}
      style={inputStyle}
      disabled={submitting}
    >
      <option value="1">Active</option>
      <option value="0">Inactive</option>
      <option value="9">Pending</option>
      <option value="3">Pending Approval</option>
    </select>
  </div>
)}
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Address</label>
                  <input value={address.address} onChange={(e) => handleAddressChange(index, "address", e.target.value)} style={inputStyle} disabled={submitting} />
                </div>
                <div style={fieldRowStyle}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Landmark</label>
                    <input value={address.landmark} onChange={(e) => handleAddressChange(index, "landmark", e.target.value)} style={inputStyle} disabled={submitting} />
                  </div>
                  
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Address Document Image</label>
                    {/* FIXED: Reading e.target.files[0] properly inside the handler */}
                    <input type="file" accept="image/*" onChange={(e) => handleAddressChange(index, "address_image", e.target.files[0])} style={inputStyle} disabled={submitting} />
                    
                    <div style={{ marginTop: '5px' }}>
                      {typeof address.address_image === "string" && address.address_image && (
                        <div style={{ marginTop: "5px" }}>
                          <small style={{ display: "block" }}>
                            Current: {address.address_image.split("/").pop()}
                          </small>
                          <a
                            href={getFileUrl(address.address_image)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={getFileUrl(address.address_image)}
                              alt="Address Doc"
                              style={{ width: "80px", height: "60px", objectFit: "contain", marginTop: "5px", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}
                            />
                          </a>
                        </div>
                      )}

                      {address.address_image instanceof File && (
                        <div style={{ marginTop: "5px", color: "green" }}>
                          <small>Selected: {address.address_image.name}</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <span>Employment & Salary Details</span>
            <button type="button" onClick={addCompanyBlock} style={addBtnStyle}>+ Add Company</button>
          </div>
          {employments.map((employment, index) => {
            if (employment.employment_status === "9") return null;

            const visibleSalariesCount = (employment.salaries || []).filter(s => s.salary_status !== "9").length;
            const visibleEmploymentsCount = employments.filter(e => e.employment_status !== "9").length;

            return (
              <div key={employment.employment_id || index} style={blockStyle}>
                <div style={blockTitleStyle}>
                  <span>Company {index + 1} {employment.isNew && <small style={{color: "green"}}>(New)</small>}</span>
                  {visibleEmploymentsCount > 1 && (
                    <button type="button" onClick={() => removeCompanyBlock(index)} style={removeBtnStyle}>Remove Company</button>
                  )}
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Company Name</label>
                  <input value={employment.company_name} onChange={(e) => handleEmploymentChange(index, "company_name", e.target.value)} style={inputStyle} disabled={submitting} />
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Company Address</label>
                  <input value={employment.company_address} onChange={(e) => handleEmploymentChange(index, "company_address", e.target.value)} style={inputStyle} disabled={submitting} />
                </div>
                <div style={fieldRowStyle}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Company Pincode</label>
                    <input value={employment.company_pincode} onChange={(e) => handleEmploymentChange(index, "company_pincode", e.target.value)} style={inputStyle} disabled={submitting} />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Company Mobile</label>
                    <input value={employment.company_mobile} onChange={(e) => handleEmploymentChange(index, "company_mobile", e.target.value)} style={inputStyle} disabled={submitting} />
                  </div>
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Company Email</label>
                  <input type="email" value={employment.company_email} onChange={(e) => handleEmploymentChange(index, "company_email", e.target.value)} style={inputStyle} disabled={submitting} />
                </div>
                
                <div style={{ background: "#f0f4f8", padding: "12px", borderRadius: "6px", marginBottom: "15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center" }}>
                    <strong style={{ fontSize: "14px", color: "#333" }}>Salaries</strong>
                    <button type="button" onClick={() => addSalaryBlock(index)} style={{ ...addBtnStyle, background: "#b5b7b8" }}>+ Add Salary</button>
                  </div>
                  
                  {(employment.salaries || []).map((salaryRow, salaryIndex) => {
                    if (salaryRow.salary_status === "9") return null;

                    const isPdf = typeof salaryRow.salary_image === 'string' && salaryRow.salary_image.toLowerCase().endsWith('.pdf');
                    const fileUrl = getFileUrl(salaryRow.salary_image);

                    return (
                      <div key={salaryRow.salary_id || salaryIndex} style={{ ...blockStyle, backgroundColor: "#fff", marginTop: "10px", marginBottom: "12px", padding: "12px" }}>
                        <div style={{ ...blockTitleStyle, fontSize: "13px", marginBottom: "8px" }}>
                          <span>Salary {salaryIndex + 1} {(salaryRow.isNew || employment.isNew) && <small style={{color: "green"}}>(New)</small>}</span>
                          {visibleSalariesCount > 1 && (
                            <button type="button" onClick={() => removeSalaryBlock(index, salaryIndex)} style={removeBtnStyle}>Remove Salary</button>
                          )}
                        </div>
                        <div style={fieldRowStyle}>
                          <div style={fieldGroupStyle}>
                            <label style={labelStyle}>Monthly Salary</label>
                            <input type="number" value={salaryRow.salary} onChange={(e) => handleSalaryChange(index, salaryIndex, "salary", e.target.value)} style={inputStyle} disabled={submitting} />
                          </div>
                        
                          <div style={fieldGroupStyle}>
                            <label style={labelStyle}>Salary Slip / Proof (Image or PDF)</label>
                            {/* FIXED: Reading e.target.files[0] properly inside the handler */}
                            <input type="file" accept="image/*,application/pdf" onChange={(e) => handleSalaryChange(index, salaryIndex, "salary_image", e.target.files[0])} style={inputStyle} disabled={submitting} />
                            
                            {typeof salaryRow.salary_image === 'string' && salaryRow.salary_image && (
                              <div style={{ marginTop: '5px' }}>
                                <small style={{ display: 'block' }}>Current: {salaryRow.salary_image.split('/').pop()}</small>
                                {isPdf ? (
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '5px', color: '#0066cc', fontWeight: 'bold', textDecoration: 'underline', fontSize: '13px' }}>
                                    📄 View / Download PDF
                                  </a>
                                ) : (
                                  <img src={fileUrl} alt="Salary Slip" style={{ width: '80px', height: '60px', objectFit: 'contain', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                )}
                              </div>
                            )}

                            {salaryRow.salary_image instanceof File && (
                              <div style={{ marginTop: "5px", color: "green" }}>
                                <small>Selected: {salaryRow.salary_image.name}</small>
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={fieldRowStyle}>
                          <div style={fieldGroupStyle}>
                            <label style={labelStyle}>Start Date</label>
                            <input type="date" value={salaryRow.start_date} onChange={(e) => handleSalaryChange(index, salaryIndex, "start_date", e.target.value)} style={inputStyle} disabled={submitting} />
                          </div>
                          <div style={fieldGroupStyle}>
                            <label style={labelStyle}>End Date</label>
                            <input
                              type="date"
                              value={salaryRow.end_date}
                              min={salaryRow.start_date}
                              onChange={(e) => handleSalaryChange(index, salaryIndex, "end_date", e.target.value)}
                              style={inputStyle}
                              disabled={submitting}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {isAdmin && (
  <div style={fieldGroupStyle}>
    <label style={labelStyle}>Employment Status</label>
    <select
      value={employment.employment_status}
      onChange={(e) =>
        handleEmploymentChange(index, "employment_status", e.target.value)
      }
      style={inputStyle}
      disabled={submitting}
    >
      <option value="1">Active</option>
      <option value="0">Inactive</option>
      <option value="9">Pending</option>
    </select>
  </div>
)}
              </div>
            );
          })}
        </div>
        </fieldset>
{!(hasPendingRequest || (!isAdmin && user.user_status === "9")) && (
  <div
    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
  >
    <button
      type="button"
      onClick={() => navigate("/users")}
      style={cancelButtonStyle}
      disabled={submitting}
    >
      Cancel
    </button>

    <button
      type="submit"
      style={buttonStyle}
      disabled={submitting}
    >
      {submitting ? "Updating..." : "Update"}
    </button>
  </div>
)}
      </form>
    </div>
  );
}

export default EditUser;
