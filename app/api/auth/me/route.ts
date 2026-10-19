import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(session.userId).select("-password");
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        allowanceDay: user.allowanceDay,
        cardLast4: user.cardLast4 || null,
        cardBrand: user.cardBrand || null,
        hasPaymentMethod: Boolean(user.defaultPaymentMethodId),
      },
    });
  } catch (error: any) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve session" },
      { status: 500 }
    );
  }
}
