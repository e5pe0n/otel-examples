FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm i -g pnpm@10.6.3

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm deploy --legacy --filter=requester /prod/requester
RUN pnpm deploy --legacy --filter=server /prod/server

FROM base AS requester
COPY --from=build /prod/requester /prod/requester
WORKDIR /prod/requester
EXPOSE 5173
CMD [ "pnpm", "start" ]

FROM base AS server
COPY --from=build /prod/server /prod/server
WORKDIR /prod/server
EXPOSE 3000
CMD [ "pnpm", "start" ]
