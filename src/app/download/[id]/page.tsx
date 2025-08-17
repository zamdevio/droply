'use client'

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function Download() {
  const params = useParams();
  const id = params.id as string;
  const [status, setStatus] = useState("init");

  useEffect(() => {
    if (!id) return;
    window.location.href = `/api/download/${id}`;
    setStatus("redirecting");
  }, [id]);

  return <p className="p-6">{status === "redirecting" ? "Starting download…" : "Preparing…"}</p>;
}
