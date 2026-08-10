(function () {
  var isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(window.location.origin);
  var base = window.CUSTOM_API_BASE || (isLocal ? 'http://localhost:3000' : 'https://elevixor.onrender.com');
  window.API_BASE = base;
  window.getAuthToken = function () {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
  };

  window.isAuthenticated = function () {
    return !!window.getAuthToken();
  };

  window.clearAuth = function () {
    try {
      sessionStorage.removeItem('loggedIn');
      localStorage.removeItem('loggedIn');
      sessionStorage.removeItem('userEmail');
      localStorage.removeItem('userEmail');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userFirstName');
      localStorage.removeItem('userLastName');
      localStorage.removeItem('userAvatarData');
      localStorage.removeItem('userAge');
      localStorage.removeItem('userGender');
      localStorage.removeItem('userContact');
      localStorage.removeItem('userWhatsApp');
    } catch (e) {
      console.warn('Failed to clear auth storage', e);
    }
  };

  window.authFetch = function (path, options = {}) {
    const resolvedPath = path.startsWith('http://') || path.startsWith('https://') ? path : base + path;
    const headers = Object.assign({}, options.headers || {});
    const token = window.getAuthToken();
    if (token) {
      headers.Authorization = 'Bearer ' + token;
    }
    return fetch(resolvedPath, Object.assign({}, options, { headers }));
  };
})();
