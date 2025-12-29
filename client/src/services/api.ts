import axios from 'axios';
import { auth } from '../firebaseConfig';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthToken = async () => {
    if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
    }
    return null;
};

export const uploadBundle = async (files: File[], metadata: any) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('metadata', JSON.stringify(metadata));

    const token = await getAuthToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    const response = await axios.post(`${API_URL}/process-bundle`, formData, config);
    return response.data;
};

export const getCase = async (id: string) => {
    const token = await getAuthToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    const response = await axios.get(`${API_URL}/case/${id}`, config);
    return response.data;
};

export const listCases = async (page = 1, limit = 9) => {
    const token = await getAuthToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await axios.get(`${API_URL}/cases?page=${page}&limit=${limit}`, config);
    return response.data;
};

export const syncUserInfo = async () => {
    console.log("Attempting to sync user info...");
    const token = await getAuthToken();
    if (!token) {
        console.log("Sync skipped: No token available.");
        return;
    }
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
        console.log(`Posting to ${API_URL}/sync-user`);
        const res = await axios.post(`${API_URL}/sync-user`, {}, config);
        console.log("User sync response:", res.data);
    } catch (error) {
        console.warn("Failed to sync user info", error);
    }
};
