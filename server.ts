import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode"
import { z } from "zod";

// Works both from source (server.ts) and compiled (dist/server.js)
const DIST_DIR = import.meta.filename.endsWith(".ts")
  ? path.join(import.meta.dirname, "dist")
  : import.meta.dirname;

export function createServer(): McpServer {
  const server = new McpServer({
    name: "QR MCP App Server",
    version: "1.0.0",
  });

  // 🔁 nuevo resource URI
  const resourceUri = "ui://generate-qr/mcp-app.html";

  // ✅ NUEVA TOOL
registerAppTool(
  server,
  "generate-qr",
  {
    title: "Generate QR",
    description: "Generates a QR code from officeId and deviceId",
    inputSchema: z.object({
      officeId: z.string(),
      deviceId: z.string(),
    }),
    _meta: { ui: { resourceUri } },
  },
  async ({ officeId, deviceId }): Promise<CallToolResult> => {
    const payload = JSON.stringify({ officeId, deviceId });
    const qr = await QRCode.toDataURL(payload);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ qr }),
        },
      ],
    };
  }
);

  // 📦 UI RESOURCE
  registerAppResource(
    server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(
        path.join(DIST_DIR, "mcp-app.html"),
        "utf-8"
      );

      return {
        contents: [
          {
            uri: resourceUri,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
          },
        ],
      };
    }
  );

  return server;
}