import { AuthScreen } from "@/components/AuthScreen";
import { VerifiedNotice } from "@/components/VerifiedNotice";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  const { verified } = await searchParams;
  return <AuthScreen mode="login" notice={<VerifiedNotice status={verified} />} />;
}
