#!/bin/bash
# Cleanup script for removing old containers from previous deployments

echo "========================================="
echo "🧹 Cleaning up old containers"
echo "========================================="
echo ""

# Stop and remove all containers with old service names
echo "Stopping old containers..."
docker ps -a --format "{{.Names}}" | grep -E "nginx|grafana|prometheus|swagger|storage-" | while read container; do
    echo "  Stopping: $container"
    docker rm -f "$container" 2>/dev/null || true
done

echo ""
echo "Removing old images..."
docker images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep -E "nginx|grafana|prometheus|swagger" | awk '{print $2}' | while read image; do
    echo "  Removing: $image"
    docker rmi -f "$image" 2>/dev/null || true
done

echo ""
echo "Removing unused volumes..."
docker volume ls -q | grep -E "grafana|prometheus" | while read volume; do
    echo "  Removing: $volume"
    docker volume rm "$volume" 2>/dev/null || true
done

echo ""
echo "Removing unused networks..."
docker network ls --format "{{.Name}}" | grep -E "storage|web" | while read network; do
    echo "  Removing: $network"
    docker network rm "$network" 2>/dev/null || true
done

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
