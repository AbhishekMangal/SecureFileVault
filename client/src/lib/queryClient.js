import { QueryClient } from '@tanstack/react-query';

async function throwIfResNotOk(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
}

export async function apiRequest(method, url, body) {
  const token = localStorage.getItem('token');
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    credentials: 'include'
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  const res = await fetch(url, options);
  await throwIfResNotOk(res);
  
  return res;
}

export const getQueryFn = ({ on401 = 'throw' } = {}) => async ({ queryKey }) => {
  const token = localStorage.getItem('token');
  const url = queryKey[0];
  
  const res = await fetch(url, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    credentials: 'include'
  });
  
  if (res.status === 401) {
    if (on401 === 'throw') {
      throw new Error('Unauthorized');
    } else {
      return null;
    }
  }
  
  await throwIfResNotOk(res);
  return await res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      queryFn: getQueryFn({ on401: 'throw' })
    }
  }
});