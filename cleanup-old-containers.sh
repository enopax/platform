#!/bin/bash
# Cleanup script for removing old containers from previous deployments

echo "========================================="
echo "🧹 Cleaning up old containers"
echo "========================================="
echo ""

# Stop and remove ALL containers except current project
echo "Stopping old containers..."
docker ps -a --format "{{.Names}}" | grep -vE "^next-app-" | while read container; do
    if [ ! -z "$container" ]; then
        echo "  Stopping: $container"
        docker rm -f "$container" 2>/dev/null || true
    fi
done

echo ""
echo "Removing old images..."
docker images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep -E "nginx|grafana|prometheus|swagger|iiiii" | awk '{print $2}' | while read image; do
    echo "  Removing: $image"
    docker rmi -f "$image" 2>/dev/null || true
done

echo ""
echo "Removing unused volumes..."
docker volume ls -q | grep -vE "^next-app_" | while read volume; do
    if [ ! -z "$volume" ]; then
        echo "  Removing: $volume"
        docker volume rm "$volume" 2>/dev/null || true
    fi
done

echo ""
echo "Removing unused networks..."
docker network ls --format "{{.Name}}" | grep -vE "^(bridge|host|none|next-app_)" | while read network; do
    if [ ! -z "$network" ]; then
        echo "  Removing: $network"
        docker network rm "$network" 2>/dev/null || true
    fi
done

echo ""
echo "Running Docker system prune..."
docker system prune -f

echo ""
echo "========================================="
echo "✅ Cleanup complete!"
echo "========================================="
echo ""
echo "Current containers:"
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
echo ""
echo "Now you can run:"
echo "  docker compose -f docker-compose.prod.yml up -d --build"
