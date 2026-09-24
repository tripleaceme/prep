import { AuthScreen } from "@/components/AuthScreen";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return <AuthScreen mode="login" />;
}
