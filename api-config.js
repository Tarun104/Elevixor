(function () {
  var isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(window.location.origin);
  var base = window.CUSTOM_API_BASE || (isLocal ? 'http://localhost:3000' : 'https://elevixor.onrender.com');
  window.API_BASE = base;

  // Keep Render backend awake — ping every 10 minutes
  if (!isLocal && base.indexOf('onrender.com') !== -1) {
    try {
      fetch(base + '/api/health').catch(function() {});
      setInterval(function() {
        fetch(base + '/api/health').catch(function() {});
      }, 600000);
    } catch (e) {}
  }
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
