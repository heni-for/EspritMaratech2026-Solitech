#!/bin/bash

# Asset Manager - MongoDB + Docker Quick Start
# This script helps you get started with Docker

set -e

echo "================================"
echo "Asset Manager - Docker Setup"
echo "================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker from https://www.docker.com/"
    exit 1
fi

echo "✅ Docker found"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

echo "✅ Docker Compose found"
echo ""

# Menu
echo "Choose an option:"
echo "1) Start application with MongoDB (docker-compose up -d)"
echo "2) Stop application (docker-compose down)"
echo "3) View application logs (docker-compose logs -f app)"
echo "4) View MongoDB logs (docker-compose logs -f mongodb)"
echo "5) Reset everything (docker-compose down -v && docker-compose up -d --build)"
echo "6) Exit"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo "🚀 Starting Asset Manager with MongoDB..."
        docker-compose up -d
        echo ""
        echo "✅ Application is starting!"
        echo "   Open your browser: http://localhost:5000"
        echo ""
        echo "Demo Accounts:"
        echo "  Admin:    admin / admin123"
        echo "  Trainer:  trainer1 / trainer123"
        echo "  Student:  ahmed / student123"
        echo ""
        echo "Run this to see logs: docker-compose logs -f app"
        ;;
    2)
        echo "🛑 Stopping application..."
        docker-compose down
        echo "✅ Application stopped"
        ;;
    3)
        echo "📋 Application logs (Ctrl+C to exit):"
        docker-compose logs -f app
        ;;
    4)
        echo "📋 MongoDB logs (Ctrl+C to exit):"
        docker-compose logs -f mongodb
        ;;
    5)
        echo "🔄 Resetting everything..."
        docker-compose down -v
        docker-compose up -d --build
        echo "✅ Reset complete! Application is starting at http://localhost:5000"
        ;;
    6)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac
