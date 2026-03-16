import { Task, TaskList } from "@/lib/models/Tasks";
import { connectDB } from "@/lib/mongodb";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all task lists for the user
    const taskLists = await TaskList.find({ clerkId: userId }).sort({ order: 1 });

    // Fetch all tasks for the user
    const tasks = await Task.find({ clerkId: userId }).sort({ order: 1 });

    // Organize tasks by list
    const listsWithTasks = taskLists.map((list) => ({
      id: list.id,
      name: list.name,
      order: list.order,
      tasks: tasks.filter((task) => task.listId === list.id),
    }));

    return NextResponse.json(
      {
        taskLists: listsWithTasks,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, data } = body;

    if (type === "task") {
      // Create a new task
      const task = new Task({
        clerkId: userId,
        ...data,
      });

      await task.save();

      return NextResponse.json(
        { task: task._id },
        { status: 201 }
      );
    } else if (type === "list") {
      // Create a new task list
      const taskList = new TaskList({
        clerkId: userId,
        ...data,
      });

      await taskList.save();

      return NextResponse.json(
        { listId: taskList._id },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: "Invalid type" },
      { status: 400 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
