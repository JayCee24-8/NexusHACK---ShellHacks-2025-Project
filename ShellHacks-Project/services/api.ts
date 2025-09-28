// This utility function centralizes API calls.

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

async function api<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const options: RequestInit = {
    method,
    credentials: 'include', // Send cookies for session-based auth
    headers: {},
  };

  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  // The base path is now set to the user's local backend development server.
  const API_BASE_URL = 'http://localhost:4000';

  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    // Try to parse a structured error response from the backend.
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // If the response isn't JSON, create a generic error.
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    // Create an error object with the message and code from the backend.
    const error = new Error(errorData.message || errorData.error || 'An unknown API error occurred');
    (error as any).code = errorData.code;
    (error as any).status = response.status;
    throw error;
  }

  // Handle successful responses that don't have a body (e.g., 204 No Content).
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export default api;
