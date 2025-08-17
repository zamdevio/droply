import { useRouter } from "next/router";
import { useState } from "react";

export default function EditPage() {
  const { query } = useRouter();
  const id = query.id as string | undefined;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function save() {
    if (!id) return;
    const res = await fetch(`/api/edit/${id}`, { 
      method: "PUT", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ name, description }) 
    });
    if (!res.ok) alert("Save failed");
  }

  return (
    <main className="p-6 grid place-items-center min-h-screen">
      <div className="border rounded-2xl p-6 max-w-md w-full space-y-3">
        <h1 className="text-xl font-semibold">Edit metadata</h1>
        <input 
          className="border rounded px-2 py-1 w-full" 
          placeholder="Name" 
          value={name} 
          onChange={e=>setName(e.target.value)} 
        />
        <textarea 
          className="border rounded px-2 py-1 w-full" 
          placeholder="Description" 
          value={description} 
          onChange={e=>setDescription(e.target.value)} 
        />
        <button className="border rounded px-3 py-2" onClick={save} disabled={!id}>Save</button>
      </div>
    </main>
  );
}
