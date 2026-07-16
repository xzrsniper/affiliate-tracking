export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const setUser = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const isSuperAdmin = () => {
  const user = getUser();
  return user?.role === 'super_admin';
};

// Impersonation helpers
export const saveAdminSession = () => {
  const token = getAuthToken();
  const user = getUser();
  if (token && user) {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(user));
  }
};

export const restoreAdminSession = () => {
  const adminToken = localStorage.getItem('adminToken');
  const adminUser = localStorage.getItem('adminUser');
  if (adminToken && adminUser) {
    localStorage.setItem('token', adminToken);
    localStorage.setItem('user', adminUser);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    return JSON.parse(adminUser);
  }
  return null;
};

export const isImpersonating = () => {
  return !!localStorage.getItem('adminToken');
};

export const getAdminUser = () => {
  const raw = localStorage.getItem('adminUser');
  return raw ? JSON.parse(raw) : null;
};
