import { Task, TaskList } from "@/lib/models/Tasks";
import { connectDB } from "@/lib/mongodb";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  await connectDB();
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { taskId } = await params;
    const body = await req.json();
    const { type, data } = body;

    if (type === "task") {
      // Update task - try finding by _id first, then by id field
      let task = await Task.findOneAndUpdate(
        { _id: taskId, clerkId: userId },
        data,
        { new: true }
      );

      if (!task) {
        // Try finding by id field
        task = await Task.findOneAndUpdate(
          { id: taskId, clerkId: userId },
          data,
          { new: true }
        );
      }

      if (!task) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ task }, { status: 200 });
    } else if (type === "list") {
      // Update task list
      const taskList = await TaskList.findOneAndUpdate(
        { id: taskId, clerkId: userId },
        data,
        { new: true }
      );

      if (!taskList) {
        return NextResponse.json(
          { error: "Task list not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ taskList }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid type" },
      { status: 400 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  await connectDB();
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { taskId } = await params;
    const body = await req.json();
    const { type } = body;

    if (type === "task") {
      // Delete task - try finding by _id first, then by id field
      let task = await Task.findOneAndDelete({
        _id: taskId,
        clerkId: userId,
      });

      if (!task) {
        // Try finding by id field
        task = await Task.findOneAndDelete({
          id: taskId,
          clerkId: userId,
        });
      }

      if (!task) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { message: "Task deleted" },
        { status: 200 }
      );
    } else if (type === "list") {
      // Delete task list and all its tasks
      const taskList = await TaskList.findOneAndDelete({
        id: taskId,
        clerkId: userId,
      });

      if (!taskList) {
        return NextResponse.json(
          { error: "Task list not found" },
          { status: 404 }
        );
      }

      // Delete all tasks in this list
      await Task.deleteMany({ listId: taskId, clerkId: userId });

      return NextResponse.json(
        { message: "Task list deleted" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Invalid type" },
      { status: 400 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
