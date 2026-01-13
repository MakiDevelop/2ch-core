#!/bin/bash
# Fix gossip board link in board.html

set -e

echo "Fixing gossip board link..."

# Copy the fixed board.html to the nginx container
docker compose -f /opt/2ch-core/docker-compose.deploy.yml cp /opt/2ch-core/public/board.html nginx:/var/www/html/board.html

echo "✅ Fixed! The 娛樂／名人／八卦 board link now points to /boards/gossip/threads"
echo "Please test: https://2ch.tw/boards/chat/threads and click on 娛樂／名人／八卦"
