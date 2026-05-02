FROM debian:bookworm-slim

ARG HUGO_VERSION=0.160.0
ARG USER_ID=1000
ARG GROUP_ID=1000

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates curl git \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL -o /tmp/hugo.tar.gz "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz" \
    && tar -xzf /tmp/hugo.tar.gz -C /tmp \
    && install -m 0755 /tmp/hugo /usr/local/bin/hugo \
    && rm -f /tmp/hugo.tar.gz /tmp/hugo /tmp/LICENSE /tmp/README.md

RUN groupadd --gid "${GROUP_ID}" hugo \
    && useradd --uid "${USER_ID}" --gid "${GROUP_ID}" --create-home --shell /bin/bash hugo

WORKDIR /src
USER hugo
EXPOSE 1313

CMD ["hugo", "server", "--bind", "0.0.0.0", "--baseURL", "http://localhost:1313/", "--appendPort=false", "--buildDrafts", "--buildFuture", "--disableFastRender", "--cacheDir", "/home/hugo/.cache/hugo", "--poll", "700ms"]
