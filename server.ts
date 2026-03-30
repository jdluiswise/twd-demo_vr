import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  CallToolResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { z } from "zod";

const DIST_DIR = import.meta.filename.endsWith(".ts")
  ? path.join(import.meta.dirname, "dist")
  : import.meta.dirname;

export function createServer(): McpServer {
  const server = new McpServer({
    name: "QR MCP App Server",
    version: "1.0.0",
  });

  const qrGenerateUri = "ui://generate-qr/mcp-app.html";
  const devicesResourceUri = "ui://show-devices/mcp-app.html";

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
      _meta: { ui: { qrGenerateUri } },
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
    },
  );

  registerAppTool(
    server,
    "show-devices",
    {
      title: "Show Devices in Office",
      description: "Lists available devices in the selected office",
      inputSchema: z.object({
        officeId: z.string(),
      }),
      _meta: { ui: { resourceUri: devicesResourceUri } },
    },
    async ({ officeId }): Promise<CallToolResult> => {
      const devices = [
        { name: "Device A", id: 1, officeId: 1 },
        { name: "Device B", id: 2, officeId: 1 },
        { name: "Device C", id: 3, officeId: 2 },
      ];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              office: officeId,
              devices,
            }),
          },
        ],
      };
    },
  );

  // 📦 UI RESOURCE
  registerAppResource(
    server,
    qrGenerateUri,
    qrGenerateUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(
        path.join(DIST_DIR, "mcp-app.html"),
        "utf-8",
      );

      return {
        contents: [
          {
            uri: qrGenerateUri,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
          },
        ],
      };
    },
  );

  registerAppResource(
    server,
    devicesResourceUri,
    devicesResourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(
        path.join(DIST_DIR, "show-devices.html"), // tu HTML de la tool
        "utf-8",
      );

      return {
        contents: [
          {
            uri: devicesResourceUri,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
          },
        ],
      };
    },
  );

  return server;
}
