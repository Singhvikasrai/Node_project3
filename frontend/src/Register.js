import React, { useState, useEffect } from "react";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", mobile: "", pincode: "", profile_image: null });
  const [addresses, setAddresses] = useState([{ address_type: "", address: "", landmark: "", state_id: "", city_id: "", address_image: null }]);
  const [employments, setEmployments] = useState([
    {
      company_name: "",
      company_address: "",
      company_pincode: "",
      company_mobile: "",
      company_email: "",
      salaries: [{ salary: "", start_date: "", end_date: "" }]
    }
  ]);

  const [errors, setErrors] = useState({});
  const [states, setStates] = useState([]);
  const [citiesByState, setCitiesByState] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // --- AUDIT LOG HELPER FUNCTION ---
  const logToAudit = async (payload) => {
    try {
      await fetch("http://localhost:5000/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Audit log failed for " + payload.primary_type + ":", err);
    }
  };

 const handleChange = (e) => {
  const { name, value, files } = e.target;

  if (name === "profile_image") {
    setForm({ ...form, profile_image: files[0] });
    return;
    console.log(files[0])
  }

  if (["mobile", "pincode"].includes(name)) {
    if (!/^\d*$/.test(value)) return;
  }

  setForm({ ...form, [name]: value });
};

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await fetch("http://localhost:5000/state");
        if (res.ok) {
          const resData = await res.json();
          setStates(resData.data || resData || []);
        }
      } catch (err) {
        console.error("Failed to load states:", err);
      }
    };
    fetchStates();
  }, []);

  const addBlock = (section) => {
    if (section === "address") {
      setAddresses([...addresses, { address_type: "", address: "", landmark: "", state_id: "", city_id: "",address_image:null }]);
    }
    if (section === "employment") {
      setEmployments([
        ...employments,
        {
          company_name: "",
          company_address: "",
          company_pincode: "",
          company_mobile: "",
          company_email: "",
          salaries: [{ salary: "", start_date: "", end_date: "" }]
        }
      ]);
    }
  };

  const removeBlock = (section, index, list, setList) => {
    if (list.length > 1) {
      const updatedList = list.filter((_, i) => i !== index);
      setList(updatedList);
    }
  };

  const handleAddressChange = async (index, e) => {
    const { name, value } = e.target;
    const updated = [...addresses];

    if (name === "state_id") {
      updated[index][name] = value;
      updated[index]["city_id"] = "";

      if (value && !citiesByState[value]) {
        try {
          const res = await fetch(`http://localhost:5000/city?state_id=${value}`);
          if (res.ok) {
            const resData = await res.json();
            setCitiesByState((prev) => ({ ...prev, [value]: resData.data || resData || [] }));
          }
        } catch (err) {
          console.error("Failed to load cities:", err);
        }
      }
    } else {
      updated[index][name] = value;
    }
    setAddresses(updated);
  };

  const handleEmploymentChange = (index, e) => {
    const { name, value } = e.target;
    if (["company_mobile", "company_pincode"].includes(name)) {
      if (!/^\d*$/.test(value)) return;
    }
    const updated = [...employments];
    updated[index][name] = value;
    setEmployments(updated);
  };

  const addSalary = (employmentIndex) => {
    const updated = [...employments];
    updated[employmentIndex].salaries = [
      ...updated[employmentIndex].salaries,
      { salary: "", start_date: "", end_date: "" }
    ];
    setEmployments(updated);
  };

  const removeSalary = (employmentIndex, salaryIndex) => {
    const updated = [...employments];
    if (updated[employmentIndex].salaries.length <= 1) return;
    updated[employmentIndex].salaries = updated[employmentIndex].salaries.filter((_, index) => index !== salaryIndex);
    setEmployments(updated);
  };

  const handleSalaryChange = (employmentIndex, salaryIndex, e) => {
    const { name, value } = e.target;
    if (name === "salary") {
      if (!/^\d*$/.test(value)) return;
    }
    const updated = [...employments];
    updated[employmentIndex].salaries[salaryIndex][name] = value;
    setEmployments(updated);
  };

  const validateForm = () => {
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name required";
    if (!form.email.trim()) newErrors.email = "Email required";
    if (!form.password.trim()) newErrors.password = "Password required";

    if (!form.mobile.trim()) {
      newErrors.mobile = "Mobile required";
    } else if (form.mobile.length !== 10) {
      newErrors.mobile = "Mobile must be 10 digits";
    }

    if (!form.pincode.trim()) {
      newErrors.pincode = "Pincode required";
    } else if (form.pincode.length !== 6) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

    for (let i = 0; i < addresses.length; i++) {
      if (!addresses[i].state_id) newErrors[`state_id${i}`] = "State required";
      if (!addresses[i].city_id) newErrors[`city_id${i}`] = "City required";
      if (!addresses[i].address.trim()) newErrors[`address${i}`] = "Address required";
      if (!addresses[i].landmark.trim()) newErrors[`landmark${i}`] = "Landmark required";
      if (!addresses[i].address_type) newErrors[`address_type${i}`] = "Address type required";
    }

    for (let i = 0; i < employments.length; i++) {
      const emp = employments[i];
      if (!emp.company_name.trim()) newErrors[`company_name${i}`] = "Company name required";
      if (!emp.company_email.trim()) newErrors[`company_email${i}`] = "Company email required";

      if (!emp.company_mobile.trim()) {
        newErrors[`company_mobile${i}`] = "Company mobile required";
      } else if (emp.company_mobile.length !== 10) {
        newErrors[`company_mobile${i}`] = "Company mobile must be 10 digits";
      }

      if (!emp.company_pincode.trim()) {
        newErrors[`company_pincode${i}`] = "Company pincode required";
      } else if (emp.company_pincode.length !== 6) {
        newErrors[`company_pincode${i}`] = "Company pincode must be 6 digits";
      }

      if (!emp.company_address.trim()) newErrors[`company_address${i}`] = "Company address required";

      for (let j = 0; j < emp.salaries.length; j++) {
        const sal = emp.salaries[j];
        if (!sal.salary.trim()) newErrors[`salary${i}_${j}`] = "Salary required";
        if (!sal.start_date) newErrors[`start_date${i}_${j}`] = "Start date required";
        if (!sal.end_date) newErrors[`end_date${i}_${j}`] = "End date required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- PRODUCTION LEVEL SUBMIT WITH SEQUENTIAL AUDIT LOGGING ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      setMessage({ type: "error", text: "Please fix the validation errors before submitting." });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const formData = new FormData();

      const payloadAddresses = addresses.map((addr) => {
        const selectedCity = (citiesByState[addr.state_id] || []).find(
          (city) => String(city.id) === String(addr.city_id)
        );
        return {
          address_type: addr.address_type,
          address: addr.address,
          landmark: addr.landmark,
          state_id: addr.state_id,
          city_id: addr.city_id,
          city_name: selectedCity?.city_name || selectedCity?.name || "",
          address_image: ""
        };
      });

      const payloadEmployments = employments.map((emp) => ({
        company_name: emp.company_name,
        company_address: emp.company_address,
        pincode: emp.company_pincode,
        mobile: emp.company_mobile,
        email: emp.company_email,
        salaries: emp.salaries.map((sal) => ({
          salary: sal.salary,
          start_date: sal.start_date,
          end_date: sal.end_date,
          salary_status: 1,
          salary_image: ""
        }))
      }));

      const jsonData = {
        user: {
          name: form.name,
          email: form.email,
          password: form.password,
          mobile: form.mobile,
          pincode: form.pincode,
          status: 3,
          profile_image: ""
        },
        addresses: payloadAddresses,
        employments: payloadEmployments
      };

      formData.append("data", JSON.stringify(jsonData));

      if (form.profile_image) {
        formData.append("profile_image", form.profile_image);
      }

      addresses.forEach((addr, index) => {
        if (addr.address_image) {
          formData.append(`address_image_${index}`, addr.address_image);
        }
      });

      employments.forEach((emp, empIdx) => {
        emp.salaries.forEach((sal, salIdx) => {
          if (sal.salary_image) {
            formData.append(`salary_image_${empIdx}_${salIdx}`, sal.salary_image);
          }
        });
      });

      const userRes = await fetch("http://localhost:5000/register", {
        method: "POST",
        body: formData,
      });

      const userData = await userRes.json();
      if (!userRes.ok) throw new Error(userData.message || "Registration failed");

      setMessage({ type: "success", text: "Registration completed successfully! You can now log in." });

      // Reset everything on success
      setForm({ name: "", email: "", password: "", mobile: "", pincode: "", profile_image: null });
      setAddresses([{ address_type: "", address: "", landmark: "", state_id: "", city_id: "", address_image: null }]);
      setEmployments([
        {
          company_name: "",
          company_address: "",
          company_pincode: "",
          company_mobile: "",
          company_email: "",
          salaries: [{ salary: "", start_date: "", end_date: "" , salary_image: null}]
        }
      ]);
      setErrors({});
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Something went wrong during registration." });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const inputStyle = { width: "100%", padding: "10px", margin: "8px 0", border: "1px solid #ccc", borderRadius: "5px", boxSizing: "border-box" };
  const buttonStyle = { width: "100%", padding: "12px", background: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" };
  const addBtnStyle = { background: "#4e83b2", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", float: "right" };
  const removeBtnStyle = { background: "#dc3545", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", marginTop: "5px" };
  const sectionStyle = { marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "8px", clear: "both" };
  const salaryStyle = { marginTop: "12px", padding: "12px", background: "#f5f9fc", border: "1px solid #d3e4f1", borderRadius: "6px" };
  const errorStyle = { color: "red", fontSize: "12px", marginTop: "-4px", marginBottom: "8px" };

  return (
    <div style={{ width: "700px", margin: "auto", paddingBottom: "40px" }}>
      <h2 style={{ textAlign: "center" }}>Complete Registration</h2>

      {message.text && (
        <div style={{ padding: "12px", margin: "15px 0", borderRadius: "5px", backgroundColor: message.type === "error" ? "#f8d7da" : "#d4edda", color: message.type === "error" ? "#721c24" : "#155724", border: "1px solid" }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* USER INFO SECTION */}
        <div style={sectionStyle}>
          <h3>User Info</h3>
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} style={inputStyle} />
          {errors.name && <div style={errorStyle}>{errors.name}</div>}

          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} style={inputStyle} />
          {errors.email && <div style={errorStyle}>{errors.email}</div>}

          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} style={inputStyle} />
          {errors.password && <div style={errorStyle}>{errors.password}</div>}

          <input name="mobile" placeholder="Mobile" value={form.mobile} maxLength={10} onChange={handleChange} style={inputStyle} />
          {errors.mobile && <div style={errorStyle}>{errors.mobile}</div>}

          <input name="pincode" placeholder="Pincode" value={form.pincode} maxLength={6} onChange={handleChange} style={inputStyle} />
          {errors.pincode && <div style={errorStyle}>{errors.pincode}</div>}
          <input type="file" name="profile_image" accept="image/*" onChange={handleChange} style={{ marginTop: "10px" }} />
          {errors.profile_image && <div style={errorStyle}>{errors.profile_image}</div>}
        </div>

        {/* LOCATION / ADDRESSES SECTION */}
        <div style={sectionStyle}>
          <button type="button" onClick={() => addBlock("address")} style={addBtnStyle}>+ Add</button>
          <h3>Location</h3>
          {addresses.map((addr, index) => (
            <div key={index} style={{ borderBottom: index > 0 ? "1px dashed #ccc" : "none", marginTop: "10px", paddingBottom: "10px" }}>
              {index > 0 && <h5>Address #{index + 1}</h5>}

              <select name="state_id" value={addr.state_id} onChange={(e) => handleAddressChange(index, e)} style={inputStyle}>
                <option value="">Select State</option>
                {states.map((s) => <option key={s.id} value={s.id}>{s.state_name || s.name}</option>)}
              </select>
              {errors[`state_id${index}`] && <div style={errorStyle}>{errors[`state_id${index}`]}</div>}

              <select name="city_id" value={addr.city_id} onChange={(e) => handleAddressChange(index, e)} style={inputStyle} disabled={!addr.state_id}>
                <option value="">{addr.state_id ? "Select City" : "Select State First"}</option>
                {(citiesByState[addr.state_id] || []).map((c) => <option key={c.id} value={c.id}>{c.city_name || c.name}</option>)}
              </select>
              {errors[`city_id${index}`] && <div style={errorStyle}>{errors[`city_id${index}`]}</div>}

              <input name="address" placeholder="Address" value={addr.address} onChange={(e) => handleAddressChange(index, e)} style={inputStyle} />
              {errors[`address${index}`] && <div style={errorStyle}>{errors[`address${index}`]}</div>}

              <input name="landmark" placeholder="Landmark" value={addr.landmark} onChange={(e) => handleAddressChange(index, e)} style={inputStyle} />
              {errors[`landmark${index}`] && <div style={errorStyle}>{errors[`landmark${index}`]}</div>}

              <select name="address_type" value={addr.address_type} onChange={(e) => handleAddressChange(index, e)} style={inputStyle}>
                <option value="">Select Address Type</option>
                <option value="Home">Home</option>
                <option value="Office">Office</option>
                <option value="Other">Other</option>
              </select>
               <input type="file"   accept="image/*,.pdf,application/pdf" onChange={(e) => {const updated = [...addresses];updated[index].address_image = e.target.files[0]; setAddresses(updated);

                }}/>

              {errors[`address_type${index}`] && <div style={errorStyle}>{errors[`address_type${index}`]}</div>}

              {addresses.length > 1 && (
                <button type="button" onClick={() => removeBlock("address", index, addresses, setAddresses)} style={removeBtnStyle}>Remove Address</button>
              )}
            </div>
          ))}

        </div>

        {/* COMPANY & SALARY SECTION */}
        <div style={sectionStyle}>
          <button type="button" onClick={() => addBlock("employment")} style={addBtnStyle}>+ Add Company</button>
          <h3>Company & Salary</h3>
          {employments.map((emp, index) => (
            <div key={index} style={{ borderBottom: index > 0 ? "2px solid #ccc" : "none", marginTop: "15px", paddingBottom: "15px" }}>
              {index > 0 && <h5>Company #{index + 1}</h5>}

              <input name="company_name" placeholder="Company Name" value={emp.company_name} onChange={(e) => handleEmploymentChange(index, e)} style={inputStyle} />
              {errors[`company_name${index}`] && <div style={errorStyle}>{errors[`company_name${index}`]}</div>}

              <input name="company_email" placeholder="Company Email" value={emp.company_email} onChange={(e) => handleEmploymentChange(index, e)} style={inputStyle} />
              {errors[`company_email${index}`] && <div style={errorStyle}>{errors[`company_email${index}`]}</div>}

              <input name="company_mobile" placeholder="Company Mobile" value={emp.company_mobile} maxLength={10} onChange={(e) => handleEmploymentChange(index, e)} style={inputStyle} />
              {errors[`company_mobile${index}`] && <div style={errorStyle}>{errors[`company_mobile${index}`]}</div>}

              <input name="company_pincode" placeholder="Company Pincode" value={emp.company_pincode} maxLength={6} onChange={(e) => handleEmploymentChange(index, e)} style={inputStyle} />
              {errors[`company_pincode${index}`] && <div style={errorStyle}>{errors[`company_pincode${index}`]}</div>}

              <input name="company_address" placeholder="Company Address" value={emp.company_address} onChange={(e) => handleEmploymentChange(index, e)} style={inputStyle} />
              {errors[`company_address${index}`] && <div style={errorStyle}>{errors[`company_address${index}`]}</div>}

              {/* SALARY NESTED SECTION */}
              <div style={salaryStyle}>
                <button type="button" onClick={() => addSalary(index)} style={addBtnStyle}>+ Add Salary</button>
                <strong style={{ fontSize: "14px", color: "#333" }}>Salary Details</strong>

                {emp.salaries.map((salaryRow, salaryIndex) => (
                  <div key={salaryIndex} style={{ borderTop: salaryIndex > 0 ? "1px dashed #c6d9e8" : "none", marginTop: "10px", paddingTop: "10px", clear: "both" }}>
                    {salaryIndex > 0 && <h5>Salary #{salaryIndex + 1}</h5>}

                    <input name="salary" placeholder="Salary Amount" value={salaryRow.salary} onChange={(e) => handleSalaryChange(index, salaryIndex, e)} style={inputStyle} />
                    {errors[`salary${index}_${salaryIndex}`] && <div style={errorStyle}>{errors[`salary${index}_${salaryIndex}`]}</div>}

                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "12px", color: "#666" }}>Start Date</label>
                        <input type="date" name="start_date" value={salaryRow.start_date} onChange={(e) => handleSalaryChange(index, salaryIndex, e)} style={inputStyle} />
                        {errors[`start_date${index}_${salaryIndex}`] && <div style={errorStyle}>{errors[`start_date${index}_${salaryIndex}`]}</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "12px", color: "#666" }}>End Date</label>
                        <input type="date" name="end_date" value={salaryRow.end_date} max={today} onChange={(e) => handleSalaryChange(index, salaryIndex, e)} style={inputStyle} />
                        {errors[`end_date${index}_${salaryIndex}`] && <div style={errorStyle}>{errors[`end_date${index}_${salaryIndex}`]}</div>}
                           
                      </div>
                    </div>
                    {/* PDF Upload */}
               <div style={{ marginTop: "10px" }}> <input type="file" accept=".pdf" onChange={(e) => {
               const updated = [...employments];
                updated[index].salaries[salaryIndex].salary_image = e.target.files[0]; 
                setEmployments(updated);
              }}/>
              </div>

                    {emp.salaries.length > 1 && (
                      <button type="button" onClick={() => removeSalary(index, salaryIndex)} style={removeBtnStyle}>Remove Salary</button>
                    )}
                  </div>
                ))}
              </div>

              {employments.length > 1 && (
                <button type="button" onClick={() => removeBlock("employment", index, employments, setEmployments)} style={{ ...removeBtnStyle, width: "100%", padding: "10px", marginTop: "10px" }}>
                  Remove Company
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Processing..." : "Register"}
        </button>
      </form>
    </div>
  );
}

export default Register;
