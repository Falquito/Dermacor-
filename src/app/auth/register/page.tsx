import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import RegisterClient from "./RegisterClient";

export default async function RegisterPage() {
  const session = await getServerSession(authConfig);

  if (session?.user) {
    redirect("/");
  }

  return <RegisterClient />;
}