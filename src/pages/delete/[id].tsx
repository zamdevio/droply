import { useRouter } from "next/router";

export default function DeletePage() {
  const { query, push } = useRouter();
  const id = query.id as string | undefined;

  async function del() {
    if (!id) return;
    const res = await fetch(`/api/delete/${id}`, { method: "DELETE" });
    if (res.ok) push("/");
    else alert("Delete failed");
  }

  return (
    <main className="p-6 grid place-items-center min-h-screen">
      <div className="border rounded-2xl p-6 max-w-md w-full">
        <h1 className="text-xl font-semibold mb-2">Delete file</h1>
        <p className="text-sm opacity-70 mb-4">Are you sure? This cannot be undone.</p>
        <button className="border rounded px-3 py-2" onClick={del} disabled={!id}>Delete permanently</button>
      </div>
    </main>
  );
}
