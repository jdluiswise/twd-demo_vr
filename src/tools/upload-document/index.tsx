import {
  useApp,
  type McpUiHostContext,
} from "@modelcontextprotocol/ext-apps/react";
import { useState } from "react";
import styles from "./styles.module.css";

export default function UploadApp() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");

  const { app, error } = useApp({
    appInfo: { name: "Upload App", version: "1.0.0" },
    capabilities: {},
  });

  const handleUpload = async () => {
    if (!file || !app) return;

    const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result?.toString().split(",")[1];

      try {
        const result = await app.callTool("upload_document", {
          filename: file.name,
          content: base64,
          mimeType: file.type,
        });

        setStatus("✅ Uploaded!");
        console.log(result);
      } catch (err) {
        console.error(err);
        setStatus("❌ Error uploading");
      }
    };

    reader.readAsDataURL(file);
  };

  if (error) return <div>Error: {error.message}</div>;
  if (!app) return <div>Connecting...</div>;

  return (
    <main className={styles.main}>
      <h2>Upload Document</h2>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={handleUpload} disabled={!file}>
        Upload
      </button>

      <p>{status}</p>
    </main>
  );
}