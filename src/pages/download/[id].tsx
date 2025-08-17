import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Download() {
  const { query } = useRouter();
  const { id } = query;
  const [status, setStatus] = useState("init");

  useEffect(() => {
    if (!id) return;
    window.location.href = `/api/download/${id}`;
    setStatus("redirecting");
  }, [id]);

  return <p className="p-6">{status === "redirecting" ? "Starting download…" : "Preparing…"}</p>;
}
