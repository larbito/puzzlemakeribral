import { getAuth } from 'firebase/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

async function getAuthHeaders() {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function generateImage(prompt: string, style?: string, format: string = 'png') {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/generate-image`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, style, format }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate image');
  }

  return response.json();
}

export async function uploadFile(file: File, storage: 's3' | 'cloudinary' = 's3') {
  const headers = await getAuthHeaders();
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });

  const response = await fetch(`${API_URL}/api/files/upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      file: {
        name: file.name,
        type: file.type,
        data: base64,
      },
      storage,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload file');
  }

  return response.json();
}

export async function downloadFile(key: string, storage: 's3' | 'cloudinary' = 's3') {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/files/download/${key}?storage=${storage}`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to download file');
  }

  if (storage === 'cloudinary') {
    return response.json();
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = key.split('/').pop() || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function verifyAuth() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/auth/verify`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to verify authentication');
  }

  return response.json();
}

export async function getCurrentUser() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/auth/user`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get user data');
  }

  return response.json();
} 