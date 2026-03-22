'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@clerk/nextjs';
import { Send, Plus, Smile, Paperclip, Search, User, X, Users, UserPlus, LogOut, Trash2, Download, Loader2, Circle, UserX } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import axios from 'axios';
import { encryptMessage, decryptMessage, generateSharedKey, isEncrypted } from '@/lib/encryption';
import { showToast } from '@/lib/toast';

interface Message {
  _id: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  type: 'text' | 'file' | 'emoji' | 'image';
  timestamp: Date;
  file?: {
    name?: string;
    url: string;
    size?: number;
    type?: string;
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
  const { getToken } = useAuth();
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
  const [filePreview, setFilePreview] = useState<{ url: string; isImage: boolean; name: string; size: number; type: string } | null>(null);
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
  const [expandedImage, setExpandedImage] = useState<{ url: string; name: string } | null>(null);
  const [expandedFile, setExpandedFile] = useState<{ url: string; name: string; size: number; type: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const isUnmountingRef = useRef(false);
  const lastSocketErrorRef = useRef<{ msg: string; at: number }>({ msg: '', at: 0 });
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

  const getGroupPreviewText = (group: any): string => {
    if (!group?.lastMessage) {
      return `${group?.members?.length || 0} members`;
    }

    const senderName = group.lastMessageSenderName ? `${group.lastMessageSenderName}: ` : '';
    return `${senderName}${group.lastMessage}`;
  };

  const getCurrentGroupMember = (group: any) => {
    if (!group || !currentUserId) return null;
    return group.members?.find((member: any) => getMemberId(member) === currentUserId) || null;
  };

  const isCurrentUserGroupAdmin = (group: any): boolean => {
    return getCurrentGroupMember(group)?.role === 'admin';
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
          reconnectionDelayMax: 3000,
          reconnectionAttempts: 5,
          timeout: 10000,
          transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
          auth: async (cb) => {
            const token = await getToken();
            cb({ token, userId: userData.userId });
          },
        });

        // ============ CONNECTION EVENTS ============
        newSocket.on('connect', () => {
          console.log('✅ Connected to chat server with socket ID:', newSocket.id);

          const activeGroup = selectedGroupRef.current;
          if (activeGroup) {
            const activeGroupId = getGroupId(activeGroup);
            if (activeGroupId) {
              newSocket.emit('join_group', activeGroupId);
              console.log(`👥 Re-joined group room on connect: group_${activeGroupId}`);
            }
          }
        });

        newSocket.on('connect_error', (error: any) => {
          if (isUnmountingRef.current) return;

          const message = String(error?.message || 'connection error').toLowerCase();
          const isExpectedDownState =
            message.includes('timeout') ||
            message.includes('xhr') ||
            message.includes('websocket') ||
            message.includes('network');

          const now = Date.now();
          const last = lastSocketErrorRef.current;
          if (last.msg === message && now - last.at < 4000) {
            return;
          }
          lastSocketErrorRef.current = { msg: message, at: now };

          if (isExpectedDownState) {
            console.warn('Socket server unreachable, retrying...');
            return;
          }

          console.error('Socket connection error:', error);
        });

        newSocket.io.on('reconnect_attempt', (attempt) => {
          if (!isUnmountingRef.current) {
            console.log(`Socket reconnect attempt: ${attempt}`);
          }
        });

        newSocket.io.on('reconnect_failed', () => {
          if (!isUnmountingRef.current) {
            console.warn('Socket reconnect failed after max attempts');
          }
        });

        newSocket.on('disconnect', (reason) => {
          if (!isUnmountingRef.current && reason !== 'io client disconnect') {
            console.warn(`Socket disconnected: ${reason}`);
          }
        });

        newSocket.on('reconnect', () => {
          console.log('🔄 Reconnected to server');

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
          let decryptedFileName = message.file?.name || (message as any).fileName || 'File';
          try {
            if (userData.userId && isEncrypted(message.content)) {
              const sharedKey = generateSharedKey(message.sender.id, userData.userId);
              decryptedContent = decryptMessage(message.content, sharedKey);
            }
          } catch (err) {
            console.error('Error decrypting message:', err);
            decryptedContent = message.content; // Fall back to encrypted
          }

          // Decrypt fileName if it's encrypted
          try {
            if ((message as any).fileName && isEncrypted((message as any).fileName)) {
              const sharedKey = generateSharedKey(message.sender.id, userData.userId);
              decryptedFileName = decryptMessage((message as any).fileName, sharedKey);
            }
          } catch (err) {
            console.error('Error decrypting fileName:', err);
            decryptedFileName = (message as any).fileName || 'File';
          }

          const incomingSenderId = message.sender?.id;
          const incomingSenderName = message.sender?.name || 'Unknown User';

          const decryptedMessage: Message = {
            ...message,
            sender: {
              ...message.sender,
              name: incomingSenderName,
            },
            content: decryptedContent,
            file: (message as any).fileUrl
              ? {
                name: decryptedFileName,
                url: (message as any).fileUrl,
                size: (message as any).fileSize || 0,
              }
              : undefined
          };

          if (selectedConversationRef.current?.friend.id === incomingSenderId) {
            // Message is from currently selected conversation
            setMessages((prev) => {
              if (prev.some((m) => m._id === decryptedMessage._id)) {
                return prev;
              }
              return [...prev, decryptedMessage];
            });
          } else {
            // Message is from a different conversation - increment unreadCount
            setConversations((prev) =>
              prev.map((conv) =>
                conv.friend.id === incomingSenderId
                  ? {
                    ...conv,
                    unreadCount: conv.unreadCount + 1,
                    lastMessage: `${incomingSenderName}: ${decryptedContent}`,
                    lastMessageTime: new Date(message.timestamp),
                  }
                  : conv
              )
            );
            return;
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
          let decryptedFileName = message.fileName || 'File';
          try {
            const encryptionKey = `group_${message.groupId}`;
            if (message.content && isEncrypted(message.content)) {
              decryptedContent = decryptMessage(message.content, encryptionKey);
            }
          } catch (err) {
            console.error('❌ Error decrypting group message:', err);
          }

          // Decrypt fileName if it's encrypted
          try {
            const encryptionKey = `group_${message.groupId}`;
            if (message.fileName && isEncrypted(message.fileName)) {
              decryptedFileName = decryptMessage(message.fileName, encryptionKey);
            } else {
              decryptedFileName = message.fileName || 'File';
            }
          } catch (err) {
            console.error('Error decrypting fileName:', err);
            decryptedFileName = message.fileName || 'File';
          }

          const activeGroup = selectedGroupRef.current;
          const activeGroupId = getGroupId(activeGroup);
          const incomingGroupId = message.groupId?.toString?.() || message.groupId;
          const currentGroupId = activeGroupId?.toString?.() || activeGroupId;

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
            file: message.fileUrl
              ? {
                name: decryptedFileName,
                url: message.fileUrl,
                size: message.fileSize || 0,
              }
              : undefined,
            timestamp,
          };

          if (incomingGroupId === currentGroupId) {
            // Message is from currently selected group
            setGroupMessages((prev) => {
              const incomingId = (normalizedMessage.id || normalizedMessage._id)?.toString?.();
              if (incomingId && prev.some((m) => (m.id || m._id)?.toString?.() === incomingId)) {
                return prev;
              }
              return [...prev, normalizedMessage];
            });

            setGroups((prev) => prev.map((group) => {
              if (getGroupId(group) !== currentGroupId) {
                return group;
              }

              return {
                ...group,
                lastMessage: decryptedContent,
                lastMessageSenderName: normalizedMessage.sender?.name || 'Unknown User',
                lastMessageTime: timestamp,
              };
            }));
          } else {
            // Message is from a different group - increment unreadCount
            setGroups((prev) =>
              prev.map((group) =>
                (getGroupId(group)?.toString?.() || getGroupId(group)) === incomingGroupId
                  ? {
                    ...group,
                    unreadCount: (group.unreadCount || 0) + 1,
                    lastMessage: decryptedContent,
                    lastMessageSenderName: normalizedMessage.sender?.name || 'Unknown User',
                    lastMessageTime: timestamp,
                  }
                  : group
              )
            );
          }
        });

        // ============ ERROR HANDLING ============
        newSocket.on('error', (error: any) => {
          if (isUnmountingRef.current) return;
          const message = String(error?.message || '').toLowerCase();
          if (message.includes('timeout') || message.includes('network')) {
            console.warn('Socket temporary network issue.');
            return;
          }
          console.error('Socket error:', error);
        });

        // ============ FRIEND REMOVAL EVENTS ============
        // When a friend removes us
        newSocket.on('friend_removed', (data: any) => {
          console.log(`🚫 Friend ${data.removedBy} removed us`);
          const removedByUserId = data.removedBy;
          
          // Remove from conversations immediately
          setConversations((prev) => prev.filter((c) => c.friend.id !== removedByUserId));
          
          // Clear selected conversation if it's the friend who removed us
          if (selectedConversationRef.current?.friend.id === removedByUserId) {
            setSelectedConversation(null);
            setMessages([]);
          }
          
          // Remove any pending requests with this user
          setPendingRequests((prev) => 
            prev.filter(req => req.senderId !== removedByUserId && req.receiverId !== removedByUserId)
          );
          
          console.log(`✅ Removed ${removedByUserId} from conversations (we were unfriended)`);
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
      isUnmountingRef.current = true;
      // Cleanup on unmount
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        console.log('Socket disconnected');
      }
    };
  }, [getToken]);

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
        const normalizedGroups = (response.data || []).map((group: any) => {
          let decryptedLastMessage = group.lastMessage;

          try {
            if (group.lastMessage && isEncrypted(group.lastMessage)) {
              decryptedLastMessage = decryptMessage(group.lastMessage, `group_${getGroupId(group)}`);
            }
          } catch (error) {
            console.error('Error decrypting group preview:', error);
          }

          return {
            ...group,
            lastMessage: decryptedLastMessage,
          };
        });

        setGroups(normalizedGroups);
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

      // Mark all messages as read when opening the conversation
      const markReadPromise = axios.patch('/api/chat/messages/mark-read', {
        senderId: selectedConversation.friend.id
      });

      markReadPromise
        .then(() => {
          // Clear unread count for this conversation
          setConversations((prev) =>
            prev.map((conv) =>
              conv.friend.id === selectedConversation.friend.id
                ? { ...conv, unreadCount: 0 }
                : conv
            )
          );
          console.log(`✅ Marked all messages as read from: ${selectedConversation.friend.name}`);

          // Refetch conversations after a short delay to ensure database is updated
          setTimeout(() => {
            axios.get('/api/chat/conversations')
              .then(res => {
                const decryptedConversations = res.data.map((conv: Conversation) => {
                  if (conv.lastMessage && currentUserId) {
                    try {
                      if (isEncrypted(conv.lastMessage)) {
                        const sharedKey = generateSharedKey(conv.friend.id, currentUserId);
                        const decrypted = decryptMessage(conv.lastMessage, sharedKey);
                        return { ...conv, lastMessage: decrypted };
                      }
                    } catch (err) {
                      console.error(`Error decrypting:`, err);
                    }
                  }
                  return conv;
                });
                setConversations(decryptedConversations);
                console.log('✅ Refetched conversations to sync unreadCount');
              })
              .catch(err => console.error('Error refetching conversations:', err));
          }, 100);
        })
        .catch(err => console.error('Error marking messages as read:', err));

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
            let fileName = msg.fileName || 'File';
            try {
              if (msg.content && isEncrypted(msg.content)) {
                content = decryptMessage(msg.content, encryptionKey);
              }
            } catch (err) {
              console.error('Error decrypting stored message:', err);
            }

            // Decrypt fileName if it's encrypted
            try {
              if (msg.fileName && isEncrypted(msg.fileName)) {
                fileName = decryptMessage(msg.fileName, encryptionKey);
              }
            } catch (err) {
              console.error('Error decrypting fileName:', err);
              fileName = msg.fileName || 'File';
            }

            // Normalize timestamp: use createdAt from DB or timestamp
            const timestamp = msg.createdAt || msg.timestamp || new Date();
            // IMPORTANT: Normalize ID to always use 'id' property (convert _id to id for consistency)
            return {
              ...msg,
              id: (msg._id || msg.id),
              _id: (msg._id || msg.id),
              sender: {
                id: typeof msg.sender === 'string' ? msg.sender : (msg.sender?.id || msg.sender?._id),
                name: msg.senderName || msg.sender?.name || 'Unknown User',
                avatar: msg.senderImage || msg.sender?.avatar,
              },
              file: msg.fileUrl
                ? {
                  name: fileName,
                  url: msg.fileUrl,
                  size: msg.fileSize || 0,
                }
                : undefined,
              content,
              timestamp: new Date(timestamp),
            };
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

        // Mark all group messages as read when opening the group
        const markReadPromise = axios.patch('/api/chat/group-messages/mark-read', {
          groupId: groupId
        });

        markReadPromise
          .then(() => {
            // Clear unread count for this group
            setGroups((prev) =>
              prev.map((g) =>
                getGroupId(g) === groupId
                  ? { ...g, unreadCount: 0 }
                  : g
              )
            );
            console.log(`✅ Marked all messages as read for group: ${groupId}`);

            // Refetch groups after a short delay to ensure database is updated
            setTimeout(() => {
              axios.get('/api/chat/groups')
                .then(res => {
                  setGroups(res.data);
                  console.log('✅ Refetched groups to sync unreadCount');
                })
                .catch(err => console.error('Error refetching groups:', err));
            }, 100);
          })
          .catch(err => console.error('Error marking group messages as read:', err));
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
    if (messagesContainerRef.current) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 0);
    }
  }, [messages, groupMessages]);

  // Handle keyboard shortcuts (ESC to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expandedImage) setExpandedImage(null);
        if (expandedFile) setExpandedFile(null);
        if (showCreateGroup) setShowCreateGroup(false);
        if (showAddMember) setShowAddMember(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedImage, expandedFile, showCreateGroup, showAddMember]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    // Clear search results immediately if input is empty
    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    
    setShowSearch(true);
    
    // Search on every keystroke for real-time results
    try {
      const response = await axios.get(`/api/chat/search-friends?q=${query}`);
      // Filter out already connected friends and pending requests
      const filteredResults = (response.data || []).filter((user: any) => {
        // Check if already in conversations
        const isConnected = conversations.some(c => c.friend.id === user.clerkId || c.friend.id === user.id);
        // Check if request is pending
        const hasPending = pendingRequests.some(req => req.senderId === user.clerkId || req.senderId === user.id);
        return !isConnected && !hasPending;
      });
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching friends:', error);
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

  const handleFileSelection = async (file: File) => {
    // Block video uploads entirely
    if (file.type.startsWith('video/')) {
      showToast.error('Video uploads are not supported. Please use image files instead.');
      return;
    }

    if (chatTab === 'groups') {
      if (!selectedGroup || !currentUserId || !currentUser) {
        showToast.error('Please select a group first');
        return;
      }
    } else {
      if (!selectedConversation || !currentUserId || !currentUser) {
        showToast.error('Please select a conversation first');
        return;
      }
    }

    // Validate file size before upload (frontend check)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max
    if (file.size > MAX_FILE_SIZE) {
      showToast.error(`File too large (Max 50MB). Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    setIsUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      if (chatTab === 'groups' && selectedGroup) {
        const groupId = getGroupId(selectedGroup);
        if (groupId) formData.append('groupId', groupId);
      } else if (selectedConversation) {
        formData.append('receiverId', selectedConversation.friend.id);
      }

      // Upload with extended timeout for large files
      const response = await axios.post('/api/chat/upload', formData, {
        timeout: 600000, // 10 minutes timeout for large file uploads
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          // Track upload progress silently, no console spam
          const progress = progressEvent.total ? (progressEvent.loaded / progressEvent.total) * 100 : 0;
          console.log(`Upload progress: ${progress.toFixed(2)}%`);
        },
      });

      // Determine if file is an image
      const isImage = response.data.isImage || file.type.startsWith('image/');

      setFilePreview({
        url: response.data.url,
        isImage: isImage,
        name: file.name,
        size: file.size,
        type: file.type,
      });

      setSelectedFile(file);
      showToast.success(`File ready to send: ${file.name}`);
    } catch (error: any) {
      let errorMsg = 'Failed to upload file';

      // Handle different error scenarios
      if (error.code === 'ECONNABORTED') {
        errorMsg = 'Upload timeout. The file took too long to upload. Please try a smaller file.';
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMsg = error.response.data.error || 'Invalid file type or size';
      } else if (error.response?.status === 401) {
        errorMsg = 'Unauthorized. Please log in again.';
      } else if (error.response?.status === 404) {
        errorMsg = 'User not found. Please refresh the page.';
      } else if (error.response?.status === 413) {
        errorMsg = 'File is too large. Maximum size is 50MB.';
      } else if (error.response?.status === 500) {
        errorMsg = 'Server error. Please try again or contact support.';
      } else if (error.code === 'ENOTFOUND' || error.message?.includes('Network')) {
        errorMsg = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMsg = error.message.length > 100 ? 'Upload failed. Please try again.' : error.message;
      }

      // Show error as toast, never let it appear on page
      showToast.error(errorMsg);
      setSelectedFile(null);
      setFilePreview(null);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSendFile = async () => {
    if (!filePreview || !selectedFile) {
      showToast.error('No file selected');
      return;
    }

    if (chatTab === 'groups') {
      if (!selectedGroup || !socket || !currentUserId || !currentUser) {
        showToast.error('Group not selected or connection lost');
        return;
      }

      setIsSendingMessage(true);

      try {
        const groupId = getGroupId(selectedGroup);
        if (!groupId) {
          showToast.error('Invalid group selected');
          setSelectedFile(null);
          setFilePreview(null);
          return;
        }

        const filename = selectedFile.name;
        const fileMessage: any = {
          id: Date.now().toString(),
          _id: Date.now().toString(),
          sender: { id: currentUserId, name: currentUser.userName },
          content: filePreview.isImage ? filePreview.url : `📎 ${filename}`,
          type: filePreview.isImage ? 'image' : 'file',
          timestamp: new Date(),
          file: {
            name: filename,
            url: filePreview.url,
            size: filePreview.size,
            type: filePreview.type,
          },
        };

        setGroupMessages((prev) => [...prev, fileMessage]);
        setGroups((prev) => prev.map((group) => {
          if (getGroupId(group) !== groupId) {
            return group;
          }

          return {
            ...group,
            lastMessage: filename,
            lastMessageSenderName: currentUser.userName,
            lastMessageTime: new Date(),
          };
        }));
        setSelectedFile(null);
        setFilePreview(null);

        // Save file message to database to get real _id
        const fileDbResponse = await axios.post('/api/chat/group-messages', {
          groupId,
          content: filePreview.isImage ? filePreview.url : `📎 ${filename}`,
          type: filePreview.isImage ? 'image' : 'file',
          fileUrl: filePreview.url,
          fileName: filename,
          fileSize: filePreview.size,
          fileType: filePreview.type,
        });

        // Update local message with real MongoDB _id
        const realFileMessageId = fileDbResponse.data._id;
        setGroupMessages((prev) => {
          return prev.map((msg) =>
            msg.id === fileMessage.id
              ? {
                ...msg,
                id: realFileMessageId,
                _id: realFileMessageId,
                file: {
                  ...msg.file,
                  url: filePreview.url
                }
              }
              : msg
          );
        });
        console.log(`Group file message saved with real ID: ${realFileMessageId}`);

        const encryptionKey = `group_${groupId}`;
        const encryptedFileName = encryptMessage(filename, encryptionKey);

        socket.emit('send_group_message', {
          id: realFileMessageId,
          _id: realFileMessageId,
          groupId,
          senderId: currentUserId,
          senderName: currentUser.userName,
          content: filePreview.isImage ? filePreview.url : `📎 ${encryptedFileName}`,
          type: filePreview.isImage ? 'image' : 'file',
          fileUrl: filePreview.url,
          fileName: encryptedFileName,
          fileSize: filePreview.size,
          fileType: filePreview.type,
          timestamp: new Date(),
        });

        console.log(`📤 Sent file to group ${groupId}`);
      } catch (error) {
        console.error('Error sending file to group:', error);
        showToast.error('Failed to send file');
        setSelectedFile(null);
        setFilePreview(null);
      } finally {
        setIsSendingMessage(false);
      }
    } else {
      if (!selectedConversation || !socket || !currentUserId || !currentUser) {
        showToast.error('Conversation not found or connection lost');
        return;
      }

      setIsSendingMessage(true);

      try {
        const filename = selectedFile.name;
        const fileMessage: Message = {
          _id: Date.now().toString(),
          sender: {
            id: currentUserId,
            name: currentUser.userName,
            avatar: currentUser.userImage,
          },
          content: filePreview.isImage ? filePreview.url : `📎 ${filename}`,
          type: filePreview.isImage ? 'image' : 'file',
          timestamp: new Date(),
          file: {
            name: filename,
            url: filePreview.url,
            size: filePreview.size,
            type: filePreview.type,
          },
        };

        setMessages((prev) => [...prev, fileMessage]);
        setSelectedFile(null);
        setFilePreview(null);

        // Save file message to database to get real _id
        const fileDbResponse = await axios.post('/api/chat/messages', {
          receiverId: selectedConversation.friend.id,
          content: filePreview.isImage ? filePreview.url : `📎 ${filename}`,
          type: filePreview.isImage ? 'image' : 'file',
          fileUrl: filePreview.url,
          fileName: filename,
          fileSize: filePreview.size,
          fileType: filePreview.type,
        });

        // Update local message with real MongoDB _id
        const realFileMessageId = fileDbResponse.data._id;
        setMessages((prev) => {
          return prev.map((msg) =>
            msg._id === fileMessage._id
              ? {
                ...msg,
                _id: realFileMessageId,
                file: {
                  ...msg.file,
                  url: filePreview.url
                }
              }
              : msg
          );
        });
        console.log(`✅ File message saved with real ID: ${realFileMessageId}`);

        // Update last message in conversations
        setConversations((prev) =>
          prev.map((conv) =>
            conv.friend.id === selectedConversation.friend.id
              ? {
                ...conv,
                lastMessage: `${currentUser.userName}: sent a file`,
                lastMessageTime: new Date(),
              }
              : conv
          )
        );

        // Encrypt file metadata for socket transmission
        const sharedKey = generateSharedKey(currentUserId, selectedConversation.friend.id);
        const encryptedFileName = encryptMessage(filename, sharedKey);

        // Emit encrypted file message through socket
        socket.emit('send_message', {
          senderId: currentUserId,
          receiverId: selectedConversation.friend.id,
          senderName: currentUser.userName,
          content: filePreview.isImage ? filePreview.url : `📎 ${encryptedFileName}`,
          type: filePreview.isImage ? 'image' : 'file',
          fileUrl: filePreview.url,
          fileName: encryptedFileName,
          fileSize: filePreview.size,
          fileType: filePreview.type,
          timestamp: new Date(),
        });

        console.log(`📤 Sent file to ${selectedConversation.friend.id}`);
      } catch (error) {
        console.error('Error sending file:', error);
        showToast.error('Failed to send file');
        setSelectedFile(null);
        setFilePreview(null);
      } finally {
        setIsSendingMessage(false);
      }
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleAddEmoji = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      console.log(`📤 Sending friend request to user: ${userId}`);
      console.log(`  - Current user ID: ${currentUserId}`);
      console.log(`  - User ID type: ${typeof userId}`);
      console.log(`  - User ID length: ${userId?.length}`);

      // Validate userId
      if (!userId || userId.trim().length === 0) {
        console.error('❌ Invalid user ID (empty)');
        alert('❌ Invalid user ID');
        return;
      }

      // Check if already in conversations
      const isConnected = conversations.some(c => c.friend.id === userId);
      if (isConnected) {
        console.log(`⚠️  Already connected with user: ${userId}`);
        alert('✅ Already connected with this user');
        return;
      }

      // Check if request already pending
      const hasPending = pendingRequests.some(req => req.senderId === userId || req.receiverId === userId);
      if (hasPending) {
        console.log(`⚠️  Pending request already exists for user: ${userId}`);
        alert('✅ Request already sent to this user');
        return;
      }

      console.log(`📤 Making POST request to /api/chat/friend-requests with receiverId: ${userId}`);
      
      const response = await axios.post('/api/chat/friend-requests', {
        receiverId: userId
      });
      
      console.log(`✅ Friend request sent successfully`, response.data);

      setSearchQuery('');
      setSearchResults([]);
      alert('✅ Friend request sent!');
    } catch (error: any) {
      console.error('❌ Error sending friend request:', error);

      const errorMessage = error.response?.data?.error || error.message || 'Failed to send friend request';
      const statusCode = error.response?.status;
      
      console.error(`  - Status Code: ${statusCode}`);
      console.error(`  - Error Message: ${errorMessage}`);
      console.error(`  - Full Response:`, error.response?.data);

      // Handle 400 errors (bad request - validation errors)
      if (statusCode === 400) {
        if (errorMessage?.includes('already') || errorMessage?.includes('pending') || errorMessage?.includes('yourself')) {
          alert(`⚠️ ${errorMessage}`);
        } else {
          alert(`❌ Invalid request: ${errorMessage}`);
        }
      } else if (statusCode === 401) {
        alert('❌ You must be logged in to send friend requests');
      } else if (statusCode === 404) {
        alert('❌ User not found');
      } else if (statusCode === 500) {
        alert('❌ Server error. Please try again later');
      } else {
        alert(`❌ ${errorMessage}`);
      }
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
      setGroups((prev) => prev.map((group) => {
        if (getGroupId(group) !== groupId) {
          return group;
        }

        return {
          ...group,
          lastMessage: messageContent,
          lastMessageSenderName: currentUser.userName,
          lastMessageTime: new Date(),
        };
      }));
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
      const groupId = getGroupId(selectedGroup);
      if (!groupId) {
        alert('Invalid group selected');
        return;
      }

      const response = await axios.patch(
        `/api/chat/groups/${groupId}/members`,
        { action: 'remove', memberId }
      );

      setSelectedGroup(response.data);
      setGroups((prev) => prev.map((g) => (getGroupId(g) === groupId ? response.data : g)));
      setGroupMembers(response.data.members || []);
      setSelectedMembers((prev) => prev.filter((id) => id !== memberId));
      alert('✅ Member removed!');
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;

    if (confirm('Delete this group for all members? This cannot be undone.')) {
      try {
        const groupId = getGroupId(selectedGroup);
        if (!groupId) {
          alert('Invalid group selected');
          return;
        }

        await axios.delete(`/api/chat/groups/${groupId}?mode=delete`);

        if (socket) {
          socket.emit('leave_group', groupId);
        }

        setGroups((prev) => prev.filter((group) => getGroupId(group) !== groupId));
        setSelectedGroup(null);
        setGroupMembers([]);
        setGroupMessages([]);
        alert('✅ Group deleted');
      } catch (error: any) {
        console.error('Error deleting group:', error);
        alert(error.response?.data?.error || 'Failed to delete group');
      }
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
        console.log(` Exiting group: ${groupId}`);

        await axios.delete(`/api/chat/groups/${groupId}`);
        console.log(`API delete successful`);

        // Leave socket room
        if (socket) {
          socket.emit('leave_group', groupId);
          console.log(`Left socket room: group_${groupId}`);
        }

        // Clear UI state
        setGroups((prev) => {
          const filtered = prev.filter((g) => (g._id || g.id) !== groupId);
          console.log(`📋 Updated groups list - remaining: ${filtered.length}`);
          return filtered;
        });

        setGroupMessages([]);
        setSelectedGroup(null);

        console.log(`Successfully exited group`);
        alert('✅ You left the group');
      } catch (error: any) {
        console.error('Error exiting group:', error);
        alert('Failed to exit group: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleDeleteGroupMessage = async (messageId: string) => {
    if (!messageId) {
      console.warn('No message ID provided');
      return;
    }
    try {
      console.log(`Deleting group message: ${messageId}`);
      const response = await axios.delete(`/api/chat/group-messages/${messageId}`);
      console.log(`Delete API response:`, response.data);

      // Remove from local state immediately
      setGroupMessages((prev) => {
        const filtered = prev.filter((m) => {
          const mId = (m.id || m._id)?.toString();
          const targetId = messageId.toString();
          return mId !== targetId;
        });
        console.log(`Group message deleted locally - remaining: ${filtered.length}`);
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
        console.log(`Broadcasted message deletion to group: ${groupId}`);
      }
    } catch (error: any) {
      console.error('Error deleting group message:', error.response?.data || error.message);
      alert('Failed to delete message: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!messageId) {
      console.warn('No message ID provided');
      return;
    }
    try {
      console.log(`Deleting direct message: ${messageId}`);

      // Call delete API for direct messages
      const response = await axios.delete(`/api/chat/messages/${messageId}`);
      console.log(`Delete API response:`, response.data);

      // Remove from local state immediately
      setMessages((prev) => {
        const filtered = prev.filter((m) => m._id !== messageId);
        console.log(`Direct message deleted - remaining: ${filtered.length}`);
        return filtered;
      });

      // Broadcast deletion to conversation partner via socket
      if (socket && selectedConversation) {
        socket.emit('delete_message', {
          messageId,
          conversationId: selectedConversation.friend.id,
          targetUserId: selectedConversation.friend.id,
          type: 'direct'
        });
        console.log(`Broadcasted message deletion to: ${selectedConversation.friend.id}`);
      }
    } catch (error: any) {
      console.error('Error deleting direct message:', error.response?.data || error.message);
      alert('Failed to delete message: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteAllGroupMessages = async () => {
    if (!selectedGroup) return;

    if (confirm('Delete all your messages in this group?')) {
      try {
        const groupId = getGroupId(selectedGroup);
        await axios.delete(
          `/api/chat/group-messages/temp?deleteAll=true&groupId=${groupId}`
        );
        setGroupMessages((prev) => prev.filter((m) => m.sender.id !== currentUserId && m.sender !== currentUserId));
        alert('✅ All messages deleted!');
      } catch (error) {
        console.error('Error deleting messages:', error);
        alert('Failed to delete messages');
      }
    }
  };

  const handleDeleteAllMessages = async () => {
    if (!selectedConversation) return;

    if (confirm('Delete all messages in this conversation? This action cannot be undone.')) {
      try {
        const friendId = selectedConversation.friend.id;
        await axios.delete(`/api/chat/messages/delete-all?friendId=${friendId}`);
        setMessages([]);
        
        // Update the conversation's lastMessage to empty, but keep the conversation
        setConversations((prev) =>
          prev.map((c) =>
            c.id === friendId
              ? { ...c, lastMessage: '', lastMessageTime: undefined }
              : c
          )
        );
        
        alert('✅ All messages deleted!');
      } catch (error: any) {
        console.error('Error deleting messages:', error);
        alert(error.response?.data?.error || 'Failed to delete messages');
      }
    }
  };

  const handleDeleteFriend = async () => {
    if (!selectedConversation || !socket) return;

    if (confirm(`Remove ${selectedConversation.friend.name} from your friends? This will also delete all messages in this conversation.`)) {
      try {
        const friendId = selectedConversation.friend.id;
        const friendName = selectedConversation.friend.name;
        
        // Remove from conversations immediately for instant UI feedback
        setConversations((prev) => prev.filter((c) => c.id !== friendId && c.friend.id !== friendId));
        setSelectedConversation(null);
        setMessages([]);
        
        // Also remove any pending friend requests with this user
        setPendingRequests((prev) => 
          prev.filter(req => req.senderId !== friendId && req.receiverId !== friendId)
        );
        
        // Call the API to delete the friend (this will also delete all messages)
        const response = await axios.delete(`/api/chat/friends`, {
          data: { friendId }
        });
        
        console.log(`✅ Friend ${friendId} deleted successfully. Messages deleted: ${response.data.deletedMessages}`);
        
        // Emit Socket.io event to notify the other user in real-time
        socket.emit('friend_removed', {
          friendId: friendId
        });
        console.log(`📡 Socket event sent to notify ${friendName} about removal`);
        
        alert('✅ Friend removed successfully! All messages deleted.');
      } catch (error: any) {
        console.error('Error removing friend:', error);
        
        // If deletion fails, refresh the list to ensure consistency with backend
        try {
          const conversationResponse = await axios.get('/api/chat/conversations').catch(() => ({ data: [] }));
          setConversations(conversationResponse.data || []);
          console.log('✅ Refreshed conversations after deletion failed');
        } catch (err) {
          console.error('Error refreshing conversations:', err);
        }
        
        alert(error.response?.data?.error || 'Failed to remove friend');
      }
    }
  };

  return (
    <div
      className="flex h-screen min-h-0 overflow-hidden"
      style={{ backgroundColor: currentTheme.background }}
    >
      {/* Sidebar - Conversations */}
      <div
        className="w-80 min-h-0 border-r flex flex-col overflow-hidden"
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
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${chatTab === 'direct'
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
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${chatTab === 'groups'
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
              conversations.map((conversation, index) => (
                <div
                  key={index}
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
                    boxShadow: selectedConversation?.id === conversation.id
                      ? `inset 4px 0 0 rgba(255,255,255,0.8)`
                      : 'none',
                  }}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    setSelectedGroup(null);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
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
                        <p className="font-semibold truncate">{conversation.friend.name}</p>
                        <p className="text-sm truncate" style={{ opacity: selectedConversation?.id === conversation.id ? 0.9 : 0.75 }}>
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div
                        className="shrink-0 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                        style={{
                          backgroundColor: selectedConversation?.id === conversation.id
                            ? 'rgba(255,255,255,0.25)'
                            : currentTheme.primary,
                          color: 'white'
                        }}
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
              groups.map((group) => {
                const isSelectedGroup = getGroupId(selectedGroup) === getGroupId(group);

                return (
                  <div
                    key={group._id || group.id}
                    className="p-3 border-b cursor-pointer hover:bg-opacity-50 transition"
                    style={{
                      backgroundColor: isSelectedGroup ? currentTheme.primary : currentTheme.surface,
                      borderColor: currentTheme.border,
                      color: isSelectedGroup ? 'white' : currentTheme.text,
                      boxShadow: isSelectedGroup
                        ? `inset 4px 0 0 rgba(255,255,255,0.8)`
                        : 'none',
                    }}
                    onClick={() => {
                      setSelectedGroup(group);
                      setSelectedConversation(null);
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: isSelectedGroup ? 'rgba(255,255,255,0.18)' : currentTheme.primary }}
                        >
                          <User size={20} style={{ color: 'white' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{group.name}</p>
                          <p className="text-sm truncate" style={{ opacity: isSelectedGroup ? 0.9 : 0.75 }}>
                            {getGroupPreviewText(group)}
                          </p>
                        </div>
                      </div>
                      {group.unreadCount > 0 && (
                        <div className="shrink-0 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                          style={{
                            backgroundColor: isSelectedGroup
                              ? 'rgba(255,255,255,0.25)'
                              : currentTheme.primary,
                            color: 'white'
                          }}>
                          {group.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {selectedConversation || selectedGroup ? (
          <div className='flex-1 flex flex-col min-h-0'>
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
                  <div className="text-sm" style={{ color: currentTheme.textSecondary }}>
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
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span className="font-semibold">{getOnlineGroupMemberCount(selectedGroup)}/{selectedGroup?.members?.length || 0} online</span>
                        </div>
                        <div className="text-xs truncate max-w-md" title={(selectedGroup?.members || []).map((m: any) => m.userName || m.name).join(', ')}>
                          {(selectedGroup?.members || [])
                            .map((m: any) => m.userName || m.name)
                            .slice(0, 3)
                            .join(', ')}
                          {(selectedGroup?.members || []).length > 3 ? ` +${(selectedGroup?.members || []).length - 3}` : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedGroup && (
                  <>
                    <button
                      onClick={() => setShowAddMember(true)}
                      disabled={!isCurrentUserGroupAdmin(selectedGroup)}
                      className="px-2 py-1 text-xs rounded opacity-70 hover:opacity-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: currentTheme.primary }}
                      title={isCurrentUserGroupAdmin(selectedGroup) ? 'Add member' : 'Only admins can add members'}
                    >
                      <UserPlus size={16} />
                    </button>
                    {isCurrentUserGroupAdmin(selectedGroup) && (
                      <button
                        onClick={handleDeleteGroup}
                        className="px-2 py-1 text-xs rounded opacity-70 hover:opacity-100"
                        style={{ color: '#ef4444' }}
                        title="Delete group"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
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
                {selectedConversation && (
                  <>
                    <button
                      onClick={handleDeleteAllMessages}
                      className="px-2 py-1 text-xs rounded opacity-70 hover:opacity-100"
                      style={{ color: '#f97316' }}
                      title="Delete all messages in conversation"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trash2 size={14} />
                        Clear
                      </span>
                    </button>
                    <button
                      onClick={handleDeleteFriend}
                      className="px-2 py-1 text-xs rounded opacity-70 hover:opacity-100"
                      style={{ color: '#ef4444' }}
                      title={`Remove ${selectedConversation.friend.name} from friends`}
                    >
                      <UserX size={16} />
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
            <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: currentTheme.background }}>
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
                      className={`flex ${isFromCurrentUser ? 'justify-end group' : 'justify-start'
                        }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-md transform transition relative ${isFromCurrentUser
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
                        {chatTab === 'groups' && message.sender?.name && (
                          <p className="text-xs font-semibold opacity-75 mb-1">{message.sender.name}</p>
                        )}
                        {message.type === 'image' ? (
                          <div className="space-y-2 cursor-pointer" onClick={() => setExpandedImage({ url: message.file?.url || message.content, name: message.file?.name || 'Image' })}>
                            <img
                              src={message.file?.url || message.content}
                              alt={message.file?.name || 'Shared image'}
                              className="max-w-xs max-h-80 rounded-lg border border-gray-300 hover:opacity-90 transition object-cover"
                              style={{ backgroundColor: isFromCurrentUser ? '#3b82f6' : currentTheme.input }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  (e.currentTarget.nextElementSibling as HTMLElement).classList.remove('hidden');
                                }
                              }}
                            />
                            <p className="hidden text-sm" style={{ color: currentTheme.text }}>Failed to load image</p>
                          </div>
                        ) : message.type === 'file' && message.file ? (
                          <div className="space-y-2 cursor-pointer" onClick={() => setExpandedFile({ url: message.file?.url || '', name: message.file?.name || 'File', size: message.file?.size || 0, type: message.file?.type || 'unknown' })}>
                            <p className="text-sm font-semibold inline-flex items-center gap-2 hover:opacity-80 transition">
                              <Paperclip size={14} />
                              {message.file.name}
                            </p>
                            <p className="text-xs opacity-75">
                              {(message.file.size / 1024).toFixed(2)} KB
                            </p>
                            <p className="text-xs opacity-60 hover:opacity-100 transition inline-flex items-center gap-1">
                              <Download size={12} /> Click to preview
                            </p>
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
                className="sticky bottom-0 z-10 p-4 border-t space-y-2 shrink-0"
                style={{
                  backgroundColor: currentTheme.surface,
                  borderColor: currentTheme.border,
                }}
              >
                {/* Upload File Loader */}
                {isUploadingFile && !filePreview && (
                  <div
                    className="p-4 rounded-lg border-2 flex items-center gap-3"
                    style={{
                      backgroundColor: currentTheme.input,
                      borderColor: currentTheme.primary,
                    }}
                  >
                    <Loader2 size={20} className="animate-spin" style={{ color: currentTheme.primary }} />
                    <div className="flex-1">
                      <p style={{ color: currentTheme.text }} className="text-sm font-semibold">
                        Uploading file...
                      </p>
                      <p style={{ color: currentTheme.textSecondary }} className="text-xs">
                        Please wait while your file is being uploaded
                      </p>
                    </div>
                  </div>
                )}

                {/* File Preview */}
                {filePreview && (
                  <div
                    className="p-3 rounded-lg space-y-2 border-2"
                    style={{
                      backgroundColor: currentTheme.input,
                      borderColor: currentTheme.primary,
                    }}
                  >
                    {filePreview.isImage ? (
                      <div className="space-y-2">
                        <img
                          src={filePreview.url}
                          alt="Preview"
                          className="max-w-xs max-h-64 rounded-lg object-cover"
                        />
                        <p style={{ color: currentTheme.text }} className="text-sm font-semibold">{filePreview.name}</p>
                        <p style={{ color: currentTheme.textSecondary }} className="text-xs">
                          {(filePreview.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2" style={{ color: currentTheme.text }}>
                        <Paperclip size={14} />
                        <span className="truncate">{filePreview.name}</span>
                        <span className="text-xs opacity-70">
                          ({(filePreview.size / 1024).toFixed(2)} KB)
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2 items-center justify-end pt-2">
                      <button
                        onClick={handleCancelFile}
                        className="px-3 py-1 rounded text-sm font-semibold transition"
                        style={{
                          backgroundColor: currentTheme.surface,
                          color: currentTheme.text,
                        }}
                        disabled={isSendingMessage}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendFile}
                        className="px-3 py-1 rounded text-sm font-semibold text-white transition disabled:opacity-50"
                        style={{ backgroundColor: currentTheme.primary }}
                        disabled={isSendingMessage || isUploadingFile}
                      >
                        {isSendingMessage ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label
                    className={`cursor-pointer p-2 rounded-lg transition ${isUploadingFile || filePreview ? 'opacity-50' : 'opacity-70 hover:opacity-100'
                      }`}
                    style={{ color: currentTheme.primary }}
                    title={isUploadingFile ? 'Uploading...' : filePreview ? 'Send or cancel preview first' : 'Attach file or image'}
                  >
                    <Paperclip size={20} />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && !filePreview) handleFileSelection(file);
                        e.target.value = '';
                      }}
                      disabled={isUploadingFile || !!filePreview}
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
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
          </div>
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
        <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50"
          onClick={() => setShowCreateGroup(false)}>
          <div
            className="bg-white rounded-lg shadow-xl w-96 p-6 max-h-96 overflow-y-auto"
            style={{ backgroundColor: currentTheme.surface || currentTheme.background || '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
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
                      onChange={() => { }}
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
        <div className="fixed inset-0 bg-white/70   flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg shadow-xl w-96 p-6 max-h-96 overflow-y-auto"
            style={{ backgroundColor: currentTheme.surface || currentTheme.background || '#ffffff' }}
          >
            <div 
              className="flex items-center justify-between mb-4 pb-4 border-b"
              style={{ 
                backgroundColor: currentTheme.surface || currentTheme.background || '#ffffff',
                borderColor: currentTheme.border 
              }}
            >
              <h2 className="text-xl font-bold" style={{ color: currentTheme.text }}>
                Manage Members in {selectedGroup.name}
              </h2>
              <button
                onClick={() => setShowAddMember(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {isCurrentUserGroupAdmin(selectedGroup) && (
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2" style={{ color: currentTheme.text }}>
                  Current Members
                </label>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {(selectedGroup.members || []).map((member: any) => {
                    const memberId = getMemberId(member) || '';
                    const isSelf = memberId === currentUserId;

                    return (
                      <div
                        key={memberId}
                        className="flex items-center justify-between p-2 rounded-lg"
                        style={{ backgroundColor: currentTheme.input }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {member.userImage ? (
                            <img
                              src={member.userImage}
                              alt={member.userName}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                              style={{ backgroundColor: `${currentTheme.primary}25`, color: currentTheme.primary }}
                            >
                              {(member.userName || '?').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: currentTheme.text }}>
                              {member.userName} {isSelf ? '(you)' : ''}
                            </p>
                            <p className="text-xs uppercase" style={{ color: currentTheme.textSecondary }}>
                              {member.role}
                            </p>
                          </div>
                        </div>
                        {!isSelf && (
                          <button
                            onClick={() => handleRemoveMemberFromGroup(memberId)}
                            className="px-2 py-1 rounded text-xs font-semibold transition hover:opacity-90"
                            style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                      className={`flex items-center p-2 rounded cursor-pointer ${alreadyMember ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-70'
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
                        onChange={() => { }}
                        className="mr-3"
                      />
                      <img
                        src={conv.friend.avatar}
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
                disabled={!isCurrentUserGroupAdmin(selectedGroup) || selectedMembers.length === 0}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: currentTheme.primary, opacity: !isCurrentUserGroupAdmin(selectedGroup) || selectedMembers.length === 0 ? 0.5 : 1 }}
              >
                Add Members
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: currentTheme.surface }}
          >
            {/* Close Button */}
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-700 transition font-bold text-xl z-10"
              title="Close (Esc)"
            >
              ✕
            </button>

            {/* Image Display */}
            <div className="flex items-center justify-center flex-1 p-4 w-full">
              <img
                src={expandedImage.url}
                alt={expandedImage.name}
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = '';
                  if (e.currentTarget.parentElement?.querySelector('[data-error-msg]')) {
                    (e.currentTarget.parentElement.querySelector('[data-error-msg]') as HTMLElement).style.display = 'block';
                  }
                }}
              />
              <div
                data-error-msg
                className="hidden text-center"
                style={{ color: currentTheme.textSecondary }}
              >
                <p>Failed to load image</p>
              </div>
            </div>

            {/* Image Info and Actions Footer */}
            <div
              className="w-full border-t p-4 flex flex-col sm:flex-row items-center justify-between gap-3"
              style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.input }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: currentTheme.text }}>
                  {expandedImage.name}
                </p>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    // Get proper filename with extension
                    let filename = expandedImage.name || 'image.jpg';
                    
                    // Ensure filename has image extension
                    if (!filename.includes('.')) {
                      filename = `${filename}.jpg`;
                    }
                    
                    // Download using fetch
                    fetch(expandedImage.url)
                      .then(response => response.blob())
                      .then(blob => {
                        const link = document.createElement('a');
                        const url = window.URL.createObjectURL(blob);
                        link.href = url;
                        link.download = filename;
                        document.body.appendChild(link);
                        link.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(link);
                        showToast.success(`Downloaded: ${filename}`);
                      })
                      .catch(err => {
                        console.error('Download error:', err);
                        showToast.error('Failed to download image');
                      });
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold text-sm"
                  title="Download image"
                >
                  <Download size={16} /> Download
                </button>
                <a
                  href={expandedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition font-semibold text-sm"
                  style={{ backgroundColor: currentTheme.primary, color: 'white' }}
                  title="Open in new tab"
                >
                  <Search size={16} /> View
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {expandedFile && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedFile(null)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: currentTheme.surface }}
          >
            {/* Close Button */}
            <button
              onClick={() => setExpandedFile(null)}
              className="absolute top-4 right-4 bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-700 transition font-bold text-xl"
              title="Close (Esc)"
            >
              ✕
            </button>

            {/* File Icon */}
            <div className="flex items-center justify-center p-8 rounded-xl mb-4" style={{ backgroundColor: currentTheme.input }}>
              <Paperclip size={56} style={{ color: currentTheme.primary }} />
            </div>

            {/* File Details */}
            <div className="space-y-3 mb-6">
              <div>
                <h3 className="text-lg font-bold overflow-hidden text-ellipsis" style={{ color: currentTheme.text }}>
                  {expandedFile.name}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm" style={{ color: currentTheme.textSecondary }}>
                <div>
                  <p className="text-xs uppercase font-semibold opacity-75">File Size</p>
                  <p style={{ color: currentTheme.text }} className="font-medium">
                    {(expandedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold opacity-75">File Type</p>
                  <p style={{ color: currentTheme.text }} className="font-medium">
                    {expandedFile.type || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  // Get proper filename with extension
                  let filename = expandedFile.name || 'file';
                  
                  // Ensure filename has proper extension
                  if (!filename.includes('.') && expandedFile.type) {
                    const ext = expandedFile.type.split('/').pop()?.split(';')[0] || 'bin';
                    filename = `${filename.split('.')[0]}.${ext}`;
                  }
                  
                  // Download using fetch to ensure proper file handling
                  fetch(expandedFile.url)
                    .then(response => response.blob())
                    .then(blob => {
                      const link = document.createElement('a');
                      const url = window.URL.createObjectURL(blob);
                      link.href = url;
                      link.download = filename;
                      document.body.appendChild(link);
                      link.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(link);
                      showToast.success(`Downloaded: ${filename}`);
                    })
                    .catch(err => {
                      console.error('Download error:', err);
                      showToast.error('Failed to download file');
                    });
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold text-sm"
                title="Download file"
              >
                <Download size={18} /> Download
              </button>
              <a
                href={expandedFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition font-semibold text-sm"
                style={{ backgroundColor: currentTheme.primary, color: 'white' }}
                title="Open in new tab"
              >
                <Search size={18} /> Open
              </a>
            </div>

            {/* Footer Info */}
            <p className="text-xs mt-4 text-center" style={{ color: currentTheme.textSecondary }}>
              Click "Download" to save to your device, or "Open" to view in a new tab
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
