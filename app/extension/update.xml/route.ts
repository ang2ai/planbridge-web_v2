import { NextResponse } from "next/server";

const EXTENSION_VERSION = "0.1.0";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(":8080", ":3000") || "http://localhost:3000";
  const crxUrl = `${baseUrl}/extension/planbridge.crx`;

  const xml = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='planbridge-internal'>
    <updatecheck codebase='${crxUrl}' version='${EXTENSION_VERSION}' />
  </app>
</gupdate>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "no-cache",
    },
  });
}
