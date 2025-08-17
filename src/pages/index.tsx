import { useState } from "react";

export default function Home() {
  const [links, setLinks] = useState<{downloadUrl:string;deleteUrl:string;editUrl:string} | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setErr("");
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error || "Upload failed"); return; }
    setLinks(data);
  }

  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="w-full max-w-xl border rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-2">Droply</h1>
        <p className="text-sm opacity-70 mb-4">Anonymous file sharing, no strings attached.</p>
        <label className="block border-dashed border-2 rounded-xl p-8 text-center cursor-pointer">
          <input type="file" className="hidden" onChange={onUpload} />
          {busy ? "Uploading…" : "Click to choose a file (max 100MB)"}
        </label>
        {err && <p className="text-red-600 mt-3">{err}</p>}
        {links && (
          <div className="mt-4 space-y-2">
            <LinkRow label="Download" href={links.downloadUrl} />
            <LinkRow label="Delete" href={links.deleteUrl} />
            <LinkRow label="Edit" href={links.editUrl} />
          </div>
        )}
        <p className="text-xs opacity-60 mt-6">Abuse protected: 100 req/min per IP. Heavy abuse triggers 30‑min cooldown.</p>
      </div>
    </main>
  );
}

function LinkRow({ label, href }: { label: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <input readOnly value={href} className="flex-1 border rounded px-2 py-1" />
      <button className="border rounded px-2 py-1" onClick={() => navigator.clipboard.writeText(href)}>Copy</button>
    </div>
  );
}
