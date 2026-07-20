import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const statusMap = { 1: "Active", 0: "Inactive", 9: "Pending" ,3: "Pending Approval"};
const API_BASE_URL = "http://localhost:5000";

// Live Document View Component
const AuditDocumentView = ({ val }) => {
  if (!val || typeof val !== "string" || !val.trim() || val === "-") return <span>-</span>;

  const extractUrlFromMarkdown = (value) => {
    const nestedImageMatch = value.match(/\[!\[.*?\]\((.*?)\)\]\((.*?)\)/);
    if (nestedImageMatch) return nestedImageMatch[2];

    const imageMatch = value.match(/!\[.*?\]\((.*?)\)/);
    if (imageMatch) return imageMatch[1];

    const urlMatch = value.match(/\((https?:\/\/[^)]+)\)/);
    if (urlMatch) return urlMatch[1];

    return value;
  };

  const resolvedValue = extractUrlFromMarkdown(val.trim());
  const getFileUrl = (path) => path.startsWith("http") ? path : `${API_BASE_URL}/${path}`;
  const fileUrl = getFileUrl(resolvedValue);
  const lowerVal = resolvedValue.toLowerCase();
  const isPdf = lowerVal.endsWith(".pdf");
  const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp"].some(ext => lowerVal.endsWith(ext));

  if (!isPdf && !isImage) return <span>-</span>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "4px" }}>
      {isPdf ? (
        <a href={fileUrl} target="_blank" rel="noreferrer" style={{ color: "#007bff", textDecoration: "none", fontWeight: "bold", fontSize: "12px" }}>
          📄 View PDF
        </a>
      ) : (
        <a href={fileUrl} target="_blank" rel="noreferrer">
          <img 
            src={fileUrl} 
            alt="audit-preview" 
            style={{ maxWidth: "60px", maxHeight: "60px", borderRadius: "4px", border: "1px solid #ddd", objectFit: "cover", display: "block" }} 
            title="Click to view full image"
            onError={(e) => { 
              e.target.style.display = 'none';
              if (e.target.parentElement) e.target.parentElement.innerHTML = '-';
            }}
          />
        </a>
      )}
    </div>
  );
};

function Users() {
  const [activeTab, setActiveTab] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [mobileSearch, setMobileSearch] = useState("");
  const [pincodeSearch, setPincodeSearch] = useState("");
  const [statusSearch, setStatusSearch] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: "", email: "", mobile: "", pincode: "", status: "" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auditData, setAuditData] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [, setSelectedUserId] = useState(null);

  const [expandedCompany, setExpandedCompany] = useState(null);
  const [expandedSalary, setExpandedSalary] = useState(null);

  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState("DESC");
  const [sortBy, setSortBy] = useState("name");


  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(
    `${API_BASE_URL}/users?page=${page}&limit=${limit}`,
    {
        method: "GET",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
        }
    }
);
      if (res.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      const payload = data.data || {};
      setUsers(Array.isArray(payload) ? payload : payload.users || []);
      setTotalPages(payload.totalPages || 1);
      
    } catch (err) {
      console.error("FETCH USER ERROR =", err);
    }
  }, [page, limit]);

  const fetchAuditData = async (userId) => {
    setLoadingAudit(true);
    setIsModalOpen(true);
    setSelectedUserId(userId);
    setExpandedCompany(null);
    setExpandedSalary(null);
    setActiveTab("user");
    try {
      const res = await fetch(`${API_BASE_URL}/audit?userId=${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const result = await res.json();
      setAuditData(result.data || []);
    } catch (err) {
      console.error("Audit fetch error:", err);
      setAuditData([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  const deleteUser = async (id) => {
    await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    fetchUsers();
  };

  const handleSearch = () => {
    if (mobileSearch && mobileSearch.length !== 10) return setMobileError("Mobile number must be 10 digits");
    setMobileError("");
    setFilters({ search, email: emailSearch, mobile: mobileSearch, pincode: pincodeSearch, status: statusSearch });
  };

  const handleReset = () => {
    setSearch(""); setEmailSearch(""); setMobileSearch(""); setPincodeSearch(""); setStatusSearch(""); setMobileError("");
    setFilters({ search: "", email: "", mobile: "", pincode: "", status: "" });
  };

  const getPageNumbers = () => {
    const maxButtons = 7;
    if (totalPages <= maxButtons) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(page - 3, totalPages - maxButtons + 1));
    return Array.from({ length: maxButtons }, (_, i) => start + i);
  };

 useEffect(() => {
    fetchUsers();
}, [fetchUsers]);

  const parseJsonData = (dataField) => {
    if (!dataField) return {};
    let parsed = typeof dataField === "string" ? (() => { try { return JSON.parse(dataField); } catch { return {}; } })() : dataField;
    
    const normalizedObj = {};
    Object.keys(parsed || {}).forEach(key => {
      normalizedObj[key.toLowerCase().replace(/[-_\s]/g, "")] = parsed[key];
    });
    return normalizedObj;
  };

  const formatValue = (key, val) => {
    if (val === undefined || val === null || String(val).trim() === "" || val === "-") return "-";
    const cleanKey = key.toLowerCase().replace(/[-_\s]/g, "");
    
    if (["image", "pdf", "profileimage", "salaryimage", "addressimage"].some(k => cleanKey.includes(k))) {
      if (typeof val === "string" && !val.includes(".") && val.length < 5) return "-";
      return <AuditDocumentView val={String(val)} />;
    }
    if (cleanKey === "salarystatus" || cleanKey === "status") {
      return String(val) === "1" ? "Active" : String(val) === "9" ? "Delete" : (statusMap[val] || "Pending");
    }
    return String(val);
  };
 
  const filteredAuditRecords = auditData.filter(r => 
    activeTab === "employment" ? (r.primary_type === "employment" || r.primary_type === "salary") : r.primary_type === activeTab
  );

  // FIXED Employment & Salary Timeline Grouping
  const getGroupedEmploymentData = () => {
    const companies = {};
    const idToCompanyNameMap = {}; 

    const chronologicalRecords = [...filteredAuditRecords].sort((a, b) => {
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    });

    // Pass 1: ID to Company Name mapping
     chronologicalRecords.forEach((record) => {
      if (record.primary_type === "employment" && record.primary_id) {
        const compName = record.company_name || parseJsonData(record.data).companyname;
        if (compName && compName !== "Unknown Company") {
          idToCompanyNameMap[String(record.primary_id)] = compName;
        }
      }
    });

    // Pass 2: Process Timeline Data safely
    chronologicalRecords.forEach((record, index) => {
      const currentData = parseJsonData(record.data);
      
      const previousRecord = chronologicalRecords
        .slice(0, index)
        .reverse()
        .find((r) => String(r.primary_id) === String(record.primary_id) && r.primary_type === record.primary_type);

      const previousData = previousRecord ? parseJsonData(previousRecord.data) : null;

      let compName = record.company_name || currentData.companyname || previousData?.companyname;
      const employmentId = currentData.emplid || previousData?.emplid || currentData.employmentid || previousData?.employmentid;

      if (!compName && record.primary_id && idToCompanyNameMap[String(record.primary_id)]) {
        compName = idToCompanyNameMap[String(record.primary_id)];
      }

      if (!compName && employmentId && idToCompanyNameMap[String(employmentId)]) {
        compName = idToCompanyNameMap[String(employmentId)];
      }
      
      if (!compName) compName = "Unknown Company";

      if (!companies[compName]) {
        companies[compName] = {
          name: compName,
          details: { email: currentData.email || currentData.companyemail || "-", mobile: currentData.mobile || "-", address: currentData.address || "-" },
          profileHistory: [],
          salaries: {}
        };
      }

      const keyFilter = (key) => {
        const cleanKey = key.toLowerCase().replace(/[-_\s]/g, "");
        if (cleanKey === "emplid" || cleanKey === "companyname") return false;
        if (!previousData) return true; // Show all if first record
        return String(currentData[key] || "") !== String(previousData[key] || "");
      };

      const timestampStr = record.created_at ? new Date(record.created_at).toLocaleString("en-GB") : "-";

      if (record.primary_type === "employment") {
        const displayKeys = Object.keys(currentData).filter(k => keyFilter(k));
        if (displayKeys.length > 0 || !previousData) {
          companies[compName].profileHistory.unshift({
            id: record.id, timestamp: timestampStr, displayKeys, currentData, previousData
          });
        }
      }

      if (record.primary_type === "salary" && record.primary_id) {
        const salId = record.primary_id;
        const isDeleted = String(currentData.salarystatus) === "9";

        if (!companies[compName].salaries[salId]) {
          companies[compName].salaries[salId] = {
            id: salId, currentAmount: currentData.salary ? `₹${currentData.salary}` : "-", currentStatus: isDeleted ? "Delete" : "Active", history: []
          };
        }

        const displayKeys = Object.keys(currentData).filter(k => keyFilter(k));
        companies[compName].salaries[salId].history.unshift({
          id: record.id, timestamp: timestampStr, displayKeys, currentData, previousData
        });
      }
    });

    delete companies["Unknown Company"];
    return Object.values(companies);
  };

  const getTimelineProcessedRecords = () => {
    const chronological = [...filteredAuditRecords].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return a.id - b.id;
    });

    const processed = chronological.map((record, index) => {
      const currentData = parseJsonData(record.data);
      const previousRecord = chronological
        .slice(0, index)
        .reverse()
        .find((r) => String(r.primary_id) === String(record.primary_id) && r.primary_type === record.primary_type);

      const previousData = previousRecord ? parseJsonData(previousRecord.data) : null;
      const allKeys = Object.keys(currentData);
      const changedKeys = previousData
        ? allKeys.filter(key => String(currentData[key] || "") !== String(previousData[key] || ""))
        : allKeys;

      if (previousData && changedKeys.length === 0) {
  return null;
}

return {
  record,
  currentData,
  previousData,
  changedKeys: previousData ? changedKeys : allKeys
};
    });

    return processed.filter(Boolean).reverse();
  };

  const inputStyle = { width: "100%", padding: "12px 15px", fontSize: "14px", border: "1px solid #ccc", borderRadius: "8px", boxSizing: "border-box", height: "44px" };
  const btnBase = { padding: "6px 10px", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer" };
  const cellStyle = { padding: "15px 12px", color: "#555", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" };
  const tabBtnStyle = (tabName) => ({
    padding: "10px 20px", border: "none", background: activeTab === tabName ? "#85a4c5" : "#eee", color: activeTab === tabName ? "white" : "black", borderRadius: "6px 6px 0 0", cursor: "pointer", fontWeight: "600", textTransform: "capitalize"
  });

  const sortedUsers = users
    .filter((u) =>
      (u.name?.toLowerCase() || "").includes(filters.search.toLowerCase()) &&
      (u.email?.toLowerCase() || "").includes(filters.email.toLowerCase()) &&
      (u.mobile?.toString() || "").includes(filters.mobile) &&
      (u.pincode?.toString() || "").includes(filters.pincode) &&
      (u.status?.toString() || "").includes(filters.status)
    )
    .sort((a, b) => {
      const getValue = (item, key) => {
        if (key === "status") {
          return statusMap[item.status] ? statusMap[item.status].toLowerCase() : "";
        }
        if (key === "mobile" || key === "pincode") {
          const numeric = Number(item[key]);
          return Number.isNaN(numeric) ? String(item[key] || "").toLowerCase() : numeric;
        }
        const value = item[key];
        return value ? String(value).toLowerCase() : "";
      };

      const aVal = getValue(a, sortBy);
      const bVal = getValue(b, sortBy);

      if (aVal < bVal) return sortOrder === "ASC" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "ASC" ? 1 : -1;
      return 0;
    });

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", backgroundColor: "#f5f5f5", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#333", marginBottom: "30px" }}>👥 User Management</h1>

      {/* SEARCH FORM */}
      <form style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "25px", backgroundColor: "white", padding: "20px", borderRadius: "12px", alignItems: "center" }} onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
        <div style={{ flex: 1, minWidth: "160px" }}><input type="text" placeholder="Name" value={search} onChange={(e) => /^[A-Za-z ]*$/.test(e.target.value) && setSearch(e.target.value)} style={inputStyle} /></div>
        <div style={{ flex: 1, minWidth: "160px" }}><input type="text" placeholder="Email" value={emailSearch} onChange={(e) => setEmailSearch(e.target.value)} style={inputStyle} /></div>
        <div style={{ flex: 1, minWidth: "160px" }}>
          <input type="text" placeholder="Mobile" value={mobileSearch} maxLength={10} onChange={(e) => /^\d*$/.test(e.target.value) && setMobileSearch(e.target.value)} style={inputStyle} />
          {mobileError && <span style={{ color: "red", fontSize: "12px" }}>{mobileError}</span>}
        </div>
        <div style={{ flex: 1, minWidth: "160px" }}><input type="text" placeholder="Pincode" value={pincodeSearch} maxLength={6} onChange={(e) => setPincodeSearch(e.target.value)} style={inputStyle} /></div>
        <div style={{ flex: 1, minWidth: "160px" }}>
          <select value={statusSearch} onChange={(e) => setStatusSearch(e.target.value)} style={inputStyle}>
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
            <option value="9">Delete</option>
            <option value="3">Pending Approval</option>
          </select>
        </div>
        <button type="submit" style={{ height: "44px", padding: "0 24px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>Search</button>
        <button type="button" onClick={handleReset} style={{ height: "44px", padding: "0 24px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>Clear</button>
      </form>

      {/* USER TABLE */}
      <div style={{ backgroundColor: "white", borderRadius: "12px", overflowX: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", tableLayout: "fixed" }}>
          <thead>
            <tr style={{ backgroundColor: "#007bff", color: "white" }}>
              <th style={{ padding: "14px 12px", textAlign: "left", width: "18%", cursor: "pointer" }} onClick={() => {
                if (sortBy === "name") setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
                else { setSortBy("name"); setSortOrder("DESC"); }
              }}>
                Name {sortBy === "name" ? (sortOrder === "ASC" ? "▲" : "▼") : ""}
              </th>
              <th style={{ padding: "14px 12px", textAlign: "left", width: "25%", cursor: "pointer" }} onClick={() => {
                if (sortBy === "email") setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
                else { setSortBy("email"); setSortOrder("DESC"); }
              }}>
                Email {sortBy === "email" ? (sortOrder === "ASC" ? "▲" : "▼") : ""}
              </th>
              <th style={{ padding: "14px 12px", textAlign: "left", width: "14%", cursor: "pointer" }} onClick={() => {
                if (sortBy === "mobile") setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
                else { setSortBy("mobile"); setSortOrder("DESC"); }
              }}>
                Mobile {sortBy === "mobile" ? (sortOrder === "ASC" ? "▲" : "▼") : ""}
              </th>
              <th style={{ padding: "14px 12px", textAlign: "left", width: "12%", cursor: "pointer" }} onClick={() => {
                if (sortBy === "pincode") setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
                else { setSortBy("pincode"); setSortOrder("DESC"); }
              }}>
                Pincode {sortBy === "pincode" ? (sortOrder === "ASC" ? "▲" : "▼") : ""}
              </th>
              <th style={{ padding: "14px 12px", textAlign: "left", width: "12%", cursor: "pointer" }} onClick={() => {
                if (sortBy === "status") setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
                else { setSortBy("status"); setSortOrder("DESC"); }
              }}>
                Status {sortBy === "status" ? (sortOrder === "ASC" ? "▲" : "▼") : ""}
              </th>
              <th style={{ padding: "14px 12px", textAlign: "center", width: "20%" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((u, idx) => {
              const rowUserId = u.user_id || u.id;
              return (
                <tr key={rowUserId || idx} style={{ borderBottom: "1px solid #eee", backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                  <td style={cellStyle}><strong>{u.name}</strong></td>
                  <td style={cellStyle}>{u.email}</td>
                  <td style={cellStyle}>{u.mobile}</td>
                  <td style={cellStyle}>{u.pincode}</td>
                  <td style={cellStyle}>
                    <span style={{ padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: String(u.status) === "1" ? "#e6f4ea" : String(u.status) === "0" ? "#fce8e6" : "#e8f0fe", color: String(u.status) === "1" ? "#137333" : String(u.status) === "0" ? "#c5221f" : "#1a73e8" }}>
                      {statusMap[u.status] || "Pending"}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button type="button" style={{ ...btnBase, backgroundColor: "#007bff", color: "white" }} onClick={() => navigate(`/user/${rowUserId}`)}>View</button>
                      <button type="button" style={{ ...btnBase, backgroundColor: "#007bff", color: "white" }} onClick={() => navigate(`/user/${rowUserId}/edit`)}>Edit</button>
                      <button type="button" style={{ ...btnBase, backgroundColor: "#007bff", color: "white" }} onClick={() => { setActiveTab("user"); fetchAuditData(rowUserId); }}>Audit</button>
                      <button type="button" style={{ ...btnBase, backgroundColor: "#dc3545", color: "white" }} onClick={() => deleteUser(rowUserId)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "20px" }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            style={{ ...btnBase, backgroundColor: page <= 1 ? "#ccc" : "#007bff", color: "white", minWidth: "80px" }}
          >
            Previous
          </button>

          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => setPage(pageNum)}
              style={{
                ...btnBase,
                backgroundColor: pageNum === page ? "#007bff" : "#f1f1f1",
                color: pageNum === page ? "white" : "#333",
                minWidth: "40px"
              }}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            style={{ ...btnBase, backgroundColor: page >= totalPages ? "#ccc" : "#007bff", color: "white", minWidth: "80px" }}
          >
            Next
          </button>
        </div>
      )}

      {/* AUDIT MODAL */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, backdropFilter: "blur(3px)" }}>
          <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "12px", width: "95%", maxWidth: "750px", maxHeight: "85vh", overflowY: "auto", position: "relative" }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", top: "10px", right: "15px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#aaa" }}>&times;</button>
            <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>Audit Trail History</h3>

            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #ddd", flexWrap: "wrap" }}>
              <button onClick={() => { setActiveTab("user"); }} style={tabBtnStyle("user")}>Basic</button>
              <button onClick={() => { setActiveTab("address"); }} style={tabBtnStyle("address")}>Address</button>
              <button onClick={() => { setActiveTab("employment"); }} style={tabBtnStyle("employment")}>Employment</button>
            </div>

            {loadingAudit ? (
              <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>Fetching audit records...</p>
            ) : filteredAuditRecords.length === 0 ? (
              <p style={{ textAlign: "center", padding: "20px", color: "#888" }}>No records found for tab: <b>{activeTab}</b></p>
            ) : activeTab === "employment" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {getGroupedEmploymentData().map((company) => {
                  const isCompExpanded = expandedCompany === company.name;
                  return ( 
                    <div key={company.name} style={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
                      <div
                        onClick={() => setExpandedCompany(isCompExpanded ? null : company.name)}
                        style={{ padding: "12px 15px", backgroundColor: "#f8f9fa", cursor: "pointer", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: isCompExpanded ? "1px solid #ddd" : "none" }}
                      >
                        <span>{company.name}</span>
                        <span>{isCompExpanded ? "▼" : "▶"}</span>
                      </div>

                      {isCompExpanded && (
                        <div style={{ padding: "15px", backgroundColor: "#fff" }}>
                          <h4 style={{ margin: "0 0 12px 0", borderBottom: "2px solid #eee", paddingBottom: "5px", color: "#555" }}>Company Details</h4>
                          <div style={{ overflowX: "auto", marginBottom: "25px" }}>
                            <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", borderColor: "#ddd" }}>
                              <thead>
                                <tr style={{ backgroundColor: "#8cafec", color: "#333" }}>
                                  <th style={{ width: "30%", textAlign: "center" }}>Date & Time</th>
                                  <th style={{ width: "70%" }}>Data</th>
                                </tr>
                              </thead>
                              <tbody>
                                {company.profileHistory.map((hist) => (
                                  <tr key={hist.id} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={{ textAlign: "center", backgroundColor: "#fafafa", verticalAlign: "middle", padding: "10px", fontSize: "13px", fontWeight: "500" }}>{hist.timestamp}</td>
                                    <td style={{ padding: "5px" }}>
                                      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }} cellPadding="6">
                                        <thead>
                                          <tr style={{ backgroundColor: "#95a9df", fontSize: "11px" }}>
                                            <th style={{ textAlign: "left", width: "25%" }}>Field Key</th>
                                            <th style={{ textAlign: "left", width: "35%" }}>Previous Value</th>
                                            <th style={{ textAlign: "left", width: "35%" }}>Current Value</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {hist.displayKeys.map(key => (
                                            <tr key={key} style={{ borderBottom: "1px solid #f1f1f1" }}>
                                              <td style={{ fontWeight: "bold", color: "#555", textTransform: "capitalize" }}>{key}</td>
                                              <td style={{ color: "#bd2130", backgroundColor: hist.previousData ? "#fff5f5" : "transparent", verticalAlign: "middle" }}>
                                                {hist.previousData ? formatValue(key, hist.previousData[key]) : <i style={{ color: "#999" }}>-</i>}
                                              </td>
                                              <td style={{ color: "#1e7e34", fontWeight: "600", backgroundColor: "#f4fff5", verticalAlign: "middle" }}>
                                                {formatValue(key, hist.currentData[key])}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <h4 style={{ margin: "20px 0 10px 0", borderBottom: "2px solid #eee", paddingBottom: "5px", color: "#555" }}>Salary Records</h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {Object.values(company.salaries).map((sal) => {
                              const isSalExpanded = expandedSalary === sal.id;
                              return (
                                <div key={sal.id} style={{ border: "1px solid #eee", borderRadius: "6px", overflow: "hidden" }}>
                                  <div
                                    onClick={() => setExpandedSalary(isSalExpanded ? null : sal.id)}
                                    style={{ padding: "10px", backgroundColor: "#f1f3f5", cursor: "pointer", display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600" }}
                                  >
                                    <span>Salary ({sal.currentAmount})</span>
                                    <span style={{ color: sal.currentStatus === "Delete" ? "#dc3545" : "#28a745" }}>
                                      {sal.currentStatus} {isSalExpanded ? "▼" : "▶"}
                                    </span>
                                  </div>

                                  {isSalExpanded && (
                                    <div style={{ padding: "10px", backgroundColor: "#fafafa", overflowX: "auto" }}>
                                      <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", borderColor: "#ddd" }}>
                                        <thead>
                                          <tr style={{ backgroundColor: "#d0e1fd", color: "#333" }}>
                                            <th style={{ width: "30%", textAlign: "center" }}>Date & Time</th>
                                            <th style={{ width: "70%" }}>Data</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {sal.history.map((hist) => {
                                            const keysToRender = hist.displayKeys.length > 0 
                                              ? hist.displayKeys 
                                              : Object.keys(hist.currentData).filter(k => ["salary", "salarystatus", "amount"].includes(k.toLowerCase()));

                                            return (
                                              <tr key={hist.id} style={{ borderBottom: "1px solid #eee", backgroundColor: "#fff" }}>
                                                <td style={{ textAlign: "center", backgroundColor: "#fafafa", verticalAlign: "middle", padding: "10px", fontSize: "13px", fontWeight: "500" }}>{hist.timestamp}</td>
                                                <td style={{ padding: "5px" }}>
                                                  <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }} cellPadding="6">
                                                    <thead>
                                                      <tr style={{ backgroundColor: "#98b6e1", fontSize: "11px" }}>
                                                        <th style={{ textAlign: "left", width: "25%" }}>Field Key</th>
                                                        <th style={{ textAlign: "left", width: "35%" }}>Previous Value</th>
                                                        <th style={{ textAlign: "left", width: "35%" }}>Current Value</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {keysToRender.map(key => (
                                                        <tr key={key} style={{ borderBottom: "1px solid #f1f1f1" }}>
                                                          <td style={{ fontWeight: "bold", color: "#555", textTransform: "capitalize" }}>{key.replace(/status/g, " Status")}</td>
                                                          <td style={{ color: "#bd2130", backgroundColor: hist.previousData ? "#fff5f5" : "transparent", verticalAlign: "middle" }}>
                                                            {hist.previousData ? formatValue(key, hist.previousData[key]) : <i style={{ color: "#999" }}>-</i>}
                                                          </td>
                                                          <td style={{ color: "#1e7e34", fontWeight: "600", backgroundColor: "#f4fff5", verticalAlign: "middle" }}>
                                                            {formatValue(key, hist.currentData[key])}
                                                          </td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", borderColor: "#ddd" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#d0e1fd", color: "#333" }}>
                      <th style={{ width: "30%", textAlign: "center" }}>Date & Time</th>
                      <th style={{ width: "70%" }}>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTimelineProcessedRecords().map(({ record, currentData, previousData, changedKeys }) => (
                      <tr key={record.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ textAlign: "center", backgroundColor: "#fafafa", verticalAlign: "middle", padding: "10px", fontSize: "13px", fontWeight: "500" }}>
                          {record.created_at ? new Date(record.created_at).toLocaleString("en-GB") : "-"}
                        </td>
                        <td style={{ padding: "5px" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }} cellPadding="6">
                            <thead>
                              <tr style={{ backgroundColor: "#98b6e1", fontSize: "11px" }}>
                                <th style={{ textAlign: "left", width: "25%" }}>Field Key</th>
                                <th style={{ textAlign: "left", width: "35%" }}>Previous Value</th>
                                <th style={{ textAlign: "left", width: "35%" }}>Current Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {changedKeys.map(key => (
                                <tr key={key} style={{ borderBottom: "1px solid #f1f1f1" }}>
                                  <td style={{ fontWeight: "bold", color: "#555", textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</td>
                                  <td style={{ color: "#bd2130", backgroundColor: previousData ? "#fff5f5" : "transparent", verticalAlign: "middle" }}>
                                    {previousData ? formatValue(key, previousData[key]) : <i style={{ color: "#999" }}>-</i>}
                                  </td>
                                  <td style={{ color: "#1e7e34", fontWeight: "600", backgroundColor: "#f4fff5", verticalAlign: "middle" }}>
                                    {formatValue(key, currentData[key])}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;