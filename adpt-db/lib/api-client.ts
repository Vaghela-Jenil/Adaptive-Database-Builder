import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Example usage:
export const acceptFriendRequest = (requestId: string) => 
  apiClient.patch('/chat/friend-requests/accept', { requestId, action: 'accept' });