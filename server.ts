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
import { put } from "@vercel/blob";

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
  const uploadResourceUri = "ui://upload-document/mcp-app.html";

  // -------------------- UPLOAD DOCUMENT --------------------
  registerAppTool(
    server,
    "upload-document",
    {
      title: "Upload Document",
      description: "Upload a document to Vercel Blob",
      inputSchema: z.object({
        filename: z.string(),
        content: z.string(), // base64
        mimeType: z.string(),
      }),
      _meta: { ui: { resourceUri: uploadResourceUri } },
    },
    async ({ filename, content, mimeType }): Promise<CallToolResult> => {
      try {
        const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");

        // Convertir base64 a Buffer
        const buffer = Buffer.from(content, "base64");

        // Subir a Vercel Blob
        const { url } = await put(`articles/${safeName}`, buffer, {
          access: "private",
          contentType: mimeType,
          token: process.env.VERCEL_BLOB_TOKEN, // tu token de Vercel
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, filename: safeName, url }),
            },
          ],
        };
      } catch (err) {
        console.error(err);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: false, error: "Upload failed" }),
            },
          ],
        };
      }
    },
  );

  // -------------------- GENERATE QR --------------------
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
        content: [{ type: "text", text: JSON.stringify({ qr }) }],
      };
    },
  );

  // -------------------- SHOW DEVICES --------------------
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
            text: JSON.stringify({ office: officeId, devices }),
          },
        ],
      };
    },
  );

  // -------------------- REGISTER RESOURCES --------------------
  const registerResource = async (uri: string, filename: string) => {
    const html = await fs.readFile(path.join(DIST_DIR, filename), "utf-8");
    registerAppResource(
      server,
      uri,
      uri,
      { mimeType: RESOURCE_MIME_TYPE },
      async (): Promise<ReadResourceResult> => ({
        contents: [{ uri, mimeType: RESOURCE_MIME_TYPE, text: html }],
      }),
    );
  };

  registerResource(qrGenerateUri, "mcp-app.html");
  registerResource(devicesResourceUri, "show-devices.html");
  registerResource(uploadResourceUri, "upload-document.html");

  return server;
}
