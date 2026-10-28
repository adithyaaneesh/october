
const API_URL = "http://127.0.0.1:8000";

export const authenticatedFetch = async (
  url,
  options = {},
  { onTokensUpdated, onSessionExpired } = {}
) => {
  const accessToken = localStorage.getItem("october_access_token");
  const refreshToken = localStorage.getItem("october_refresh_token");

  if (!accessToken && !refreshToken) {
    onSessionExpired?.();
    throw new Error("Please log in to continue.");
  }

  const sendRequest = (token) => {
    const headers = new Headers(options.headers || {});

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  let response = await sendRequest(accessToken);

  // No refresh needed if the request succeeded or failed for another reason.
  if (response.status !== 401) {
    return response;
  }

  if (!refreshToken) {
    onSessionExpired?.();
    return response;
  }

  // Attempt to refresh the expired access token.
  let refreshResponse;

  try {
    refreshResponse = await fetch(`${API_URL}/api/accounts/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
  } catch {
    // A network failure does not prove the refresh token is invalid.
    throw new Error("Unable to connect to the server. Please try again.");
  }

  if (!refreshResponse.ok) {
    localStorage.removeItem("october_access_token");
    localStorage.removeItem("october_refresh_token");
    onSessionExpired?.();
    return response;
  }

  const refreshData = await refreshResponse.json();

  if (!refreshData.access) {
    onSessionExpired?.();
    return response;
  }

  // Save the new access token.
  localStorage.setItem("october_access_token", refreshData.access);
  window.dispatchEvent(
  new CustomEvent("october:access-token-updated", {
    detail: { accessToken: refreshData.access },
  })
);

  // With token rotation enabled, save the replacement refresh token too.
  if (refreshData.refresh) {
    localStorage.setItem("october_refresh_token", refreshData.refresh);
  }

  onTokensUpdated?.(refreshData.access);

  // Retry the original request once using the new access token.
  response = await sendRequest(refreshData.access);

  if (response.status === 401) {
    localStorage.removeItem("october_access_token");
    localStorage.removeItem("october_refresh_token");
    onSessionExpired?.();
  }

  return response;
};
