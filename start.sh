#!/bin/bash
# 使用 pm2 后台启动 beautiful-home-page，端口为 1215
PORT=1215 pm2 start "pnpm" --name beautiful-home-page -- start 