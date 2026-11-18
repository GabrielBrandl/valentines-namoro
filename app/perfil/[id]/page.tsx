"use client";

import { use } from "react";
import { PublicProfileView } from "@/components/PublicProfileView";

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PublicProfileView userId={decodeURIComponent(id)} />;
}
