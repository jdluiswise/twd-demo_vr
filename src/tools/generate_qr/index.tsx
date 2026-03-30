import {
  useApp,
  type McpUiHostContext,
} from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { useEffect, useState } from "react";
import styles from "./styles.module.css";

function extractQRData(result: CallToolResult) {
  const item = result.content?.find((c) => c.type === "text");
  if (!item) return null;

  try {
    const parsed = JSON.parse(item.text);
    return {
      qr: typeof parsed.qr === "string" ? parsed.qr : null,
      officeId: typeof parsed.officeId === "string" ? parsed.officeId : null,
      deviceName: typeof parsed.deviceId === "string" ? parsed.deviceId : null,
    };
  } catch {
    return null;
  }
}

export default function QRApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext>();

  const { app, error } = useApp({
    appInfo: { name: "QR Generator App", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = (result) => setToolResult(result);
      app.onerror = console.error;
      app.onhostcontextchanged = (ctx) => setHostContext(ctx);
    },
  });

  useEffect(() => {
    if (toolResult) {
      const data = extractQRData(toolResult);
      if (!data) return;
      setQr(data.qr);
      setOfficeId(data.officeId);
      setDeviceName(data.deviceName);
    }
  }, [toolResult]);

  if (error) return <div>Error: {error.message}</div>;
  if (!app) return <div>Connecting...</div>;
  if (!qr) return <div>Generando QR...</div>;

  return (
    <main
      className={styles.main}
      style={{
        paddingTop: hostContext?.safeAreaInsets?.top ?? 8,
        paddingBottom: hostContext?.safeAreaInsets?.bottom ?? 8,
      }}
    >
      <div className={styles.qrContainer}>
        <img className={styles.qrImage} src={qr} alt="QR Code" />
      </div>

      <div className={styles.qrDetails}>
        <ul>
          <li>
            <strong>Device Name:</strong> {deviceName}
          </li>
          <li>
            <strong>Office ID:</strong> {officeId}
          </li>
        </ul>
      </div>
    </main>
  );
}
