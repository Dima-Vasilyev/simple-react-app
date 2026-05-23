// Access token is stored in module memory (not localStorage) to prevent XSS theft.
// It is lost on page refresh but restored automatically via the refresh token cookie.
let _token = null;

export const getToken = () => _token;
export const setToken = (token) => { _token = token; };
