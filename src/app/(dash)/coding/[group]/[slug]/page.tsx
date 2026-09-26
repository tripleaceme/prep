import { notFound } from "next/navigation";
import { getProblem, groupOfCategory, PROBLEMS } from "@/lib/problems";
import { Workspace } from "./Workspace";

export function generateStaticParams() {
  return PROBLEMS.map((problem) => ({
    group: groupOfCategory(problem.category),
    slug: problem.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string; slug: string }>;
}) {
  const { slug } = await params;
  return { title: getProblem(slug)?.title ?? "Coding Problem" };
}

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ group: string; slug: string }>;
}) {
  const { slug } = await params;
  const problem = getProblem(slug);
  if (!problem) notFound();

  return <Workspace problem={problem} />;
}
