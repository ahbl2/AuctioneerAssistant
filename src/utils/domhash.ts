import crypto from "crypto";

export function hashDom(html: string): string {
  return crypto.createHash("sha1").update(html).digest("hex").slice(0, 12);
}
