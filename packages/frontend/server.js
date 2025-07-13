// Import the server build
const build = await import("./build/server/index.js");

const server = Bun.serve({
  port: 3000,
  hostname: "0.0.0.0",
  async fetch(request) {
    try {
      // Create a simple context for the React Router
      const url = new URL(request.url);
      const responseHeaders = new Headers();

      // Call the default export (handleRequest) from the build
      const response = await build.default(
        request,
        200, // status code
        responseHeaders,
        {
          manifest: build.assets,
          routeModules: build.routes,
          matches: [],
          isSpaMode: false,
        },
        {} // load context
      );

      return response;
    } catch (error) {
      console.error("Server error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`Frontend server running at http://localhost:${server.port}`);
