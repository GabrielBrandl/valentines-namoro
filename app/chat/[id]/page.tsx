"use client";

import { useParams } from "next/navigation";
import { Inbox } from "@/components/Inbox";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <Inbox activeId={id} />;
}
