import { CvRevamp } from "./CvRevamp";
import { listCvRevamps } from "@/lib/cvActions";

export const metadata = { title: "Revamp My CV" };

export default async function CvPage() {
  // The list only, not the CV bodies — those are fetched when one is opened.
  const history = await listCvRevamps();
  return <CvRevamp history={history} />;
}
