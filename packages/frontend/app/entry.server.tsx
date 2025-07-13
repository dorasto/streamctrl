import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server.browser";

export const streamTimeout = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext
  // If you have middleware enabled:
  // loadContext: unstable_RouterContextProvider
) {
  return new Promise(async (resolve, reject) => {
    try {
      let userAgent = request.headers.get("user-agent");

      // For bots and SPA Mode, we want to wait for all content to load
      let waitForAllReady =
        (userAgent && isbot(userAgent)) || routerContext.isSpaMode;

      const stream = await renderToReadableStream(
        <ServerRouter context={routerContext} url={request.url} />,
        {
          onError(error: unknown) {
            responseStatusCode = 500;
            console.error(error);
          },
        }
      );

      // If we need to wait for all content (bots/SPA), wait for the stream to be ready
      if (waitForAllReady) {
        await stream.allReady;
      }

      responseHeaders.set("Content-Type", "text/html");

      resolve(
        new Response(stream, {
          headers: responseHeaders,
          status: responseStatusCode,
        })
      );
    } catch (error) {
      reject(error);
    }
  });
}
