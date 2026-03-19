import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Make sure payload exists
    if (!body || !body.payload) {
      return NextResponse.json(
        { error: "Payload missing" },
        { status: 400 }
      );
    }

   const payloadForPython = { message: body.payload };

    const flaskRes = await axios.post("http://localhost:5001/api/chat", payloadForPython);
    const data = flaskRes.data;

    return NextResponse.json({
      response: data.response,
    });

  } catch (error: any) {
  // THIS WILL PRINT IN YOUR TERMINAL
  console.log("DEBUG: Connection Error Details ->", error); 
  
  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  );
}}