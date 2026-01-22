#!/bin/bash

# 确保 mupdf 在 backend/node_modules 中
# 由于 npm workspace 会将依赖提升到根目录，需要手动复制

echo "Setting up mupdf for backend..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# 检查根目录是否有 mupdf
if [ -d "$ROOT_DIR/node_modules/mupdf" ]; then
    echo "Found mupdf in root node_modules"

    # 创建 backend/node_modules 目录（如果不存在）
    mkdir -p "$ROOT_DIR/backend/node_modules"

    # 复制 mupdf 到 backend/node_modules
    cp -r "$ROOT_DIR/node_modules/mupdf" "$ROOT_DIR/backend/node_modules/"

    echo "mupdf copied to backend/node_modules successfully!"
else
    echo "mupdf not found in root node_modules"
    echo "Running npm install at root level..."
    cd "$ROOT_DIR" && npm install mupdf

    # 再次复制
    if [ -d "$ROOT_DIR/node_modules/mupdf" ]; then
        mkdir -p "$ROOT_DIR/backend/node_modules"
        cp -r "$ROOT_DIR/node_modules/mupdf" "$ROOT_DIR/backend/node_modules/"
        echo "mupdf installed and copied successfully!"
    else
        echo "Failed to install mupdf"
        exit 1
    fi
fi

echo "Setup complete!"
