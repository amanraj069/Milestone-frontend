/**
 * Lightweight GraphQL client using native fetch.
 * No need for Apollo Client keeps bundle size small
 * and avoids adding a heavy dependency for simple queries.
 */
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

export async function graphqlQuery(query, variables = {}) {
  const response = await fetch(`${API_BASE_URL}/graphql`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    const errorMessage = result.errors.map(e => e.message).join(', ');
    throw new Error(errorMessage);
  }

  return result.data;
}
