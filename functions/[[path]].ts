import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";

// @ts-expect-error - the server build is generated at build time by Remix.
import * as build from "../build/server";

export const onRequest = createPagesFunctionHandler({ build });
