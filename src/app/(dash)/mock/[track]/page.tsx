import { notFound } from "next/navigation";
import { getTrack, TRACKS } from "@/lib/tracks";
import { MockRunner } from "./MockRunner";

export function generateStaticParams() {
  return TRACKS.map((track) => ({ track: track.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track } = await params;
  return { title: getTrack(track)?.name ?? "Mock Interview" };
}

export default async function MockTrackPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track: slug } = await params;
  const track = getTrack(slug);
  if (!track) notFound();

  return <MockRunner track={track} />;
}
