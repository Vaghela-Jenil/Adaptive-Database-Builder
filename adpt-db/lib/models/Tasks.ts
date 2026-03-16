import mongoose, { Schema, model, models } from "mongoose";

const TaskSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true },
    listId: { type: String, required: true },
    listName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    dueDate: { type: String, required: true },
    dueTime: { type: String, default: "" },
    lastDate: { type: String, required: true },
    lastTime: { type: String, default: "" },
    createdDate: { type: String, required: true },
    starred: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const TaskListSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true },
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Task = models.Task || model("Task", TaskSchema);
export const TaskList = models.TaskList || model("TaskList", TaskListSchema);
