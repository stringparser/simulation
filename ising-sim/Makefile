.PHONY: help setup dev build test clean

ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

PORT ?= 5173

help:
	@echo "Ising simulator (browser-only)"
	@echo ""
	@echo "  make setup   Install dependencies"
	@echo "  make dev     Run Vite dev server"
	@echo "  make build   Build production bundle"
	@echo "  make test    Run tests"
	@echo "  make clean   Remove node_modules and dist"

setup:
	@echo "Installing dependencies..."
	cd "$(ROOT)" && npm install
	@echo "Setup complete."

dev:
	cd "$(ROOT)" && npm run dev -- --port $(PORT)

build:
	cd "$(ROOT)" && npm run build
	@echo "Build complete."

test:
	cd "$(ROOT)" && npm test -- --passWithNoTests
	@echo "All tests passed."

clean:
	rm -rf "$(ROOT)/node_modules" "$(ROOT)/dist"
