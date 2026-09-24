import { AuthScreen } from "@/components/AuthScreen";

export const metadata = { title: "Create your account" };

export default function RegisterPage() {
  return <AuthScreen mode="register" />;
}
