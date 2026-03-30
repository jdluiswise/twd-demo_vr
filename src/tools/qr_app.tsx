import type {  McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import styles from "./qr_app.module.css";

function extractQR(result: CallToolResult): string | null {
  const item = result.content?.find((c) => c.type === "text");
  if (!item) return null;

  try {
    const parsed = JSON.parse(item.text);
    return parsed.qr;
  } catch {
    return null;
  }
}

function QRApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext>();

  const { app, error } = useApp({
    appInfo: { name: "QR Generator App", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        setToolResult(result);
      };

      app.onerror = console.error;

      app.onhostcontextchanged = (params) => {
        setHostContext((prev) => ({ ...prev, ...params }));
      };
    },
  });

  useEffect(() => {
    if (app) setHostContext(app.getHostContext());
  }, [app]);

  if (error) return <div>Error: {error.message}</div>;
  if (!app) return <div>Connecting...</div>;

  return <QRAppInner app={app} toolResult={toolResult} hostContext={hostContext} />;
}

function QRAppInner({ app, toolResult, hostContext }: any) {
  const [officeId, setOfficeId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (toolResult) {
      const qrData = extractQR(toolResult);
      if (qrData) setQr(qrData);
    }
  }, [toolResult]);

  const handleGenerateQR = useCallback(async () => {
    try {
      const result = await app.callServerTool({
        name: "generate-qr",
        arguments: {
          officeId,
          deviceId,
        },
      });

      const qrData = extractQR(result);
      if (qrData) setQr(qrData);
    } catch (e) {
      console.error(e);
    }
  }, [app, officeId, deviceId]);

  return (
    <main
      className={styles.main}
      style={{
        paddingTop: hostContext?.safeAreaInsets?.top,
        paddingBottom: hostContext?.safeAreaInsets?.bottom,
      }}
    >
      <h2>QR Generator</h2>

      <div className={styles.action}>
        <input
          placeholder="officeId"
          value={officeId}
          onChange={(e) => setOfficeId(e.target.value)}
        />
      </div>

      <div className={styles.action}>
        <input
          placeholder="deviceId"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
        />
      </div>

      <button onClick={handleGenerateQR}>Generate QR</button>

      {qr && (
        <div style={{ marginTop: 20 }}>
          <img src={qr} alt="QR Code" style={{ width: 200 }} />
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QRApp />
  </StrictMode>
);