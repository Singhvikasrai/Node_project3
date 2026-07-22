/** Application-wide backend configuration. */
export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:5000")
  .replace(/\/+$/, "");

const createUrl = (path) => `${API_BASE_URL}${path}`;

/** Keep every API endpoint in one discoverable place. */
export const apiRoutes = {
  login: createUrl("/login"),
  register: createUrl("/register"),
  users: (query = "") => createUrl(`/users${query}`),
  user: (id) => createUrl(`/users/${id}`),
  userDetails: (id) => createUrl(`/address/${id}`),
  states: createUrl("/state"),
  cities: (stateId) => createUrl(`/city?${new URLSearchParams({ state_id: stateId })}`),
  audit: (userId) => createUrl(userId ? `/audit?${new URLSearchParams({ userId })}` : "/audit"),
  createAudit: createUrl("/api/audit"),
  pending: createUrl("/pending"),
  pendingEditStatus: createUrl("/pending/edit-status"),
  approvePending: (id) => createUrl(`/pending/${id}/approve`),
  rejectPending: (id) => createUrl(`/pending/${id}/reject`),
};
