import { useEffect, useState } from "react";

function Users() {

  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    pincode: "",
    status: ""
  });

  // ================= INPUT HANDLER =================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ================= FETCH USERS =================
  const fetchUsers = async () => {
    try {

      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      setUsers(data.data || []);

    } catch (error) {
      console.log(error);
    }
  };

  // ================= VIEW USER DETAIL (JOIN API) =================
  const viewUser = async (userId) => {

    try {

      const res = await fetch(
        `http://localhost:5000/user/${userId}/address`
      );

      const data = await res.json();

      setSelectedUser(data.data);

    } catch (error) {
      console.log(error);
    }
  };

  // ================= UPDATE USER =================
  const updateUser = async (id) => {

    try {

      const token = localStorage.getItem("token");

      await fetch(`http://localhost:5000/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      fetchUsers();
      setEditUser(null);

    } catch (error) {
      console.log(error);
    }
  };

  // ================= DELETE USER =================
  const deleteUser = async (id) => {

    try {

      const token = localStorage.getItem("token");

      await fetch(`http://localhost:5000/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      fetchUsers();

    } catch (error) {
      console.log(error);
    }
  };

  // ================= USE EFFECT =================
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div style={{ padding: "20px" }}>

      <h2>User List</h2>

      {/* ================= TABLE ================= */}
      <table border="1" cellPadding="10" width="100%">

        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Pincode</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id}>

              {editUser === u.id ? (
                <>
                  <td>
                    <input name="name" value={formData.name} onChange={handleChange} />
                  </td>

                  <td>
                    <input name="email" value={formData.email} onChange={handleChange} />
                  </td>

                  <td>
                    <input name="mobile" value={formData.mobile} onChange={handleChange} />
                  </td>

                  <td>
                    <input name="pincode" value={formData.pincode} onChange={handleChange} />
                  </td>

                  <td>
                    <input name="status" value={formData.status} onChange={handleChange} />
                  </td>

                  <td>
                    <button onClick={() => updateUser(u.id)}>Save</button>
                    <button onClick={() => setEditUser(null)}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.mobile}</td>
                  <td>{u.pincode}</td>
                  <td>{u.status}</td>

                  <td>

                    {/* VIEW */}
                    <button onClick={() => viewUser(u.id)}>
                      View
                    </button>

                    {/* EDIT */}
                    <button onClick={() => {
                      setEditUser(u.id);
                      setFormData({
                        name: u.name,
                        email: u.email,
                        mobile: u.mobile,
                        pincode: u.pincode,
                        status: u.status
                      });
                    }}>
                      Edit
                    </button>

                    {/* DELETE */}
                    <button onClick={() => deleteUser(u.id)}>
                      Delete
                    </button>

                  </td>
                </>
              )}

            </tr>
          ))}
        </tbody>

      </table>

      {/* ================= USER DETAIL SECTION ================= */}
      <h2 style={{ marginTop: "30px" }}>User Detail</h2>

      {selectedUser ? (
        <div style={{
          border: "2px solid black",
          padding: "15px",
          marginTop: "10px"
        }}>

          <p><b>Name:</b> {selectedUser.name}</p>
          <p><b>Email:</b> {selectedUser.email}</p>
          <p><b>Address:</b> {selectedUser.address}</p>
          <p><b>City:</b> {selectedUser.city_name}</p>
          <p><b>Address Type:</b> {selectedUser.address_type}</p>

        </div>
      ) : (
        <p>No user selected</p>
      )}

    </div>
  );
}

export default Users;