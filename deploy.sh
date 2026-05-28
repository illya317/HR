#!/bin/bash
# 部署入口，实际逻辑在 ops/deploy.sh
exec "$(dirname "$0")/ops/deploy.sh" "$@"
