'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Plus, Smile, Paperclip, Search, User, X, Users, UserPlus, LogOut, Trash2, Download, Loader2, Circle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import axios from 'axios';
import { encryptMessage, decryptMessage, generateSharedKey, isEncrypted } from '@/lib/encryption';

interface Message {
  _id: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  type: 'text' | 'file' | 'emoji';
  timestamp: Date;
  file?: {
    name: string;
    url: string;
    size: number;
  };
}

interface Conversation {
  id: string;
  friend: {
    id: string;
    name: string;
    avatar?: string;
    status: 'online' | 'offline';
  };
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

export default function ChatPage() {
  const { currentTheme } = useTheme();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [userStatuses, setUserStatuses] = useState<Map<string, 'online' | 'offline'>>(new Map());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [chatTab, setChatTab] = useState<'direct' | 'groups'>('direct');
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedConversationRef = useRef<Conversation | null>(null);
  const selectedGroupRef = useRef<any | null>(null);

  const getMemberId = (member: any): string | undefined => {
    const rawId = member?.userId ?? member?.id ?? member?._id;
    return rawId?.toString?.() || rawId;
  };

  const getGroupId = (group: any): string => {
    const rawId = group?._id ?? group?.id;
    return rawId?.toString?.() || '';
  };

  const getGroupMemberStatus = (member: any): 'online' | 'offline' => {
    const memberId = getMemberId(member);
    if (!memberId) return 'offline';
    return userStatuses.get(memberId) || member?.status || 'offline';
  };

  const getOnlineGroupMemberCount = (group: any): number => {
    const members = group?.members || [];
    return members.filter((member: any) => getGroupMemberStatus(member) === 'online').length;
  };

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  // Initialize Socket.IO connection with current user
  useEffect(() => {
    const initSocket = async () => {
      try {
        // First, get the current user ID
        const currentUserResponse = await axios.get('/api/chat/current-user');
        const userData = currentUserResponse.data;
        
        setCurrentUserId(userData.userId);
        setCurrentUser(userData);

        // Initialize Socket.IO
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
        });

        // ============ CONNECTION EVENTS ============
        newSocket.on('connect', () => {
          console.log('✅ Connected to chat server with socket ID:', newSocket.id);
          newSocket.emit('user_connect', userData.userId);
          console.log(`📡 Emitted user_connect for ${userData.userId}`);

          const activeGroup = selectedGroupRef.current;
          if (activeGroup) {
            const activeGroupId = getGroupId(activeGroup);
            if (activeGroupId) {
              newSocket.emit('join_group', activeGroupId);
              console.log(`👥 Re-joined group room on connect: group_${activeGroupId}`);
            }
          }
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
        });

        newSocket.on('reconnect', () => {
          console.log('🔄 Reconnected to server');
          newSocket.emit('user_connect', userData.userId);

          const activeGroup = selectedGroupRef.current;
          if (activeGroup) {
            const activeGroupId = getGroupId(activeGroup);
            if (activeGroupId) {
              newSocket.emit('join_group', activeGroupId);
              console.log(`👥 Re-joined group room on reconnect: group_${activeGroupId}`);
            }
          }
        });

        // ============ MESSAGE EVENTS ============
        // Receive messages in real-time
        newSocket.on('receive_message', (message: Message) => {
          console.log('💬 Received message:', message);
          
          // Decrypt message if it's encrypted using userData.userId
          let decryptedContent = message.content;
          try {
            if (userData.userId && isEncrypted(message.content)) {
              const sharedKey = generateSharedKey(message.sender.id, userData.userId);
              decryptedContent = decryptMessage(message.content, sharedKey);
            }
          } catch (err) {
            console.error('Error decrypting message:', err);
            decryptedContent = message.content; // Fall back to encrypted
          }
          
          const incomingSenderId = message.sender?.id;
          const incomingSenderName = message.sender?.name || 'Unknown User';

          const decryptedMessage: Message = {
            ...message,
            sender: {
              ...message.sender,
              name: incomingSenderName,
            },
            content: decryptedContent
          };

          if (selectedConversationRef.current?.friend.id === incomingSenderId) {
            setMessages((prev) => {
              if (prev.some((m) => m._id === decryptedMessage._id)) {
                return prev;
              }
              return [...prev, decryptedMessage];
            });
          }
          
          // Update last message in conversation with sender name
          setConversations((prev) =>
            prev.map((conv) =>
              conv.friend.id === incomingSenderId
                ? {
                    ...conv,
                    lastMessage: `${incomingSenderName}: ${decryptedContent}`,
                    lastMessageTime: new Date(message.timestamp),
                  }
                : conv
            )
          );
        });

        // ============ CONVERSATION EVENTS ============
        // When new conversation created (friend request accepted)
        newSocket.on('new_conversation', (conversation: any) => {
          console.log('🆕 New conversation:', conversation);
          setConversations((prev) => {
            // Check if conversation already exists
            if (prev.find((c) => c.id === conversation.id)) {
              return prev;
            }
            return [conversation, ...prev];
          });
        });

        // Conversations list updated
        newSocket.on('conversations_updated', () => {
          console.log('🔄 Conversations updated, refreshing...');
          // Refresh conversations
          axios
            .get('/api/chat/conversations')
            .then((res) => setConversations(res.data))
            .catch((err) => console.error('Error refreshing conversations:', err));
        });

        // ============ USER STATUS EVENTS ============
        // User came online
        newSocket.on('user_online', (data: any) => {
          console.log(`🟢 ${data.userId} is online`);
          setUserStatuses((prev) => new Map(prev).set(data.userId, 'online'));
          
          // Update conversation with new status
          setConversations((prev) =>
            prev.map((conv) =>
              conv.friend.id === data.userId
                ? { ...conv, friend: { ...conv.friend, status: 'online' } }
                : conv
            )
          );
        });

        // User went offline
        newSocket.on('user_offline', (data: any) => {
          console.log(`🔴 ${data.userId} is offline`);
          setUserStatuses((prev) => new Map(prev).set(data.userId, 'offline'));
          
          // Update conversation with new status
          setConversations((prev) =>
            prev.map((conv) =>
              conv.friend.id === data.userId
                ? { ...conv, friend: { ...conv.friend, status: 'offline' } }
                : conv
            )
          );
        });

        // ============ MESSAGE DELIVERY CONFIRMATION ============
        newSocket.on('message_sent', (data: any) => {
          console.log('✅ Message confirmed sent:', data.id);
        });

        // ============ GROUP MESSAGE EVENTS ============
        newSocket.on('receive_group_message', (message: any) => {
          console.log('💬 Received group message:', message);

          let decryptedContent = message.content;
          try {
            const encryptionKey = `group_${message.groupId}`;
            if (message.content && isEncrypted(message.content)) {
              decryptedContent = decryptMessage(message.content, encryptionKey);
            }
          } catch (err) {
            console.error('❌ Error decrypting group message:', err);
          }

          const activeGroup = selectedGroupRef.current;
          const activeGroupId = getGroupId(activeGroup);
          if (!activeGroupId) {
            return;
          }

          const incomingGroupId = message.groupId?.toString?.() || message.groupId;
          const currentGroupId = activeGroupId?.toString?.() || activeGroupId;

          if (incomingGroupId !== currentGroupId) {
            return;
          }

          const timestamp = message.timestamp ? new Date(message.timestamp) : new Date();
          const normalizedMessage = {
            ...message,
            id: message.id || message._id,
            _id: message._id || message.id,
            sender: {
              id: typeof message.sender === 'string' ? message.sender : (message.sender?.id || message.sender?._id),
              name: message.sender?.name || message.senderName || 'Unknown User',
            },
            content: decryptedContent,
            timestamp,
          };

          setGroupMessages((prev) => {
            const incomingId = (normalizedMessage.id || normalizedMessage._id)?.toString?.();
            if (incomingId && prev.some((m) => (m.id || m._id)?.toString?.() === incomingId)) {
              return prev;
            }
            return [...prev, normalizedMessage];
          });
        });

        // ============ ERROR HANDLING ============
        newSocket.on('error', (error: any) => {
          console.error('Socket error:', error);
        });

        // ============ MESSAGE DELETION EVENTS - SET UP DURING SOCKET INIT ============
        newSocket.on('message_deleted', (data: any) => {
          const { messageId, type } = data;
          console.log(`🗑️ Message deleted via socket: ${messageId} (${type})`);

          if (type === 'direct') {
            setMessages((prev) => {
              const filtered = prev.filter((m) => {
                const mId = m._id?.toString();
                const targetId = messageId?.toString();
                return mId !== targetId;
              });
              console.log(`✅ Direct message removed - remaining: ${filtered.length}`);
              return filtered;
            });
          } else if (type === 'group') {
            setGroupMessages((prev) => {
              const filtered = prev.filter((m) => {
                const mId = (m.id || m._id)?.toString();
                const targetId = messageId?.toString();
                return mId !== targetId;
              });
              console.log(`✅ Group message removed - remaining: ${filtered.length}`);
              return filtered;
            });
          }
        });

        setSocket(newSocket);
        socketRef.current = newSocket;
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    initSocket();

    return () => {
      // Cleanup on unmount
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('Socket disconnected');
      }
    };
  }, []);

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // First, try to get conversations with messages
        const conversationResponse = await axios.get('/api/chat/conversations').catch(() => ({ data: [] }));
        let conversations = conversationResponse.data || [];
        
        console.log(`📨 Fetched ${conversations.length} conversations`);
        
        // Decrypt lastMessage if encrypted
        const decryptedConversations = conversations.map((conv: Conversation) => {
          if (conv.lastMessage && currentUserId) {
            try {
              if (isEncrypted(conv.lastMessage)) {
                const sharedKey = generateSharedKey(conv.friend.id, currentUserId);
                const decrypted = decryptMessage(conv.lastMessage, sharedKey);
                console.log(`✅ Decrypted lastMessage for ${conv.friend.name}`);
                return { ...conv, lastMessage: decrypted };
              }
            } catch (err) {
              console.error(`❌ Error decrypting lastMessage for ${conv.friend.name}:`, err);
              return conv;
            }
          }
          return conv;
        });
        
        // If no conversations, get all friends instead
        if (decryptedConversations.length === 0) {
          try {
            const friendsResponse = await axios.get('/api/chat/friends');
            console.log(`👥 No conversations, fetched ${friendsResponse.data?.length || 0} friends`);
            setConversations(friendsResponse.data || []);
          } catch (err) {
            console.error('Error fetching friends:', err);
            setConversations(decryptedConversations);
          }
        } else {
          setConversations(decryptedConversations);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    const fetchPendingRequests = async () => {
      try {
        const response = await axios.get('/api/chat/friend-requests');
        setPendingRequests(response.data);
      } catch (error) {
        console.error('Error fetching friend requests:', error);
      }
    };

    const fetchGroups = async () => {
      try {
        const response = await axios.get('/api/chat/groups');
        setGroups(response.data);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };

    fetchConversations();
    fetchPendingRequests();
    fetchGroups();

    const refreshInterval = setInterval(() => {
      fetchConversations();
      fetchPendingRequests();
      fetchGroups();
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, [currentUserId]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        try {
          const response = await axios.get(
            `/api/chat/messages?friendId=${selectedConversation.friend.id}`
          );
          const normalizedMessages: Message[] = response.data.map((msg: any) => {
            const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender?.id;
            const isCurrentUserSender = senderId === currentUserId;

            return {
              _id: msg._id,
              sender: {
                id: senderId,
                name: isCurrentUserSender
                  ? (currentUser?.userName || 'You')
                  : selectedConversation.friend.name,
                avatar: isCurrentUserSender
                  ? currentUser?.userImage
                  : selectedConversation.friend.avatar,
              },
              content: msg.content,
              type: msg.type,
              timestamp: new Date(msg.timestamp || msg.createdAt || new Date()),
              file: msg.fileUrl
                ? {
                    name: msg.fileName || 'File',
                    url: msg.fileUrl,
                    size: msg.fileSize || 0,
                  }
                : undefined,
            };
          });

          setMessages(normalizedMessages);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };

      fetchMessages();

      const refreshInterval = setInterval(fetchMessages, 4000);

      return () => clearInterval(refreshInterval);
    }

    setMessages([]);
  }, [selectedConversation, currentUserId, currentUser]);

  // Fetch group messages when group changes
  useEffect(() => {
    if (selectedGroup && socket) {
      const fetchGroupMessages = async () => {
        try {
          const groupId = getGroupId(selectedGroup);
          if (!groupId) return;
          console.log(`📥 Fetching messages for group: ${groupId}`);
          
          const response = await axios.get(
            `/api/chat/group-messages?groupId=${groupId}`
          );
          
          // Decrypt all fetched messages and normalize timestamps + IDs
          const encryptionKey = `group_${groupId}`;
          const decryptedMessages = response.data.map((msg: any) => {
            let content = msg.content;
            try {
              if (msg.content && isEncrypted(msg.content)) {
                content = decryptMessage(msg.content, encryptionKey);
              }
            } catch (err) {
              console.error('Error decrypting stored message:', err);
            }
            // Normalize timestamp: use createdAt from DB or timestamp
            const timestamp = msg.createdAt || msg.timestamp || new Date();
            // IMPORTANT: Normalize ID to always use 'id' property (convert _id to id for consistency)
            return { ...msg, id: (msg._id || msg.id), content, timestamp: new Date(timestamp) };
          });
          
          setGroupMessages(decryptedMessages);
          setGroupMembers(selectedGroup.members || []);
          
          console.log(`✅ Loaded ${decryptedMessages.length} messages`);
        } catch (error) {
          console.error('Error fetching group messages:', error);
        }
      };

      fetchGroupMessages();

      const groupId = getGroupId(selectedGroup);
      if (groupId) {
        socket.emit('join_group', groupId);
        console.log(`👥 Joined group room: group_${groupId}`);
      }

      const refreshInterval = setInterval(fetchGroupMessages, 3000);

      return () => {
        clearInterval(refreshInterval);
        if (socket) {
          const leaveGroupId = getGroupId(selectedGroup);
          if (leaveGroupId) {
            socket.emit('leave_group', leaveGroupId);
            console.log(`Left group room: group_${leaveGroupId}`);
          }
        }
      };
    }
  }, [selectedGroup, socket]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, groupMessages]);

  const handleSearch = async (query: string) => {
    if (query.trim().length > 0) {
      try {
        const response = await axios.get(`/api/chat/search-friends?q=${query}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error searching friends:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSendMessage = async () => {
    if (chatTab === 'groups') {
      return handleSendGroupMessage();
    }

    if (!messageInput.trim() || !selectedConversation || !socket || !currentUserId || !currentUser) return;

    const messageContent = messageInput;
    setMessageInput('');
    setIsSendingMessage(true);

    try {
      // Add message immediately to local state for sender (plaintext for display)
      const localMessage: Message = {
        _id: Date.now().toString(),
        sender: {
          id: currentUserId,
          name: currentUser.userName,
          avatar: currentUser.userImage,
        },
        content: messageContent,
        type: 'text',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, localMessage]);

      // Update lastMessage in conversations for sender
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.friend.id
            ? {
                ...conv,
                lastMessage: `${currentUser.userName}: ${messageContent}`,
                lastMessageTime: new Date(),
              }
            : conv
        )
      );

      // Save message to database (API will encrypt it) and get real _id
      const apiResponse = await axios.post('/api/chat/messages', {
        receiverId: selectedConversation.friend.id,
        content: messageContent,
        type: 'text',
      });
      
      // Update local message with real MongoDB _id from API response
      const realMessageId = apiResponse.data._id;
      setMessages((prev) => {
        return prev.map((msg) => 
          msg._id === localMessage._id 
            ? { ...msg, _id: realMessageId }
            : msg
        );
      });

      // Encrypt message for socket transmission using shared key
      const sharedKey = generateSharedKey(currentUserId, selectedConversation.friend.id);
      const encryptedContent = encryptMessage(messageContent, sharedKey);

      // Emit encrypted message through socket for real-time delivery
      socket.emit('send_message', {
        senderId: currentUserId,
        receiverId: selectedConversation.friend.id,
        senderName: currentUser.userName,
        content: encryptedContent,
        type: 'text',
        timestamp: new Date(),
      });

      console.log(` Sent encrypted message to ${selectedConversation.friend.id}`);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
      setMessageInput(messageContent); // Restore input on error
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (chatTab === 'groups') {
      if (!selectedGroup || !socket || !currentUserId || !currentUser) return;

      setSelectedFile(file);
      setIsUploadingFile(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        const groupId = getGroupId(selectedGroup);
        if (!groupId) {
          alert('Invalid group selected');
          setSelectedFile(null);
          return;
        }

        formData.append('groupId', groupId);

        const response = await axios.post('/api/chat/upload', formData);

        const fileMessage: any = {
          id: Date.now().toString(),
          sender: { id: currentUserId, name: currentUser.userName },
          content: `📎 ${file.name}`,
          type: 'file',
          timestamp: new Date(),
          file: {
            name: file.name,
            url: response.data.url,
            size: file.size,
          },
        };

        setGroupMessages((prev) => [...prev, fileMessage]);
        setSelectedFile(null);

        // Save file message to database to get real _id
        const fileDbResponse = await axios.post('/api/chat/group-messages', {
          groupId,
          content: `📎 ${file.name}`,
          type: 'file',
          fileUrl: response.data.url,
          fileName: file.name,
          fileSize: file.size,
        });

        // Update local message with real MongoDB _id from API response
        const realFileMessageId = fileDbResponse.data._id;
        setGroupMessages((prev) => {
          return prev.map((msg) =>
            msg.id === fileMessage.id
              ? { ...msg, id: realFileMessageId, _id: realFileMessageId }
              : msg
          );
        });
        console.log(`Group file message saved with real ID: ${realFileMessageId}`);

        const encryptionKey = `group_${groupId}`;
        const encryptedFileName = encryptMessage(file.name, encryptionKey);

        socket.emit('send_group_message', {
          id: realFileMessageId,
          groupId,
          senderId: currentUserId,
          senderName: currentUser.userName,
          content: `📎 ${encryptedFileName}`,
          type: 'file',
          fileUrl: response.data.url,
          fileName: encryptedFileName,
          fileSize: file.size,
          timestamp: new Date(),
        });

        console.log(` Sent encrypted file to group ${groupId}`);
      } catch (error) {
        console.error('Error uploading file to group:', error);
        alert('Failed to upload file');
        setSelectedFile(null);
      } finally {
        setIsUploadingFile(false);
      }
    } else {
      if (!selectedConversation || !socket || !currentUserId || !currentUser) return;

      setSelectedFile(file);
      setIsUploadingFile(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('receiverId', selectedConversation.friend.id);

        const response = await axios.post('/api/chat/upload', formData);

        // Add file message immediately to local state for sender (with temp ID)
        const fileMessage: Message = {
          _id: Date.now().toString(),
          sender: {
            id: currentUserId,
            name: currentUser.userName,
            avatar: currentUser.userImage,
          },
          content: `📎 ${file.name}`,
          type: 'file',
          timestamp: new Date(),
          file: {
            name: file.name,
            url: response.data.url,
            size: file.size,
          },
        };

        setMessages((prev) => [...prev, fileMessage]);
        setSelectedFile(null);

        // Save file message to database to get real _id
        const fileDbResponse = await axios.post('/api/chat/messages', {
          receiverId: selectedConversation.friend.id,
          content: `📎 ${file.name}`,
          type: 'file',
          fileUrl: response.data.url,
          fileName: file.name,
          fileSize: file.size,
        });

        // Update local message with real MongoDB _id from API response
        const realFileMessageId = fileDbResponse.data._id;
        setMessages((prev) => {
          return prev.map((msg) =>
            msg._id === fileMessage._id
              ? { ...msg, _id: realFileMessageId }
              : msg
          );
        });
        console.log(`✅ File message saved with real ID: ${realFileMessageId}`);

        // Encrypt file metadata for socket transmission
        const sharedKey = generateSharedKey(currentUserId, selectedConversation.friend.id);
        const encryptedFileName = encryptMessage(file.name, sharedKey);

        // Emit encrypted file message through socket
        socket.emit('send_message', {
          senderId: currentUserId,
          receiverId: selectedConversation.friend.id,
          senderName: currentUser.userName,
          content: `📎 ${encryptedFileName}`,
          type: 'file',
          fileUrl: response.data.url,
          fileName: encryptedFileName,
          fileSize: file.size,
          timestamp: new Date(),
        });

        console.log(`📤 Sent encrypted file to ${selectedConversation.friend.id}`);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file');
        setSelectedFile(null);
      } finally {
        setIsUploadingFile(false);
      }
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      console.log(`📤 Sending friend request to user: ${userId}`);
      
      await axios.post('/api/chat/friend-requests', {
        receiverId: userId
      });
      
      setSearchQuery('');
      setSearchResults([]);
      alert('✅ Friend request sent!');
      console.log(`✅ Friend request sent successfully`);
    } catch (error: any) {
      console.error('❌ Error sending friend request:', error);
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send friend request';
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!socket || !currentUserId) {
      alert('Socket not connected');
      return;
    }

    try {
      const response = await axios.patch('/api/chat/friend-requests/accept', {
        requestId,
        action: 'accept'
      });

      const { sender, accepter } = response.data;

      // Remove request from pending list
      setPendingRequests(pendingRequests.filter(r => r._id !== requestId));

      // Emit socket event to notify both users of new conversation
      socket.emit('friend_request_accepted', {
        senderId: sender.id,
        senderName: sender.name,
        senderImage: sender.image,
        accepterId: accepter.id,
        accepterName: accepter.name,
        accepterImage: accepter.image,
      });

      console.log(`🤝 Friend request accepted, socket event emitted`);
      alert('Friend request accepted! New conversation created.');
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await axios.patch('/api/chat/friend-requests/accept', {
        requestId,
        action: 'reject'
      });
      setPendingRequests(pendingRequests.filter(r => r._id !== requestId));
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      alert('Please enter group name and select members');
      return;
    }

    try {
      const response = await axios.post('/api/chat/groups', {
        name: groupName,
        memberIds: selectedMembers,
      });

      setGroups((prev) => [response.data, ...prev]);
      setGroupName('');
      setSelectedMembers([]);
      setShowCreateGroup(false);
      alert('✅ Group created!');
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    }
  };

  const handleSendGroupMessage = async () => {
    if (!messageInput.trim() || !selectedGroup || !socket || !currentUserId || !currentUser) {
      console.warn('❌ Cannot send group message - missing required data');
      return;
    }

    const messageContent = messageInput;
    const groupId = getGroupId(selectedGroup);
    if (!groupId) {
      console.warn('❌ Invalid group id');
      return;
    }
    setMessageInput('');
    setIsSendingMessage(true);

    try {
      console.log(`📤 Sending message to group: ${groupId}`);
      
      // Add message immediately to local state (plaintext for display)
      const messageId = Date.now().toString();
      const localMessage: any = {
        id: messageId,
        sender: { id: currentUserId, name: currentUser.userName },
        content: messageContent,
        type: 'text',
        timestamp: new Date(),
      };

      setGroupMessages((prev) => [...prev, localMessage]);
      console.log('✅ Message added to local state with ID:', messageId);

      // Ensure user is in group room BEFORE saving
      socket.emit('join_group', groupId);
      console.log(`👥 Joined group room before sending: group_${groupId}`);

      // Save encrypted message to database
      await axios.post('/api/chat/group-messages', {
        groupId,
        content: messageContent,
        type: 'text',
      });
      console.log('✅ Message saved to database');

      // Encrypt for socket transmission
      const encryptionKey = `group_${groupId}`;
      const encryptedContent = encryptMessage(messageContent, encryptionKey);
      
      // Send encrypted message through socket
      socket.emit('send_group_message', {
        id: messageId,
        groupId,
        senderId: currentUserId,
        senderName: currentUser.userName,
        content: encryptedContent,
        type: 'text',
      });

      console.log(`📤 Sent encrypted group message to room: group_${groupId}`);
    } catch (error: any) {
      console.error('Error sending group message:', error);
      setMessageInput(messageContent);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleAddMemberToGroup = async (memberId: string) => {
    if (!selectedGroup) return;

    try {
      const groupId = getGroupId(selectedGroup);
      if (!groupId) {
        alert('Invalid group selected');
        return;
      }

      const response = await axios.patch(
        `/api/chat/groups/${groupId}/members`,
        { action: 'add', memberId }
      );

      setSelectedGroup(response.data);
      setGroups((prev) => prev.map((g) => (getGroupId(g) === groupId ? response.data : g)));
      setGroupMembers(response.data.members || []);
      alert('✅ Member added!');
    } catch (error: any) {
      console.error('Error adding member:', error);
      alert(error.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMemberFromGroup = async (memberId: string) => {
    if (!selectedGroup) return;

    try {
      const response = await axios.patch(
        `/api/chat/groups/${selectedGroup._id || selectedGroup.id}/members`,
        { action: 'remove', memberId }
      );

      setSelectedGroup(response.data);
      setGroupMembers(response.data.members || []);
      alert('✅ Member removed!');
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  const handleExitGroup = async () => {
    if (!selectedGroup) return;

    if (confirm('Are you sure you want to exit this group?')) {
      try {
        const groupId = getGroupId(selectedGroup);
        if (!groupId) {
          alert('Invalid group selected');
          return;
        }
        console.log(`👋 Exiting group: ${groupId}`);
        
        await axios.delete(`/api/chat/groups/${groupId}`);
        console.log(`✅ API delete successful`);
        
        // Leave socket room
        if (socket) {
          socket.emit('leave_group', groupId);
          console.log(`👋 Left socket room: group_${groupId}`);
        }
        
        // Clear UI state
        setGroups((prev) => {
          const filtered = prev.filter((g) => (g._id || g.id) !== groupId);
          console.log(`📋 Updated groups list - remaining: ${filtered.length}`);
          return filtered;
        });
        
        setGroupMessages([]);
        setSelectedGroup(null);
        
        console.log(`✅ Successfully exited group`);
        alert('✅ You left the group');
      } catch (error: any) {
        console.error('Error exiting group:', error);
        alert('Failed to exit group: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleDeleteGroupMessage = async (messageId: string) => {
    if (!messageId) {
      console.warn('❌ No message ID provided');
      return;
    }
    try {
      console.log(`🗑️ Deleting group message: ${messageId}`);
      const response = await axios.delete(`/api/chat/group-messages/${messageId}`);
      console.log(`✅ Delete API response:`, response.data);
      
      // Remove from local state immediately
      setGroupMessages((prev) => {
        const filtered = prev.filter((m) => {
          const mId = (m.id || m._id)?.toString();
          const targetId = messageId.toString();
          return mId !== targetId;
        });
        console.log(`✅ Group message deleted locally - remaining: ${filtered.length}`);
        return filtered;
      });

      // Broadcast deletion to all users in group via socket
      if (socket && selectedGroup) {
        const groupId = selectedGroup._id || selectedGroup.id;
        socket.emit('delete_message', {
          messageId,
          conversationId: groupId,
          type: 'group'
        });
        console.log(`📡 Broadcasted message deletion to group: ${groupId}`);
      }
    } catch (error: any) {
      console.error('❌ Error deleting group message:', error.response?.data || error.message);
      alert('Failed to delete message: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!messageId) {
      console.warn('❌ No message ID provided');
      return;
    }
    try {
      console.log(`🗑️ Deleting direct message: ${messageId}`);
      
      // Call delete API for direct messages
      const response = await axios.delete(`/api/chat/messages/${messageId}`);
      console.log(`✅ Delete API response:`, response.data);
      
      // Remove from local state immediately
      setMessages((prev) => {
        const filtered = prev.filter((m) => m._id !== messageId);
        console.log(`✅ Direct message deleted - remaining: ${filtered.length}`);
        return filtered;
      });

      // Broadcast deletion to conversation partner via socket
      if (socket && selectedConversation) {
        socket.emit('delete_message', {
          messageId,
          conversationId: selectedConversation.friend.id,
          type: 'direct'
        });
        console.log(`📡 Broadcasted message deletion to: ${selectedConversation.friend.id}`);
      }
    } catch (error: any) {
      console.error('❌ Error deleting direct message:', error.response?.data || error.message);
      alert('Failed to delete message: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteAllGroupMessages = async () => {
    if (!selectedGroup) return;

    if (confirm('Delete all your messages in this group?')) {
      try {
        await axios.delete(
          `/api/chat/group-messages/temp?deleteAll=true&groupId=${selectedGroup._id || selectedGroup.id}`
        );
        setGroupMessages((prev) => prev.filter((m) => m.sender.id !== currentUserId && m.sender !== currentUserId));
        alert('✅ All messages deleted!');
      } catch (error) {
        console.error('Error deleting messages:', error);
        alert('Failed to delete messages');
      }
    }
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: currentTheme.background }}
    >
      {/* Sidebar - Conversations */}
      <div
        className="w-80 border-r flex flex-col overflow-hidden"
        style={{
          borderColor: currentTheme.border,
          backgroundColor: currentTheme.surface,
        }}
      >
        {/* Header */}
        <div className="p-4 border-b shrink-0" style={{ borderColor: currentTheme.border }}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
              Messages
            </h1>
            {pendingRequests.length > 0 && (
              <button
                onClick={() => setShowRequests(!showRequests)}
                className="relative px-3 py-1 rounded-lg text-sm font-semibold transition"
                style={{
                  backgroundColor: currentTheme.primary,
                  color: 'white'
                }}
              >
                Requests ({pendingRequests.length})
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setChatTab('direct')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                chatTab === 'direct'
                  ? 'text-white'
                  : ''
              }`}
              style={{
                backgroundColor: chatTab === 'direct' ? currentTheme.primary : currentTheme.input,
                color: chatTab === 'direct' ? 'white' : currentTheme.text,
              }}
            >
              Direct
            </button>
            <button
              onClick={() => setChatTab('groups')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                chatTab === 'groups'
                  ? 'text-white'
                  : ''
              }`}
              style={{
                backgroundColor: chatTab === 'groups' ? currentTheme.primary : currentTheme.input,
                color: chatTab === 'groups' ? 'white' : currentTheme.text,
              }}
            >
              Groups
            </button>
            {chatTab === 'groups' && (
              <button
                onClick={() => setShowCreateGroup(true)}
                className="ml-auto px-3 py-2 rounded-lg text-sm font-semibold transition"
                style={{
                  backgroundColor: currentTheme.primary,
                  color: 'white'
                }}
              >
                + New Group
              </button>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              onFocus={() => setShowSearch(true)}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: currentTheme.input,
                borderColor: currentTheme.border,
                color: currentTheme.text,
              }}
            />
            <Search
              size={18}
              className="absolute right-3 top-2.5"
              style={{ color: currentTheme.textSecondary }}
            />
          </div>

          {/* Search Results */}
          {showSearch && searchResults.length > 0 && (
            <div
              className="w-80 absolute top-40 left-0 right-0 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
              style={{
                backgroundColor: currentTheme.surface,
                borderColor: currentTheme.border,
              }}
            >
              {searchResults.map((user: any) => (
                <div
                  key={user.id}
                  className="p-3 hover:bg-opacity-50 cursor-pointer border-b flex items-center justify-between"
                  style={{
                    backgroundColor: currentTheme.surface,
                    borderColor: currentTheme.border,
                  }}
                  onClick={() => handleSendFriendRequest(user.id)}
                >
                  <div className="flex items-center gap-2">
                    <User size={20} style={{ color: currentTheme.primary }} />
                    <span style={{ color: currentTheme.text }}>{user.name}</span>
                  </div>
                  <Plus
                    size={20}
                    className="cursor-pointer hover:opacity-70"
                    style={{ color: currentTheme.primary }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Pending Friend Requests */}
          {showRequests && pendingRequests.length > 0 && (
            <div
              className="absolute top-32 left-0 right-0 bg-white border rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto"
              style={{
                backgroundColor: currentTheme.surface,
                borderColor: currentTheme.border,
              }}
            >
              <div className="p-3 font-semibold" style={{ color: currentTheme.text }}>
                Friend Requests
              </div>
              {pendingRequests.map((request: any) => (
                <div
                  key={request._id}
                  className="p-3 border-b"
                  style={{
                    backgroundColor: currentTheme.surface,
                    borderColor: currentTheme.border,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {request.sender.userImage ? (
                        <img
                          src={request.sender.userImage}
                          alt={request.sender.userName}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <User size={20} style={{ color: currentTheme.primary }} />
                      )}
                      <span style={{ color: currentTheme.text }}>{request.sender.userName}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request._id)}
                        className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600 transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request._id)}
                        className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {chatTab === 'direct' ? (
            conversations.length === 0 ? (
              <div className="p-8 text-center" style={{ color: currentTheme.textSecondary }}>
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Search and add friends to start chatting</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="p-3 border-b cursor-pointer hover:bg-opacity-50 transition"
                  style={{
                    backgroundColor:
                      selectedConversation?.id === conversation.id
                        ? currentTheme.primary
                        : currentTheme.surface,
                    borderColor: currentTheme.border,
                    color:
                      selectedConversation?.id === conversation.id
                        ? 'white'
                        : currentTheme.text,
                  }}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    setSelectedGroup(null);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor:
                            conversation.friend.status === 'online'
                              ? '#10b981'
                              : '#6b7280',
                        }}
                      >
                        {conversation.friend.avatar ? (
                          <img
                            src={conversation.friend.avatar}
                            alt={conversation.friend.name}
                            className="w-full h-full rounded-full"
                          />
                        ) : (
                          <User size={20} style={{ color: 'white' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{conversation.friend.name}</p>
                        <p className="text-sm opacity-75 truncate">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div
                        className="px-2 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: currentTheme.primary, color: 'white' }}
                      >
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            groups.length === 0 ? (
              <div className="p-8 text-center" style={{ color: currentTheme.textSecondary }}>
                <p>No groups yet</p>
                <p className="text-sm mt-2">Create a new group to start chatting</p>
              </div>
            ) : (
              groups.map((group) => (
                <div
                  key={group._id || group.id}
                  className="p-3 border-b cursor-pointer hover:bg-opacity-50 transition"
                  style={{
                    backgroundColor:
                      selectedGroup?._id === group._id || selectedGroup?.id === group.id
                        ? currentTheme.primary
                        : currentTheme.surface,
                    borderColor: currentTheme.border,
                    color:
                      selectedGroup?._id === group._id || selectedGroup?.id === group.id
                        ? 'white'
                        : currentTheme.text,
                  }}
                  onClick={() => {
                    setSelectedGroup(group);
                    setSelectedConversation(null);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: currentTheme.primary }}
                      >
                        <User size={20} style={{ color: 'white' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{group.name}</p>
                        <p className="text-sm opacity-75">
                          {group.members?.length || 0} members
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedConversation || selectedGroup ? (
          <>
            {/* Chat Header */}
            <div
              className="p-4 border-b flex items-center justify-between shrink-0"
              style={{
                backgroundColor: currentTheme.surface,
                borderColor: currentTheme.border,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: selectedGroup ? currentTheme.primary : '#3b82f6' }}>
                  {selectedConversation && selectedConversation.friend.avatar ? (
                    <img
                      src={selectedConversation.friend.avatar}
                      alt={selectedConversation.friend.name}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <User size={20} style={{ color: 'white' }} />
                  )}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: currentTheme.text }}>
                    {selectedConversation ? selectedConversation.friend.name : selectedGroup?.name}
                  </p>
                  <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                    {selectedConversation ? (
                      <span className="inline-flex items-center gap-2">
                        <Circle
                          className="w-2.5 h-2.5 fill-current"
                          style={{
                            color: userStatuses.get(selectedConversation.friend.id) === 'online' ? '#10b981' : '#ef4444',
                          }}
                        />
                        {userStatuses.get(selectedConversation.friend.id) === 'online' ? 'Online' : 'Offline'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {getOnlineGroupMemberCount(selectedGroup)}/{selectedGroup?.members?.length || 0} online
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedGroup && (
                  <>
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="px-2 py-1 text-xs rounded opacity-70 hover:opacity-100"
                      style={{ color: currentTheme.primary }}
                      title="Add member"
                    >
                      <UserPlus size={16} />
                    </button>
                    <button
                      onClick={handleExitGroup}
                      className="px-2 py-1 text-xs rounded opacity-70 hover:opacity-100"
                      style={{ color: '#ef4444' }}
                      title="Exit group"
                    >
                      <LogOut size={16} />
                    </button>
                    <button
                      onClick={handleDeleteAllGroupMessages}
                      className="px-2 py-1 text-xs rounded opacity-70 hover:opacity-100"
                      style={{ color: '#f97316' }}
                      title="Delete all your messages"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trash2 size={14} />
                        All
                      </span>
                    </button>
                  </>
                )}
                <X
                  size={24}
                  className="cursor-pointer hover:opacity-70"
                  style={{ color: currentTheme.text }}
                  onClick={() => {
                    setSelectedConversation(null);
                    setSelectedGroup(null);
                  }}
                />
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: currentTheme.background }}>
              {(chatTab === 'direct' && !selectedConversation) || (chatTab === 'groups' && !selectedGroup) ? (
                <div className="flex items-center justify-center h-full" style={{ color: currentTheme.textSecondary }}>
                  <p className="text-center">
                    <span className="text-lg mb-2">
                      {chatTab === 'direct' ? 'Select a conversation' : 'Select a group'}
                    </span>
                    <span className="text-sm">Choose from the list to start chatting</span>
                  </p>
                </div>
              ) : (chatTab === 'direct' ? messages : groupMessages).length === 0 ? (
                <div className="flex items-center justify-center h-full" style={{ color: currentTheme.textSecondary }}>
                  <p className="text-center">
                    <span className="text-lg mb-2">No messages yet</span>
                    <span className="text-sm">Start the conversation</span>
                  </p>
                </div>
              ) : (
                (chatTab === 'direct' ? messages : groupMessages).map((message) => {
                  const senderId = typeof message.sender === 'string' ? message.sender : (message.sender?.id);
                  const isFromCurrentUser = senderId === currentUserId;
                  return (
                  <div
                    key={message.id || message._id}
                    className={`flex ${
                      isFromCurrentUser ? 'justify-end group' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-md transform transition relative ${
                        isFromCurrentUser
                          ? 'rounded-br-none bg-blue-500 text-white'
                          : 'rounded-bl-none'
                      }`}
                      style={
                        !isFromCurrentUser
                          ? {
                              backgroundColor: currentTheme.input,
                              color: currentTheme.text,
                            }
                          : undefined
                      }
                    >
                      {message.sender?.name && (
                        <p className="text-xs font-semibold opacity-75 mb-1">{message.sender.name}</p>
                      )}
                      {message.type === 'file' && message.file ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold inline-flex items-center gap-2">
                            <Paperclip size={14} />
                            {message.file.name}
                          </p>
                          <p className="text-xs opacity-75">
                            {(message.file.size / 1024).toFixed(2)} KB
                          </p>
                          <a
                            href={message.file.url}
                            download
                            className="inline-flex items-center gap-1 text-xs font-semibold underline hover:opacity-80 transition"
                          >
                            <Download size={12} /> Download
                          </a>
                        </div>
                      ) : (
                        <p className="whitespace-normal break-all">{message.content}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs opacity-60">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {isFromCurrentUser && (
                          <button
                            onClick={() => {
                              if (chatTab === 'direct') {
                                handleDeleteMessage(message._id);
                              } else {
                                handleDeleteGroupMessage(message._id);
                              }
                            }}
                            className="inline-flex items-center text-xs opacity-60 hover:opacity-100 hover:text-red-500 transition"
                            title="Delete message"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Area */}
            {((chatTab === 'direct' && selectedConversation) || (chatTab === 'groups' && selectedGroup)) && (
            <div
              className="p-4 border-t space-y-2 shrink-0"
              style={{
                backgroundColor: currentTheme.surface,
                borderColor: currentTheme.border,
              }}
            >
              {/* File Preview */}
              {selectedFile && (
                <div
                  className="p-2 rounded-lg flex items-center justify-between text-sm"
                  style={{
                    backgroundColor: currentTheme.input,
                    borderColor: currentTheme.border,
                  }}
                >
                  <div className="flex items-center gap-2" style={{ color: currentTheme.text }}>
                    <Paperclip size={14} />
                    <span className="truncate">{selectedFile.name}</span>
                    <span className="text-xs opacity-70">
                      ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-red-500 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label
                  className={`cursor-pointer p-2 rounded-lg transition ${
                    isUploadingFile ? 'opacity-50' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ color: currentTheme.primary }}
                >
                  <Paperclip size={20} />
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                      e.target.value = '';
                    }}
                    disabled={isUploadingFile}
                  />
                </label>

                <button
                  className="opacity-70 hover:opacity-100 p-2 rounded-lg transition"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{ color: currentTheme.primary }}
                >
                  <Smile size={20} />
                </button>

                {showEmojiPicker && (
                  <div
                    className="absolute bottom-24 left-4 p-4 rounded-lg shadow-lg grid grid-cols-6 gap-2 z-10"
                    style={{ backgroundColor: currentTheme.surface, border: `1px solid ${currentTheme.border}` }}
                  >
                    {['😀', '😂', '❤️', '👍', '🔥', '✨', '🎉', '😍', '🚀', '💯'].map(
                      (emoji) => (
                        <button
                          key={emoji}
                          className="text-2xl hover:scale-110 transition"
                          onClick={() => {
                            handleAddEmoji(emoji);
                            setShowEmojiPicker(false);
                          }}
                        >
                          {emoji}
                        </button>
                      )
                    )}
                  </div>
                )}

                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  disabled={isSendingMessage || isUploadingFile}
                  className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition disabled:opacity-50"
                  style={{
                    backgroundColor: currentTheme.input,
                    borderColor: currentTheme.border,
                    color: currentTheme.text,
                  }}
                />

                <button
                  onClick={handleSendMessage}
                  disabled={isSendingMessage || isUploadingFile || !messageInput.trim()}
                  className="p-2 rounded-lg hover:opacity-80 transition font-semibold disabled:opacity-50"
                  style={{ backgroundColor: currentTheme.primary, color: 'white' }}
                >
                  {isSendingMessage ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </div>
            )}
          </>
        ) : (
          <div
            className="flex-1 flex items-center justify-center"
            style={{ color: currentTheme.textSecondary }}
          >
            <div className="text-center">
              <Send size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a conversation to continue</p>
              <p className="text-sm mt-2">Search for friends to start a new chat</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg shadow-xl w-96 p-6 max-h-96 overflow-y-auto"
            style={{ backgroundColor: currentTheme.surface }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: currentTheme.text }}>
                Create New Group
              </h2>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Group Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: currentTheme.text }}>
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: currentTheme.input,
                  borderColor: currentTheme.border,
                  color: currentTheme.text,
                }}
              />
            </div>

            {/* Members Selection */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: currentTheme.text }}>
                Select Members ({selectedMembers.length})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {conversations.map((conv) => (
                  <div
                    key={conv.friend.id}
                    className="flex items-center p-2 rounded hover:bg-opacity-70 cursor-pointer"
                    style={{
                      backgroundColor: selectedMembers.includes(conv.friend.id)
                        ? currentTheme.primary
                        : currentTheme.input,
                    }}
                    onClick={() => {
                      if (selectedMembers.includes(conv.friend.id)) {
                        setSelectedMembers(selectedMembers.filter((id) => id !== conv.friend.id));
                      } else {
                        setSelectedMembers([...selectedMembers, conv.friend.id]);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(conv.friend.id)}
                      onChange={() => {}}
                      className="mr-3"
                    />
                    <img
                      src={conv.friend.avatar || 'https://via.placeholder.com/32'}
                      alt={conv.friend.name}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <span
                      style={{
                        color: selectedMembers.includes(conv.friend.id)
                          ? 'white'
                          : currentTheme.text,
                      }}
                    >
                      {conv.friend.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition"
                style={{
                  backgroundColor: currentTheme.input,
                  color: currentTheme.text,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: currentTheme.primary }}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member to Group Modal */}
      {showAddMember && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg shadow-xl w-96 p-6 max-h-96 overflow-y-auto"
            style={{ backgroundColor: currentTheme.surface }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: currentTheme.text }}>
                Add Member to {selectedGroup.name}
              </h2>
              <button
                onClick={() => setShowAddMember(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Select Friends Not in Group */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: currentTheme.text }}>
                Select Friends to Add
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {conversations.map((conv) => {
                  const alreadyMember = selectedGroup?.members?.some(
                    (m: any) => m.userId?.toString() === conv.friend.id || m.userId === conv.friend.id
                  );
                  return (
                    <div
                      key={conv.friend.id}
                      className={`flex items-center p-2 rounded cursor-pointer ${
                        alreadyMember ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-70'
                      }`}
                      style={{
                        backgroundColor: selectedMembers.includes(conv.friend.id)
                          ? currentTheme.primary
                          : currentTheme.input,
                      }}
                      onClick={() => {
                        if (!alreadyMember) {
                          if (selectedMembers.includes(conv.friend.id)) {
                            setSelectedMembers(selectedMembers.filter((id) => id !== conv.friend.id));
                          } else {
                            setSelectedMembers([...selectedMembers, conv.friend.id]);
                          }
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(conv.friend.id)}
                        disabled={alreadyMember}
                        onChange={() => {}}
                        className="mr-3"
                      />
                      <img
                        src={conv.friend.avatar || 'https://via.placeholder.com/32'}
                        alt={conv.friend.name}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                      <span
                        style={{
                          color: selectedMembers.includes(conv.friend.id)
                            ? 'white'
                            : currentTheme.text,
                        }}
                      >
                        {conv.friend.name}
                        {alreadyMember && ' (in group)'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAddMember(false);
                  setSelectedMembers([]);
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition"
                style={{
                  backgroundColor: currentTheme.input,
                  color: currentTheme.text,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  selectedMembers.forEach((memberId) => handleAddMemberToGroup(memberId));
                  setShowAddMember(false);
                  setSelectedMembers([]);
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: currentTheme.primary }}
              >
                Add Members
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
