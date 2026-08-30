import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Login con Google aun no esta configurado. Agrega GOOGLE_CLIENT_ID y verificacion de idToken en el backend.",
    },
    { status: 501 }
  );
}
