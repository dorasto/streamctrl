# StreamCTRL

> [!WARNING]  
> StreamCTRL is not ready nor does it have a release. Everything right now is still a proof of concept stage. Do not attempt to use or install StreamCTRL as of right now. Once the project is ready we'll create a release. You can stay up to date by starring & watching the project from the sidebar.

StreamCTRL is a self hostable open source project to allow anyone to manage their OBS and create automations. Unlike other tools out there that are the main inspiration ([StreamerBot](https://streamer.bot)), StreamCTRL is utilizing Docker. This allows you to host it on any machine, and share access to it to others (provided you can port forward/manage the networking). For most users, it'll be standalone, likely installed on the same machine that OBS is on. For some of us, it'll be on a Raspberry Pi or VPS.

## Why build StreamCTRL

While we love the power that [StreamerBot](https://streamer.bot) and others bring, there are some short comings. Be it that they aren't open source, not supported on all operating systems, or other. That's why we believe Docker is the simplist way to manage all of this, and allows any user to get up and running.

## What's the goal

The goal is simple, create an open source, community driven tool, powered by the community to expand everyones streams.

## Getting started

tbd

## Contributing

StreamCTRL will be open source from day one. You can watch and contribute in real time as we prepare for v0.0.1. All contributions are welcome, and we'll keep issues up to date to the best of our ability. When things are starting out it can be hard to keep track. Once we've a first release out we can ensure proper version management.

### File structure

StreamCTRL is built up of many services to get it to all work nicely. This includes a frontend for the actual site, a backend for database & API, etc.

- Frontend code is stored in the [/frontend](/frontend/) folder.
- Backend code is stored in the [/backend](/backend/) folder.
- Additional notes and docs can be found in the [/docs-and-drawings](/docs-and-drawings/) folder. This includes some simple write ups on how certain things work, and includes some Excalidraw drawings to help understand how data flows.

### Technology

- Globally
  - Bun
  - Typescript
  - Docker
  - Better auth (for authentication)
- Frontend
  - React Router (framework)
- Backend
  - tbd

### Getting started

1. Create a fork of the repository, forking the `main` branch
2. Create a `.env` file with the contents of `.env.example`, populating the data as required.
3. Run `bun dev:all` which will install all packages as needed, and spin up all services together concurrently.
4. The frontend can then be seen on `http://localhost:5173`
