.PHONY: help setup dev build test clean frontend-setup frontend-dev frontend-build frontend-test

ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
FRONTEND := $(ROOT)frontend

FRONTEND_PORT ?= 5173

help:
	@echo "Ising simulator (browser-only)"
	@echo ""
	@echo "  make setup   Install frontend dependencies"
	@echo "  make dev     Run Vite dev server"
	@echo "  make build   Build production frontend bundle"
	@echo "  make test    Run frontend tests"
	@echo "  make clean   Remove node_modules and dist"

setup: frontend-setup
	@echo "Setup complete."

frontend-setup:
	@echo "Installing frontend dependencies..."
	cd "$(FRONTEND)" && npm install

dev: frontend-dev

frontend-dev:
	cd "$(FRONTEND)" && npm run dev -- --port $(FRONTEND_PORT)

build: frontend-build
	@echo "Build complete."

frontend-build:
	cd "$(FRONTEND)" && npm run build

test: frontend-test
	@echo "All tests passed."

frontend-test:
	cd "$(FRONTEND)" && npm test -- --passWithNoTests

clean:
	rm -rf "$(FRONTEND)/node_modules" "$(FRONTEND)/dist"
