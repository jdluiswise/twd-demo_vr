import { useApp, type McpUiHostContext } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { useEffect, useState } from "react";
import styles from "./styles.module.css";

function extractDeviceData(result: CallToolResult) {
  const item = result.content?.find((c) => c.type === "text");
  if (!item) return null;

  try {
    const parsed = JSON.parse(item.text);
    return {
      office: typeof parsed.office === "string" ? parsed.office : null,
      devices: Array.isArray(parsed.devices) ? parsed.devices : [],
    };
  } catch {
    return null;
  }
}

export default function DeviceApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);
  const [office, setOffice] = useState<string | null>(null);
  const [devices, setDevices] = useState<{ name: string }[]>([]);
  const [hostContext, setHostContext] = useState<McpUiHostContext>();

  const { app, error } = useApp({
    appInfo: { name: "Show Devices in Office", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = (result) => setToolResult(result);
      app.onerror = console.error;
      app.onhostcontextchanged = (ctx) => setHostContext(ctx);
    },
  });

  useEffect(() => {
    if (toolResult) {
      const data = extractDeviceData(toolResult);
      if (!data) return;
      setOffice(data.office);
      setDevices(data.devices);
    }
  }, [toolResult]);

  if (error) return <div>Error: {error.message}</div>;
  if (!app) return <div>Connecting...</div>;
  if (!office) return <div>Loading devices...</div>;

  return (
    <main
      className={styles.main}
      style={{
        paddingTop: hostContext?.safeAreaInsets?.top ?? 8,
        paddingBottom: hostContext?.safeAreaInsets?.bottom ?? 8,
      }}
    >
      <h1>Devices in Office {office}</h1>

      {devices.length > 0 ? (
        <ul className={styles.deviceList}>
          {devices.map((device, idx) => (
            <li key={idx} className={styles.deviceItem}>
              {device.name}
            </li>
          ))}
        </ul>
      ) : (
        <p>No devices available</p>
      )}
    </main>
  );
}