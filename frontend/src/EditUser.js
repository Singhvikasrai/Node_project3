import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000";

const emptyUser = {
  name: "",
  email: "",
  mobile: "",
  pincode: "",
  user_status: "",
};

function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [user, setUser] = useState(emptyUser);
  const [addresses, setAddresses] = useState([]);
  const [employments, setEmployments] = useState([]);
  const [states, setStates] = useState([]);
  const [citiesByState, setCitiesByState] = useState({});

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return  { Authorization: `Bearer ${token}` };
  };

  const jsonHeaders = () => ({
    "Content-Type": "application/json",
    ...authHeaders()
  });

  const fetchCities = useCallback(async (stateId) => {
    if (!stateId) return;

    const res = await fetch(`${API_BASE_URL}/city?state_id=${stateId}`);
    const data = await res.json();

    setCitiesByState((prev) => ({
      ...prev,
      [stateId]: data.data || []
    }));
  }, []);

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const [detailRes, stateRes] = await Promise.all([
        fetch(`${API_BASE_URL}/address/${id}`, 
          { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/state`)
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
        user_status: firstRow.user_status || ""
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
          address_status: row?.address_status ?? 1
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
            employment_status: row.employment_status ?? 1,
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
            start_date: row.start_date ? row.start_date.substring(0, 10) : "",
            end_date: row.end_date ? row.end_date.substring(0, 10) : ""
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

  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id, fetchUserDetails]);

  const handleUserChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
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

    if (field === "state_id") {
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

    try {
      setSubmitting(true);
      setMessage({ type: "", text: "" });

      const userRes = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          pincode: user.pincode,
          status: user.user_status
        })
      });

      if (!userRes.ok) throw new Error("Failed to update personal information!");

      await Promise.all(
        addresses.map(async (address) => {
          const addressRes = await fetch(`${API_BASE_URL}/address/${address.address_id}`, {
            method: "PUT",
            headers: jsonHeaders(),
            body: JSON.stringify({
              address_type: address.address_type,
              address: address.address,
              landmark: address.landmark,
              city_id: address.city_id,
              status: address.address_status
            })
          });

          if (!addressRes.ok) throw new Error(`Failed to update Address ${address.address_id}!`);
        })
      );

      await Promise.all(
        employments.map(async (employment) => {
          const empRes = await fetch(`${API_BASE_URL}/employment/${employment.employment_id}`, {
            method: "PUT",
            headers: jsonHeaders(),
            body: JSON.stringify({
              user_id: id,
              company_name: employment.company_name,
              company_address: employment.company_address,
              pincode: employment.company_pincode,
              mobile: employment.company_mobile,
              email: employment.company_email,
              status: employment.employment_status
            })
          });

          if (!empRes.ok) throw new Error(`Failed to update Company ${employment.employment_id}!`);

          await Promise.all(
            (employment.salaries || []).map(async (salaryRow) => {
              const salaryRes = await fetch(`${API_BASE_URL}/salary/${salaryRow.salary_id}`, {
                method: "PUT",
                headers: jsonHeaders(),
                body: JSON.stringify({
                  user_id: id,
                  empl_id: employment.employment_id,
                  salary: salaryRow.salary,
                  start_date: salaryRow.start_date,
                  end_date: salaryRow.end_date
                })
              });

              if (!salaryRes.ok) throw new Error(`Failed to update salary for Company ${employment.employment_id}!`);
            })
          );
        })
      );

      setMessage({ type: "success", text: "User details updated successfully!" });
      setTimeout(() => navigate("/users"), 1500);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "An error occurred while updating" });
    } finally {
      setSubmitting(false);
    }
  };

  const containerStyle = { maxWidth: "980px", margin: "30px auto", padding: "40px", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", backgroundColor: "#f9f9f9", fontFamily: "Arial, sans-serif" };
  const titleStyle = { textAlign: "center", color: "#333", marginBottom: "10px", fontSize: "32px", fontWeight: "700" };
  const subtitleStyle = { textAlign: "center", color: "#666", marginBottom: "30px", fontSize: "14px" };
  const sectionStyle = { marginBottom: "30px", paddingBottom: "20px", borderBottom: "2px solid #e0e0e0" };
  const sectionTitleStyle = { fontSize: "18px", fontWeight: "700", color: "#0066cc", marginBottom: "15px" };
  const blockStyle = { backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "6px", padding: "18px", marginBottom: "18px" };
  const blockTitleStyle = { color: "#333", fontWeight: "700", marginBottom: "14px" };
  const fieldRowStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "15px" };
  const fieldGroupStyle = { display: "flex", flexDirection: "column", marginBottom: "15px" };
  const labelStyle = { marginBottom: "6px", color: "#333", fontWeight: "600", fontSize: "13px" };
  const inputStyle = { padding: "11px", border: "1px solid #bbb", borderRadius: "4px", fontSize: "14px", fontFamily: "Arial, sans-serif" };
  const buttonStyle = { padding: "14px 40px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "700", cursor: submitting ? "not-allowed" : "pointer", marginTop: "20px", opacity: submitting ? 0.7 : 1, width: "100%" };
  const cancelButtonStyle = { padding: "14px 40px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "700", cursor: submitting ? "not-allowed" : "pointer", marginTop: "20px", width: "100%", opacity: submitting ? 0.7 : 1 };
  const messageStyle = { padding: "15px", marginBottom: "20px", borderRadius: "4px", fontSize: "14px", fontWeight: "600", textAlign: "center", ...(message.type === "success" && { backgroundColor: "#d4edda", color: "#155724", border: "1px solid #c3e6cb" }), ...(message.type === "error" && { backgroundColor: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb" }) };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "40px", fontSize: "18px" }}>Loading user details...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Edit User Details</h1>
      <p style={subtitleStyle}>Update personal, address, employment, and salary information</p>

      {message.text && <div style={messageStyle}>{message.text}</div>}

      <form onSubmit={handleSubmit}>
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
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>User Status</label>
            <select name="user_status" value={user.user_status} onChange={handleUserChange} style={inputStyle} disabled={submitting}>
             <option value="1">Active</option>
              <option value="0">Inactive</option>
             <option value="9">Pending</option>
            </select>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Address Information</div>
          {addresses.map((address, index) => (
            <div key={address.address_id} style={blockStyle}>
              <div style={blockTitleStyle}>Address{index + 1}</div>
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
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Address Status</label>
                  <select value={address.address_status} onChange={(e) => handleAddressChange(index, "address_status", e.target.value)} style={inputStyle} disabled={submitting}>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                    <option value="9">Pending</option>
                  </select>
                </div>
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Address</label>
                <input value={address.address} onChange={(e) => handleAddressChange(index, "address", e.target.value)} style={inputStyle} disabled={submitting} />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Landmark</label>
                <input value={address.landmark} onChange={(e) => handleAddressChange(index, "landmark", e.target.value)} style={inputStyle} disabled={submitting} />
              </div>
            </div>
          ))}
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Employment & Salary Details</div>
          {employments.map((employment, index) => (
            <div key={employment.employment_id} style={blockStyle}>
              <div style={blockTitleStyle}>Company{index + 1}</div>
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
              {(employment.salaries || []).map((salaryRow, salaryIndex) => (
                <div key={salaryRow.salary_id || salaryIndex} style={{ ...blockStyle, backgroundColor: "#f7fbff", marginTop: "10px", marginBottom: "12px" }}>
                  <div style={blockTitleStyle}>Salary {salaryIndex + 1}</div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Monthly Salary</label>
                    <input type="number" value={salaryRow.salary} onChange={(e) => handleSalaryChange(index, salaryIndex, "salary", e.target.value)} style={inputStyle} disabled={submitting} />
                  </div>
                  <div style={fieldRowStyle}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>Start Date</label>
                      <input type="date" value={salaryRow.start_date} onChange={(e) => handleSalaryChange(index, salaryIndex, "start_date", e.target.value)} style={inputStyle} disabled={submitting} />
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>End Date</label>
                      <input type="date" value={salaryRow.end_date} onChange={(e) => handleSalaryChange(index, salaryIndex, "end_date", e.target.value)} style={inputStyle} disabled={submitting} />
                    </div>
                  </div>
                </div>
              ))}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Employment Status</label>
                <select value={employment.employment_status} onChange={(e) => handleEmploymentChange(index, "employment_status", e.target.value)} style={inputStyle} disabled={submitting}>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                  <option value="9">Pending</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <button type="submit" style={buttonStyle} disabled={submitting}>
            {submitting ? "Updating..." : "Update User"}
          </button>
          <button type="button" style={cancelButtonStyle} onClick={() => navigate("/users")} disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditUser;
