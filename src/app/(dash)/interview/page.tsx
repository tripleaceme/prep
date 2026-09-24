import { fetchAiHistory } from "@/lib/historyActions";
import { InterviewApp } from "./InterviewApp";

export const metadata = { title: "AI Interview" };

export default async function InterviewPage() {
  // Past sessions come from the database now, not localStorage, so they
  // survive a cleared browser and follow the account to any device.
  const history = await fetchAiHistory();
  return <InterviewApp history={history} />;
}
