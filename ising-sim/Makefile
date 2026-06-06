.PHONY: help setup dev demo build test clean backend-setup frontend-setup backend-dev frontend-dev backend-build frontend-build backend-test frontend-test

ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
BACKEND := $(ROOT)backend
FRONTEND := $(ROOT)frontend

BACKEND_PORT ?= 8080
FRONTEND_PORT ?= 5173

help:
	@echo "Ising simulator"
	@echo ""
	@echo "  make setup   Install backend and frontend dependencies"
	@echo "  make dev     Run backend placeholder + frontend dev server"
	@echo "  make demo    Run Phase 1 backend simulation benchmark"
	@echo "  make build   Build backend release binary and frontend bundle"
	@echo "  make test    Run backend and frontend tests"
	@echo "  make clean   Remove build artifacts and node_modules"

setup: backend-setup frontend-setup
	@echo "Setup complete."

backend-setup:
	@echo "Fetching Rust dependencies..."
	cd "$(BACKEND)" && cargo fetch

frontend-setup:
	@echo "Installing frontend dependencies..."
	cd "$(FRONTEND)" && npm install

dev:
	@echo "Starting dev mode (backend placeholder, frontend on http://localhost:$(FRONTEND_PORT))..."
	@$(MAKE) -j2 backend-dev frontend-dev

demo:
	cd "$(BACKEND)" && cargo run -- --demo

backend-dev:
	cd "$(BACKEND)" && cargo run

frontend-dev:
	cd "$(FRONTEND)" && npm run dev -- --port $(FRONTEND_PORT)

build: backend-build frontend-build
	@echo "Build complete."

backend-build:
	cd "$(BACKEND)" && cargo build --release

frontend-build:
	cd "$(FRONTEND)" && npm run build

test: backend-test frontend-test
	@echo "All tests passed."

backend-test:
	cd "$(BACKEND)" && cargo test

frontend-test:
	cd "$(FRONTEND)" && npm test -- --passWithNoTests

clean:
	cd "$(BACKEND)" && cargo clean
	rm -rf "$(FRONTEND)/node_modules" "$(FRONTEND)/dist"
