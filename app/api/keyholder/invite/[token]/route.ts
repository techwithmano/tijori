import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import { User } from "@/models/User";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    await connectToDatabase();
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Invite token is required" },
        { status: 400 }
      );
    }

    const vault = await Vault.findOne({ inviteToken: token });

    if (!vault) {
      return NextResponse.json(
        { success: false, error: "This keyholder invite link was not found or has expired." },
        { status: 404 }
      );
    }

    let applicantName = "Your Friend";
    if (vault.userId) {
      const owner = await User.findById(vault.userId).select("name");
      if (owner?.name) {
        applicantName = owner.name;
      }
    }

    return NextResponse.json({
      success: true,
      vault: {
        id: vault._id,
        title: vault.title,
        targetAmount: vault.targetAmount,
        currency: vault.currency || "KWD",
        applicantName,
        keyholder: vault.keyholder,
        keyholderInviteAccepted: Boolean(vault.keyholderInviteAccepted),
      },
    });
  } catch (error: any) {
    console.error("GET /api/keyholder/invite/[token] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load keyholder invite" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    await connectToDatabase();
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Invite token is required" },
        { status: 400 }
      );
    }

    const vault = await Vault.findOne({ inviteToken: token });

    if (!vault) {
      return NextResponse.json(
        { success: false, error: "This keyholder invite link was not found or has expired." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { pin, confirmPin, name, phone, relationship } = body;

    const cleanPin = String(pin || "").replace(/\D/g, "");

    if (cleanPin.length !== 6) {
      return NextResponse.json(
        { success: false, error: "Your secret PIN must be exactly 6 numeric digits." },
        { status: 400 }
      );
    }

    if (confirmPin !== undefined) {
      const cleanConfirm = String(confirmPin || "").replace(/\D/g, "");
      if (cleanPin !== cleanConfirm) {
        return NextResponse.json(
          { success: false, error: "The confirmed PIN does not match. Please re-enter." },
          { status: 400 }
        );
      }
    }

    vault.keyholderPin = cleanPin;
    vault.keyholderInviteAccepted = true;

    if (name && typeof name === "string") {
      vault.keyholder.name = name.trim();
    }
    if (phone && typeof phone === "string") {
      vault.keyholder.phone = phone.trim();
    }
    if (relationship && typeof relationship === "string") {
      vault.keyholder.relationship = relationship.trim();
    }

    await vault.save();

    return NextResponse.json({
      success: true,
      message: "Secret Keyholder PIN saved successfully.",
      keyholder: vault.keyholder,
    });
  } catch (error: any) {
    console.error("POST /api/keyholder/invite/[token] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save Keyholder PIN" },
      { status: 500 }
    );
  }
}
