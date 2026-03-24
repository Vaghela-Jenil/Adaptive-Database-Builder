"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  Plus,
  Trash2,
  Search,
  Star,
  Calendar,
  Edit2,
  Check,
  AlertCircle,
  Loader,
  AlertTriangle,
  Square,
  History,
  MoveLeft,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "@clerk/nextjs";

interface Task {
  _id?: string;
  id: string;
  listId: string;
  listName: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  lastDate: string;
  lastTime?: string;
  createdDate: string;
  starred: boolean;
  completed: boolean;
  order: number;
}

interface TaskList {
  id: string;
  name: string;
  tasks: Task[];
  order: number;
}

const getMeridiemFromTime = (time?: string): "AM" | "PM" => {
  if (!time || !time.includes(":")) return "AM";
  const [hours] = time.split(":").map(Number);
  if (!Number.isFinite(hours)) return "AM";
  return hours >= 12 ? "PM" : "AM";
};

const applyMeridiemToTime = (time: string, meridiem: "AM" | "PM"): string => {
  const baseTime = time && time.includes(":") ? time : "12:00";
  const [hoursRaw, minutesRaw] = baseTime.split(":");
  let hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "12:00";

  if (meridiem === "AM") {
    if (hours >= 12) hours -= 12;
  } else {
    if (hours < 12) hours += 12;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export default function TaskManager({
  isOpen,
  onClose,
  onTasksUpdate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onTasksUpdate?: () => void;
}) {
  const { currentTheme } = useTheme();
  const { user } = useUser();
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskData, setEditingTaskData] = useState<Partial<Task>>({});
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showNewTaskForm, setShowNewTaskForm] = useState<string | null>(null);
  const [newTaskData, setNewTaskData] = useState<Partial<Task>>({});
  const [loading, setLoading] = useState(true);
  const [syncingState, setSyncingState] = useState<Record<string, boolean>>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");

  // Fetch tasks from database
  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen, user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/tasks");
      setTaskLists(response.data.taskLists || []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
      onTasksUpdate?.();
    }
  };

  const formatDateTime = (dateStr: string, timeStr?: string) => {
    let result = new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (timeStr) {
      result += " " + timeStr;
    }
    return result;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOverdue = (lastDate: string, lastTime: string | undefined, completed: boolean) => {
    if (completed) return false;
    const now = new Date();
    const deadlineDate = new Date(lastDate);
    deadlineDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    // If deadline is in the past
    if (deadlineDate < now) return true;
    
    // If deadline is today, check time
    if (deadlineDate.getTime() === now.getTime()) {
      if (!lastTime) return false; // No time set, not overdue
      const [hours, minutes] = lastTime.split(":").map(Number);
      const currentTime = new Date();
      const deadlineTime = new Date();
      deadlineTime.setHours(hours, minutes, 0, 0);
      return currentTime > deadlineTime;
    }
    
    return false;
  };

  const getTasksForDate = () => {
    const dateToCheck = selectedListId ? new Date().toISOString().split("T")[0] : selectedDate;
    
    return taskLists.flatMap((list) =>
      list.tasks.filter(
        (task) =>
          task.dueDate === dateToCheck &&
          (!selectedListId || task.listId === selectedListId) &&
          (searchQuery === "" ||
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    );
  };

  const isValidLastDate = (lastDate: string, lastTime?: string, dueDate?: string, dueTime?: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastDateObj = new Date(lastDate);
    lastDateObj.setHours(0, 0, 0, 0);
    
    // Check if due date and last date are the same
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      dueDateObj.setHours(0, 0, 0, 0);
      
      if (lastDateObj.getTime() === dueDateObj.getTime()) {
        // Same date - check if times are different
        if (!dueTime || !lastTime) {
          // If either time is not set, times are considered different
          return true;
        }
        const [dueHours, dueMinutes] = dueTime.split(":").map(Number);
        const [lastHours, lastMinutes] = lastTime.split(":").map(Number);
        const dueTimeInMinutes = dueHours * 60 + dueMinutes;
        const lastTimeInMinutes = lastHours * 60 + lastMinutes;
        // Return true only if times are different
        return dueTimeInMinutes !== lastTimeInMinutes;
      }
    }
    
    if (lastDateObj > today) return true;
    if (lastDateObj.getTime() === today.getTime()) {
      if (!lastTime) return true;
      const [hours, minutes] = lastTime.split(":").map(Number);
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const selectedTimeInMinutes = hours * 60 + minutes;
      return selectedTimeInMinutes >= currentTime;
    }
    return false;
  };

  const getTasksCountForDate = (date?: string) => {
    const dateToCheck = date || new Date().toISOString().split("T")[0];
    return taskLists.flatMap((list) => list.tasks).filter((task) => task.dueDate === dateToCheck).length;
  };

  const getCompletedTasks = () => {
    let completed = taskLists.flatMap((list) =>
      list.tasks.filter((task) => task.completed)
    );

    // Filter by search query
    if (historySearchQuery) {
      completed = completed.filter(
        (task) =>
          task.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(historySearchQuery.toLowerCase())
      );
    }

    // Filter by creation date range
    if (historyStartDate) {
      completed = completed.filter((task) => task.createdDate >= historyStartDate);
    }
    if (historyEndDate) {
      completed = completed.filter((task) => task.createdDate <= historyEndDate);
    }

    // Sort by completion date (latest first)
    return completed.sort((a, b) => 
      new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
    );
  };

  const addNewList = async () => {
    if (!newListName.trim()) return;
    try {
      setSyncingState({ ...syncingState, newList: true });
      const listId = Date.now().toString();
      const response = await axios.post("/api/tasks", {
        type: "list",
        data: {
          id: listId,
          name: newListName,
          order: taskLists.length,
        },
      });

      if (response.status === 201) {
        const newList: TaskList = {
          id: listId,
          name: newListName,
          tasks: [],
          order: taskLists.length,
        };
        setTaskLists([...taskLists, newList]);
        setNewListName("");
        setShowNewListForm(false);
      }
    } catch (error) {
      console.error("Failed to add list:", error);
    } finally {
      setSyncingState({ ...syncingState, newList: false });
    }
  };

  const addNewTask = async (listId: string) => {
    if (!newTaskData.title?.trim()) return;
    if (!isValidLastDate(newTaskData.lastDate || new Date().toISOString().split("T")[0], newTaskData.lastTime, newTaskData.dueDate, newTaskData.dueTime)) {
      return;
    }
    try {
      setSyncingState({ ...syncingState, newTask: true });
      const list = taskLists.find((l) => l.id === listId);
      if (!list) return;

      // Generate unique task ID
      const taskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const response = await axios.post("/api/tasks", {
        type: "task",
        data: {
          id: taskId,
          listId,
          listName: list.name,
          title: newTaskData.title,
          description: newTaskData.description || "",
          dueDate: newTaskData.dueDate || new Date().toISOString().split("T")[0],
          dueTime: newTaskData.dueTime || "",
          lastDate: newTaskData.lastDate || new Date().toISOString().split("T")[0],
          lastTime: newTaskData.lastTime || "",
          createdDate: new Date().toISOString().split("T")[0],
          starred: false,
          completed: false,
          order: list.tasks.length,
        },
      });

      if (response.status === 201) {
        await fetchTasks();
        setNewTaskData({});
        setShowNewTaskForm(null);
      }
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setSyncingState({ ...syncingState, newTask: false });
    }
  };

  const toggleTaskStar = async (listId: string, task: Task) => {
    try {
      setSyncingState({ ...syncingState, [task.id]: true });
      await axios.put(`/api/tasks/${task._id || task.id}`, {
        type: "task",
        data: { starred: !task.starred },
      });
      await fetchTasks();
    } catch (error) {
      console.error("Failed to toggle star:", error);
    } finally {
      setSyncingState({ ...syncingState, [task.id]: false });
    }
  };

  const toggleTaskComplete = async (task: Task) => {
    try {
      setSyncingState({ ...syncingState, [task.id]: true });
      await axios.put(`/api/tasks/${task._id || task.id}`, {
        type: "task",
        data: { completed: !task.completed },
      });
      await fetchTasks();
      // Notify parent to update the navbar count
      onTasksUpdate?.();
    } catch (error) {
      console.error("Failed to toggle complete:", error);
    } finally {
      setSyncingState({ ...syncingState, [task.id]: false });
    }
  };

  const updateTask = async (task: Task) => {
    if (!editingTaskData.title?.trim()) return;
    try {
      setSyncingState({ ...syncingState, [task.id]: true });
      await axios.put(`/api/tasks/${task._id || task.id}`, {
        type: "task",
        data: editingTaskData,
      });
      await fetchTasks();
      setEditingTaskId(null);
      setEditingTaskData({});
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setSyncingState({ ...syncingState, [task.id]: false });
    }
  };

  const deleteTask = async (task: Task) => {
    try {
      setSyncingState({ ...syncingState, [task.id]: true });
      await axios.delete(`/api/tasks/${task._id || task.id}`, {
        data: { type: "task" },
      });
      await fetchTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setSyncingState({ ...syncingState, [task.id]: false });
    }
  };

  const deleteAllTasks = async (listId: string) => {
    try {
      setSyncingState({ ...syncingState, deleteAll: true });
      const tasksToDelete = getTasksForDate().filter((t) => t.listId === listId && t.completed);
      for (const task of tasksToDelete) {
        await axios.delete(`/api/tasks/${task._id || task.id}`, {
          data: { type: "task" },
        });
      }
      await fetchTasks();
    } catch (error) {
      console.error("Failed to delete all tasks:", error);
    } finally {
      setSyncingState({ ...syncingState, deleteAll: false });
    }
  };

  const deleteList = (listId: string) => {
    setDeleteConfirmation(listId);
  };

  const confirmDeleteList = async (listId: string) => {
    try {
      setSyncingState({ ...syncingState, [listId]: true });
      await axios.delete(`/api/tasks/${listId}`, {
        data: { type: "list" },
      });
      await fetchTasks();
      setDeleteConfirmation(null);
    } catch (error) {
      console.error("Failed to delete list:", error);
    } finally {
      setSyncingState({ ...syncingState, [listId]: false });
    }
  };

  const updateListName = async (listId: string) => {
    if (!editingListName.trim()) return;
    try {
      setSyncingState({ ...syncingState, [listId]: true });
      await axios.put(`/api/tasks/${listId}`, {
        type: "list",
        data: { name: editingListName },
      });
      await fetchTasks();
      setEditingListId(null);
      setEditingListName("");
    } catch (error) {
      console.error("Failed to update list name:", error);
    } finally {
      setSyncingState({ ...syncingState, [listId]: false });
    }
  };

  const tasksForDate = getTasksForDate();
  const incompletedTasks = tasksForDate.filter((t) => !t.completed);
  const completedTasks = tasksForDate.filter((t) => t.completed);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-7xl max-h-[95vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ backgroundColor: currentTheme.surface }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: currentTheme.border }}
          >
            <h2 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
              {showHistory ? "Completed Tasks History" : "Task Manager"}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowHistory(!showHistory);
                  if (!showHistory) {
                    setHistorySearchQuery("");
                    setHistoryStartDate("");
                    setHistoryEndDate("");
                  }
                }}
                className="px-3 py-2 rounded-lg font-medium text-sm transition-all"
                style={{
                  backgroundColor: showHistory ? currentTheme.primary : currentTheme.background,
                  color: showHistory ? "white" : currentTheme.text,
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                {showHistory ? 
                (
                    ( 
                   <div className="flex gap-1">
                     <MoveLeft className="w-4 h-4" /> 
                    <span>Active</span>
                   </div>
                    )
                ) 
                : ( 
                   <div className="flex gap-1">
                     <History className="w-4 h-4" /> 
                    <span>History</span>
                   </div>
                    )}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:opacity-70"
                style={{ backgroundColor: currentTheme.background }}
              >
                <X className="w-5 h-5" style={{ color: currentTheme.text }} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Task Lists */}
            <div
              className="w-72 border-r overflow-y-auto p-4 space-y-4"
              style={{ borderColor: currentTheme.border }}
            >
              <div className="flex items-center justify-between">
                <h3
                  className="font-semibold"
                  style={{ color: currentTheme.text }}
                >
                  Lists
                </h3>
                <button
                  onClick={() => setShowNewListForm(true)}
                  className="p-1 rounded-lg"
                  style={{
                    backgroundColor: currentTheme.primary,
                  }}
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>

              {showNewListForm && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="List name..."
                    className="w-full px-3 py-2 rounded-lg border outline-none transition-all"
                    style={{
                      backgroundColor: currentTheme.background,
                      borderColor: currentTheme.border,
                      color: currentTheme.text,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addNewList();
                      if (e.key === "Escape") setShowNewListForm(false);
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addNewList}
                      className="flex-1 px-3 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: currentTheme.primary }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowNewListForm(false)}
                      className="flex-1 px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: currentTheme.background,
                        color: currentTheme.text,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                {taskLists.map((list) => (
                  <motion.div
                    key={list.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="group p-3 rounded-lg transition-all"
                    style={{
                      backgroundColor: currentTheme.background,
                      border: `1px solid ${currentTheme.border}`,
                    }}
                  >
                    {editingListId === list.id ? (
                      <input
                        type="text"
                        value={editingListName}
                        onChange={(e) => setEditingListName(e.target.value)}
                        className="w-full px-2 py-1 rounded border outline-none"
                        style={{
                          backgroundColor: currentTheme.surface,
                          borderColor: currentTheme.primary,
                          color: currentTheme.text,
                        }}
                        onBlur={() => {
                          if (editingListName.trim() !== list.name && editingListName.trim()) {
                            updateListName(list.id);
                          } else {
                            setEditingListId(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            updateListName(list.id);
                          if (e.key === "Escape")
                            setEditingListId(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div
                          className="cursor-pointer flex-1 p-2 rounded-lg transition-all"
                          onClick={() => {
                            if (selectedListId === list.id) {
                              setSelectedListId(null);
                            } else {
                              setSelectedListId(list.id);
                            }
                          }}
                          onDoubleClick={() => {
                            setEditingListId(list.id);
                            setEditingListName(list.name);
                          }}
                          style={{
                            backgroundColor: selectedListId === list.id ? currentTheme.primary + "20" : "transparent",
                            borderLeft: selectedListId === list.id ? `3px solid ${currentTheme.primary}` : "none",
                          }}
                        >
                          <p
                            className="font-medium"
                            style={{ color: currentTheme.text }}
                          >
                            {list.name}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: currentTheme.textSecondary }}
                          >
                            {list.tasks.length} tasks
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingListId(list.id);
                              setEditingListName(list.name);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                            title="Edit list"
                            style={{
                              backgroundColor: currentTheme.primary + "20",
                              color: currentTheme.primary,
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteList(list.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                            title="Delete list"
                            style={{
                              backgroundColor: "#ef444410",
                              color: "#ef4444",
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Main Content - Calendar & Tasks */}
            <div className="flex-1 overflow-y-auto flex flex-col p-6 space-y-6">
              {/* Selected List Indicator */}
              {selectedListId && (
                <div className="p-3 rounded-lg border-l-4" style={{
                  backgroundColor: currentTheme.primary + "10",
                  borderColor: currentTheme.primary,
                }}>
                  <p>
                    <span style={{ color: currentTheme.textSecondary }}>Showing tasks from: </span>
                    <span className="font-semibold" style={{ color: currentTheme.primary }}>
                      {taskLists.find(l => l.id === selectedListId)?.name}
                    </span>
                  </p>
                  <button
                    onClick={() => setSelectedListId(null)}
                    className="text-xs mt-2 px-2 py-1 rounded"
                    style={{
                      backgroundColor: currentTheme.primary + "20",
                      color: currentTheme.primary,
                    }}
                  >
                    Show all lists
                  </button>
                </div>
              )}

              {/* Date Picker */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5" style={{ color: currentTheme.primary }} />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2 rounded-lg border outline-none"
                    style={{
                      backgroundColor: currentTheme.background,
                      borderColor: currentTheme.border,
                      color: currentTheme.text,
                    }}
                  />
                  <div className="px-3 py-2 rounded-lg" style={{
                    backgroundColor: currentTheme.primary + "20",
                  }}>
                    <span className="text-sm font-medium" style={{ color: currentTheme.primary }}>
                      {getTasksCountForDate(selectedDate)} tasks
                    </span>
                  </div>
                </div>

                {/* Search */}
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: currentTheme.textSecondary }}
                  />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border outline-none"
                    style={{
                      backgroundColor: currentTheme.background,
                      borderColor: currentTheme.border,
                      color: currentTheme.text,
                    }}
                  />
                </div>
              </div>

              {/* Tasks Section */}
              <div className="space-y-6 flex-1">
                {/* Incomplete Tasks */}
                {incompletedTasks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3
                        className="font-semibold"
                        style={{ color: currentTheme.text }}
                      >
                        Active Tasks
                      </h3>
                      {taskLists.length > 0 && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowNewTaskForm(taskLists[0].id)}
                          className="p-2 rounded-lg transition-all"
                          title="Add task"
                          style={{
                            backgroundColor: currentTheme.primary,
                            color: "white",
                          }}
                        >
                          <Plus className="w-5 h-5" />
                        </motion.button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {incompletedTasks.map((task, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group p-4 rounded-lg transition-all border"
                          style={{
                            backgroundColor: currentTheme.background,
                            borderColor: isOverdue(task.lastDate, task.lastTime, task.completed)
                              ? "#ef4444"
                              : currentTheme.border,
                            borderLeftWidth: isOverdue(task.lastDate, task.lastTime, task.completed)
                              ? "4px"
                              : "1px",
                          }}
                        >
                          {editingTaskId === (task._id || task.id) ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editingTaskData.title || ""}
                                onChange={(e) =>
                                  setEditingTaskData({
                                    ...editingTaskData,
                                    title: e.target.value,
                                  })
                                }
                                placeholder="Task title"
                                className="w-full px-3 py-2 rounded border outline-none"
                                style={{
                                  backgroundColor: currentTheme.surface,
                                  borderColor: currentTheme.primary,
                                  color: currentTheme.text,
                                }}
                              />
                              <textarea
                                value={editingTaskData.description || ""}
                                onChange={(e) =>
                                  setEditingTaskData({
                                    ...editingTaskData,
                                    description: e.target.value,
                                  })
                                }
                                placeholder="Description (optional)"
                                className="w-full px-3 py-2 rounded border outline-none text-sm"
                                rows={2}
                                style={{
                                  backgroundColor: currentTheme.surface,
                                  borderColor: currentTheme.primary,
                                  color: currentTheme.text,
                                }}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label
                                    className="text-xs"
                                    style={{ color: currentTheme.textSecondary }}
                                  >
                                    Due Date
                                  </label>
                                  <input
                                    type="date"
                                    value={editingTaskData.dueDate || ""}
                                    onChange={(e) =>
                                      setEditingTaskData({
                                        ...editingTaskData,
                                        dueDate: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 rounded border outline-none text-sm"
                                    style={{
                                      backgroundColor: currentTheme.surface,
                                      borderColor: currentTheme.primary,
                                      color: currentTheme.text,
                                    }}
                                  />
                                </div>
                                <div>
                                  <label
                                    className="text-xs"
                                    style={{ color: currentTheme.textSecondary }}
                                  >
                                    Due Time
                                  </label>
                                  <div className="grid grid-cols-[1fr_80px] gap-2">
                                    <input
                                      type="time"
                                      value={editingTaskData.dueTime || ""}
                                      onChange={(e) =>
                                        setEditingTaskData({
                                          ...editingTaskData,
                                          dueTime: e.target.value,
                                        })
                                      }
                                      className="w-full px-3 py-2 rounded border outline-none text-sm"
                                      style={{
                                        backgroundColor: currentTheme.surface,
                                        borderColor: currentTheme.primary,
                                        color: currentTheme.text,
                                      }}
                                    />
                                    <select
                                      value={getMeridiemFromTime(editingTaskData.dueTime)}
                                      onChange={(e) =>
                                        setEditingTaskData({
                                          ...editingTaskData,
                                          dueTime: applyMeridiemToTime(
                                            editingTaskData.dueTime || "12:00",
                                            e.target.value as "AM" | "PM"
                                          ),
                                        })
                                      }
                                      className="w-full px-2 py-2 rounded border outline-none text-sm"
                                      style={{
                                        backgroundColor: currentTheme.surface,
                                        borderColor: currentTheme.primary,
                                        color: currentTheme.text,
                                      }}
                                    >
                                      <option value="AM">AM</option>
                                      <option value="PM">PM</option>
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label
                                    className="text-xs"
                                    style={{ color: currentTheme.textSecondary }}
                                  >
                                    Last Date
                                  </label>
                                  <input
                                    type="date"
                                    value={editingTaskData.lastDate || ""}
                                    onChange={(e) =>
                                      setEditingTaskData({
                                        ...editingTaskData,
                                        lastDate: e.target.value,
                                      })
                                    }
                                    min={editingTaskData.dueDate || undefined}
                                    className="w-full px-3 py-2 rounded border outline-none text-sm"
                                    style={{
                                      backgroundColor: currentTheme.surface,
                                      borderColor: currentTheme.primary,
                                      color: currentTheme.text,
                                    }}
                                  />
                                </div>
                                <div>
                                  <label
                                    className="text-xs"
                                    style={{ color: currentTheme.textSecondary }}
                                  >
                                    Last Time
                                  </label>
                                  <div className="grid grid-cols-[1fr_80px] gap-2">
                                    <input
                                      type="time"
                                      value={editingTaskData.lastTime || ""}
                                      onChange={(e) =>
                                        setEditingTaskData({
                                          ...editingTaskData,
                                          lastTime: e.target.value,
                                        })
                                      }
                                      className="w-full px-3 py-2 rounded border outline-none text-sm"
                                      style={{
                                        backgroundColor: currentTheme.surface,
                                        borderColor: currentTheme.primary,
                                        color: currentTheme.text,
                                      }}
                                    />
                                    <select
                                      value={getMeridiemFromTime(editingTaskData.lastTime)}
                                      onChange={(e) =>
                                        setEditingTaskData({
                                          ...editingTaskData,
                                          lastTime: applyMeridiemToTime(
                                            editingTaskData.lastTime || "12:00",
                                            e.target.value as "AM" | "PM"
                                          ),
                                        })
                                      }
                                      className="w-full px-2 py-2 rounded border outline-none text-sm"
                                      style={{
                                        backgroundColor: currentTheme.surface,
                                        borderColor: currentTheme.primary,
                                        color: currentTheme.text,
                                      }}
                                    >
                                      <option value="AM">AM</option>
                                      <option value="PM">PM</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    updateTask(task)
                                  }
                                  className="flex-1 px-3 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                                  style={{
                                    backgroundColor: currentTheme.primary,
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingTaskId(null);
                                    setEditingTaskData({});
                                  }}
                                  className="flex-1 px-3 py-2 rounded-lg border-2 font-medium hover:opacity-80 transition-opacity"
                                  style={{
                                    borderColor: currentTheme.border,
                                    backgroundColor: currentTheme.surface,
                                    color: currentTheme.text,
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start gap-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      toggleTaskComplete(task)
                                    }
                                    className="rounded-lg"
                                    style={{
                                      backgroundColor: currentTheme.surface,
                                      color: currentTheme.primary,
                                    }}
                                  >
                                    <Square className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      toggleTaskStar(task.listId, task)
                                    }
                                    className="p-3 rounded-lg"
                                  >
                                    <Star
                                      className="w-5 h-5"
                                      fill={
                                        task.starred
                                          ? currentTheme.primary
                                          : "none"
                                      }
                                      style={{
                                        color: task.starred
                                          ? currentTheme.primary
                                          : currentTheme.textSecondary,
                                      }}
                                    />
                                  </button>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p
                                    className="font-medium wrap-break-word"
                                    style={{ color: currentTheme.text }}
                                  >
                                    {task.title}
                                  </p>
                                  {task.description && (
                                    <p
                                      className="text-sm wrap-break-word mt-1"
                                      style={{ color: currentTheme.textSecondary }}
                                    >
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-4 mt-2 text-xs">
                                    <div
                                      className="flex items-center gap-1"
                                      style={{
                                        color: currentTheme.textSecondary,
                                      }}
                                    >
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        Created: {formatDate(task.createdDate)}
                                      </span>
                                    </div>
                                    <div
                                      className="flex items-center gap-1"
                                      style={{
                                        color: isOverdue(
                                          task.lastDate,
                                          task.lastTime,
                                          task.completed
                                        )
                                          ? "#ef4444"
                                          : currentTheme.textSecondary,
                                      }}
                                    >
                                      <AlertCircle className="w-3 h-3" />
                                      <span>
                                        Due: {formatDateTime(task.lastDate, task.lastTime)}
                                      </span>
                                    </div>
                                  </div>
                                  <div
                                    className="text-xs mt-2 px-2 py-1 rounded w-fit"
                                    style={{
                                      backgroundColor:
                                        currentTheme.primary + "20",
                                      color: currentTheme.primary,
                                    }}
                                  >
                                    {taskLists
                                      .find((l) => l.id === task.listId)
                                      ?.name || "Unknown"}
                                  </div>
                                </div>

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                  <button
                                    onClick={() => {
                                      if (editingTaskId === (task._id || task.id)) {
                                        // Click again to close edit
                                        setEditingTaskId(null);
                                        setEditingTaskData({});
                                      } else {
                                        // Open edit for this task only
                                        setEditingTaskId(task._id || task.id);
                                        setEditingTaskData({ ...task });
                                      }
                                    }}
                                    className={`p-2 rounded-lg hover:opacity-80 transition-all ${
                                      editingTaskId === task.id ? "ring-2" : ""
                                    }`}
                                    style={{
                                      backgroundColor: editingTaskId === task.id ? currentTheme.primary + "30" : currentTheme.background,
                                      color: currentTheme.primary,
                                      ...(editingTaskId === task.id && {
                                        boxShadow: `0 0 0 2px ${currentTheme.primary}`,
                                      }),
                                    }}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteTask(task)
                                    }
                                    className="p-2 rounded-lg hover:opacity-80 transition-opacity"
                                    style={{
                                      backgroundColor: "#ef444410",
                                      color: "#ef4444",
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Task - Modal */}
                {!showHistory && (
                  <AnimatePresence>
                    {showNewTaskForm && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={() => {
                          setShowNewTaskForm(null);
                          setNewTaskData({});
                        }}
                      >
                        {/* Backdrop */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0"
                          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
                        />

                        {/* Modal */}
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.95, opacity: 0 }}
                          onClick={(e) => e.stopPropagation()}
                          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                          style={{ backgroundColor: currentTheme.surface }}
                        >
                          <div
                            className="sticky top-0 flex items-center justify-between p-6 border-b"
                            style={{ borderColor: currentTheme.border }}
                          >
                            <h2 className="text-xl font-bold" style={{ color: currentTheme.text }}>
                              Create New Task
                            </h2>
                            <button
                              onClick={() => {
                                setShowNewTaskForm(null);
                                setNewTaskData({});
                              }}
                              className="p-2 rounded-lg hover:opacity-70"
                              style={{ backgroundColor: currentTheme.background }}
                            >
                              <X className="w-5 h-5" style={{ color: currentTheme.text }} />
                            </button>
                          </div>

                          <div className="p-6 space-y-4">
                            <select
                              value={showNewTaskForm}
                              onChange={(e) => setShowNewTaskForm(e.target.value)}
                              className="w-full px-3 py-2 rounded border outline-none"
                              style={{
                                backgroundColor: currentTheme.surface,
                                borderColor: currentTheme.border,
                                color: currentTheme.text,
                              }}
                            >
                              {taskLists.map((list) => (
                                <option key={list.id} value={list.id}>
                                  {list.name}
                                </option>
                              ))}
                            </select>

                            <div>
                              <label
                                className="text-xs block mb-2"
                                style={{ color: currentTheme.textSecondary }}
                              >
                                Task Title *
                              </label>
                              <input
                                type="text"
                                placeholder="Task title..."
                                value={newTaskData.title || ""}
                                onChange={(e) =>
                                  setNewTaskData({
                                    ...newTaskData,
                                    title: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 rounded border outline-none"
                                style={{
                                  backgroundColor: currentTheme.surface,
                                  borderColor: currentTheme.border,
                                  color: currentTheme.text,
                                }}
                              />
                            </div>

                            <div>
                              <label
                                className="text-xs block mb-2"
                                style={{ color: currentTheme.textSecondary }}
                              >
                                Description
                              </label>
                              <textarea
                                placeholder="Description (optional)..."
                                value={newTaskData.description || ""}
                                onChange={(e) =>
                                  setNewTaskData({
                                    ...newTaskData,
                                    description: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 rounded border outline-none text-sm"
                                rows={3}
                                style={{
                                  backgroundColor: currentTheme.surface,
                                  borderColor: currentTheme.border,
                                  color: currentTheme.text,
                                }}
                              />
                            </div>

                            <div>
                              <label
                                className="text-xs block mb-2"
                                style={{ color: currentTheme.textSecondary }}
                              >
                                Due Date
                              </label>
                              <input
                                type="date"
                                value={newTaskData.dueDate || selectedDate}
                                onChange={(e) =>
                                  setNewTaskData({
                                    ...newTaskData,
                                    dueDate: e.target.value,
                                  })
                                }
                                max={newTaskData.lastDate || undefined}
                                className="w-full px-3 py-2 rounded border outline-none text-sm"
                                style={{
                                  backgroundColor: currentTheme.surface,
                                  borderColor: currentTheme.border,
                                  color: currentTheme.text,
                                }}
                              />
                            </div>

                            <div>
                              <label
                                className="text-xs block mb-2"
                                style={{ color: currentTheme.textSecondary }}
                              >
                                Due Time (optional)
                              </label>
                              <div className="grid grid-cols-[1fr_80px] gap-2">
                                <input
                                  type="time"
                                  value={newTaskData.dueTime || ""}
                                  onChange={(e) =>
                                    setNewTaskData({
                                      ...newTaskData,
                                      dueTime: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 rounded border outline-none text-sm"
                                  style={{
                                    backgroundColor: currentTheme.surface,
                                    borderColor: currentTheme.border,
                                    color: currentTheme.text,
                                  }}
                                />
                                <select
                                  value={getMeridiemFromTime(newTaskData.dueTime)}
                                  onChange={(e) =>
                                    setNewTaskData({
                                      ...newTaskData,
                                      dueTime: applyMeridiemToTime(
                                        newTaskData.dueTime || "12:00",
                                        e.target.value as "AM" | "PM"
                                      ),
                                    })
                                  }
                                  className="w-full px-2 py-2 rounded border outline-none text-sm"
                                  style={{
                                    backgroundColor: currentTheme.surface,
                                    borderColor: currentTheme.border,
                                    color: currentTheme.text,
                                  }}
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label
                                className="text-xs block mb-2"
                                style={{ color: currentTheme.textSecondary }}
                              >
                                Last Date (Deadline) *
                              </label>
                              <input
                                type="date"
                                value={newTaskData.lastDate || selectedDate}
                                onChange={(e) =>
                                  setNewTaskData({
                                    ...newTaskData,
                                    lastDate: e.target.value,
                                  })
                                }
                                min={newTaskData.dueDate || new Date().toISOString().split("T")[0]}
                                className="w-full px-3 py-2 rounded border outline-none text-sm"
                                style={{
                                  backgroundColor: currentTheme.surface,
                                  borderColor: currentTheme.border,
                                  color: currentTheme.text,
                                }}
                              />
                            </div>

                            <div>
                              <label
                                className="text-xs block mb-2"
                                style={{ color: currentTheme.textSecondary }}
                              >
                                Last Time (optional)
                              </label>
                              <div className="grid grid-cols-[1fr_80px] gap-2">
                                <input
                                  type="time"
                                  value={newTaskData.lastTime || ""}
                                  onChange={(e) =>
                                    setNewTaskData({
                                      ...newTaskData,
                                      lastTime: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 rounded border outline-none text-sm"
                                  style={{
                                    backgroundColor: currentTheme.surface,
                                    borderColor: currentTheme.border,
                                    color: currentTheme.text,
                                  }}
                                />
                                <select
                                  value={getMeridiemFromTime(newTaskData.lastTime)}
                                  onChange={(e) =>
                                    setNewTaskData({
                                      ...newTaskData,
                                      lastTime: applyMeridiemToTime(
                                        newTaskData.lastTime || "12:00",
                                        e.target.value as "AM" | "PM"
                                      ),
                                    })
                                  }
                                  className="w-full px-2 py-2 rounded border outline-none text-sm"
                                  style={{
                                    backgroundColor: currentTheme.surface,
                                    borderColor: currentTheme.border,
                                    color: currentTheme.text,
                                  }}
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>

                            {!isValidLastDate(newTaskData.lastDate || selectedDate, newTaskData.lastTime, newTaskData.dueDate, newTaskData.dueTime) && (
                              <div
                                className="text-sm p-3 rounded flex items-center gap-2"
                                style={{
                                  backgroundColor: "#fee2e2",
                                  color: "#991b1b",
                                }}
                              >
                                <AlertTriangle className="w-4 h-4" />
                                Last date must be today or later
                              </div>
                            )}

                            <div className="flex gap-2 pt-4">
                              <button
                                onClick={() =>
                                  addNewTask(showNewTaskForm as string)
                                }
                                disabled={!newTaskData.title?.trim() || !isValidLastDate(newTaskData.lastDate || selectedDate, newTaskData.lastTime, newTaskData.dueDate, newTaskData.dueTime)}
                                className="flex-1 px-3 py-2 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                                style={{
                                  backgroundColor: currentTheme.primary,
                                }}
                              >
                                Create Task
                              </button>
                              <button
                                onClick={() => {
                                  setShowNewTaskForm(null);
                                  setNewTaskData({});
                                }}
                                className="flex-1 px-3 py-2 rounded-lg border-2 font-medium transition-all hover:opacity-80"
                                style={{
                                  borderColor: currentTheme.border,
                                  color: currentTheme.text,
                                  backgroundColor: currentTheme.surface,
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

                {/* Add New Task Button */}
                {/* Add New Task Button */}
                {taskLists.length > 0 && !showHistory && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowNewTaskForm(taskLists[0].id)}
                    className="w-full p-3 rounded-lg border-2 border-dashed font-medium transition-all"
                    style={{
                      borderColor: currentTheme.primary,
                      color: currentTheme.primary,
                    }}
                  >
                    <Plus className="w-5 h-5 mx-auto" />
                  </motion.button>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3
                        className="font-semibold"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        Completed Tasks ({completedTasks.length})
                      </h3>
                      <button
                        onClick={() => {
                          completedTasks.forEach((task) => {
                            deleteTask(task);
                          });
                        }}
                        className="text-xs px-2 py-1 rounded opacity-50 hover:opacity-100"
                        style={{
                          backgroundColor: "#ef444410",
                          color: "#ef4444",
                        }}
                      >
                        Delete All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {completedTasks.map((task, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group p-4 rounded-lg transition-all border line-through"
                          style={{
                            backgroundColor: currentTheme.background,
                            borderColor: currentTheme.border,
                            opacity: 0.6,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() =>
                                toggleTaskComplete(task)
                              }
                              className="p-2 rounded-lg"
                              style={{
                                backgroundColor: currentTheme.primary + "20",
                                color: currentTheme.primary,
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </button>

                            <div className="flex-1 min-w-0">
                              <p
                                className="font-medium wrap-break-word"
                                style={{ color: currentTheme.text }}
                              >
                                {task.title}
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                deleteTask(task)
                              }
                              className="opacity-0 group-hover:opacity-100 p-2 rounded-lg"
                              style={{
                                backgroundColor: "#ef444410",
                                color: "#ef4444",
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {tasksForDate.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Calendar
                      className="w-12 h-12 mb-4 opacity-30"
                      style={{ color: currentTheme.textSecondary }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: currentTheme.textSecondary }}
                    >
                      No tasks for {formatDate(selectedDate)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* History View */}
            {showHistory && (
              <div className="flex-1 flex flex-col border-l overflow-hidden" style={{ borderColor: currentTheme.border }}>
                {/* History Filters */}
                <div className="p-4 border-b space-y-3" style={{ borderColor: currentTheme.border }}>
                  <div>
                    <label className="text-sm block mb-1" style={{ color: currentTheme.textSecondary }}>
                      Search
                    </label>
                    <input
                      type="text"
                      placeholder="Search completed tasks..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="w-full px-3 py-2 rounded border outline-none text-sm"
                      style={{
                        backgroundColor: currentTheme.surface,
                        borderColor: currentTheme.border,
                        color: currentTheme.text,
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs block mb-1" style={{ color: currentTheme.textSecondary }}>
                        From Date
                      </label>
                      <input
                        type="date"
                        value={historyStartDate}
                        onChange={(e) => setHistoryStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded border outline-none text-sm"
                        style={{
                          backgroundColor: currentTheme.surface,
                          borderColor: currentTheme.border,
                          color: currentTheme.text,
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs block mb-1" style={{ color: currentTheme.textSecondary }}>
                        To Date
                      </label>
                      <input
                        type="date"
                        value={historyEndDate}
                        onChange={(e) => setHistoryEndDate(e.target.value)}
                        min={historyStartDate || undefined}
                        className="w-full px-3 py-2 rounded border outline-none text-sm"
                        style={{
                          backgroundColor: currentTheme.surface,
                          borderColor: currentTheme.border,
                          color: currentTheme.text,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Completed Tasks List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {getCompletedTasks().length > 0 ? (
                    getCompletedTasks().map((task, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 rounded-lg border"
                        style={{
                          backgroundColor: currentTheme.background,
                          borderColor: currentTheme.border,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium" style={{ color: currentTheme.text }}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs mt-1" style={{ color: currentTheme.textSecondary }}>
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <span className="flex text-xs" style={{ color: currentTheme.textSecondary }}>
                                 <Calendar className="w-3 h-3" /> <span>&nbsp;&nbsp;{formatDate(task.lastDate)}</span>
                              </span>
                              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: currentTheme.primary + "20", color: currentTheme.primary }}>
                                {taskLists.find((l) => l.id === task.listId)?.name || "Unknown"}
                              </span>
                            </div>
                          </div>
                          <Check className="w-5 h-5 text-green-500 shrink-0" />
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Calendar className="w-12 h-12 mb-4 opacity-30" style={{ color: currentTheme.textSecondary }} />
                      <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                        No completed tasks found
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmation && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          >
            <motion.div
              className="rounded-xl shadow-2xl p-6 max-w-xs"
              style={{ backgroundColor: currentTheme.surface }}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-semibold" style={{ color: currentTheme.text }}>
                  Delete List?
                </h3>
              </div>
              <p className="mb-6 text-sm" style={{ color: currentTheme.textSecondary }}>
                Are you sure you want to delete this list and all its tasks? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-all"
                  style={{
                    borderColor: currentTheme.border,
                    color: currentTheme.text,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteConfirmation && confirmDeleteList(deleteConfirmation)}
                  className="flex-1 px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
