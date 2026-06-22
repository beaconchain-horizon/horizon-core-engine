# 1. Download and extract into the root of horizon-core-engine (mine branch)
# 2. Make the script executable
chmod +x orchestrator.sh

# 3. Run it
./orchestrator.sh
Step Action
1 Installs Go dependencies (go mod tidy)
2 Runs database migrations (creates customers, payments tables)
3 Starts the backend on port 8080
4 Syncs all repositories to the mine branch
5 Shows final ecosystem status

