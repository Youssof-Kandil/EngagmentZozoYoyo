// uploadToDrive.ts
export async function uploadToDriveMultipart(
  file: File,
  opts: { endpoint: string; secret: string; subfolderName?: string }
) {
  const url = `${opts.endpoint}?secret=${encodeURIComponent(opts.secret)}`;
  const form = new FormData();
  form.append("file", file);
  if (opts.subfolderName) form.append("subfolderName", opts.subfolderName);

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Upload failed");
  return json as {
    ok: true;
    fileId: string;
    fileName: string;
    fileUrl: string;
    folderUrl: string;
    sizeBytes: number;
    mimeType: string;
  };
}
