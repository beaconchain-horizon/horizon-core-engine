// ============================================================
// HORIZON CORE – GitHub Webhook Handler
// Listens for GitHub events (pull requests, pushes) and updates commit status
// ============================================================

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/google/go-github/v62/github"
	"golang.org/x/oauth2"
)

// ============================================================
// ENTRY POINT
// ============================================================
func main() {
	// Register webhook endpoint
	http.HandleFunc("/webhook", handleWebhook)

	// Get port from environment, default to 8080
	port := os.Getenv("WEBHOOK_PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Webhook server listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

// ============================================================
// WEBHOOK HANDLER
// Processes incoming GitHub webhook payloads
// ============================================================
func handleWebhook(w http.ResponseWriter, r *http.Request) {
	// Validate the payload using the webhook secret
	payload, err := github.ValidatePayload(r, []byte(os.Getenv("WEBHOOK_SECRET")))
	if err != nil {
		log.Printf("error validating payload: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Parse the webhook event type and payload
	event, err := github.ParseWebHook(github.WebHookType(r), payload)
	if err != nil {
		log.Printf("error parsing webhook: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Handle specific event types
	switch e := event.(type) {
	case *github.PullRequestEvent:
		// Only process opened and synchronized PR events
		if *e.Action == "opened" || *e.Action == "synchronize" {
			token := os.Getenv("GITHUB_TOKEN")
			if token == "" {
				log.Println("GITHUB_TOKEN not set")
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			// Create GitHub client with authentication
			ctx := r.Context()
			ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: token})
			tc := oauth2.NewClient(ctx, ts)
			client := github.NewClient(tc)

			// Extract repository and commit info from the event
			repoOwner := *e.Repo.Owner.Login
			repoName := *e.Repo.Name
			commitSHA := *e.PullRequest.Head.SHA

			// Set pending status on the commit
			status := &github.RepoStatus{
				State:       github.String("pending"),
				Description: github.String("Horizon Core is checking your code..."),
				Context:     github.String("horizon-core/ci"),
			}
			_, _, err := client.Repositories.CreateStatus(ctx, repoOwner, repoName, commitSHA, status)
			if err != nil {
				log.Printf("error setting pending status: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			// ============================================================
			// RUN YOUR VALIDATION/TESTS HERE
			// Example: exec.Command("go", "test", "./...").Run()
			// ============================================================

			// Update status to success after checks pass
			status.State = github.String("success")
			status.Description = github.String("All checks passed!")
			_, _, err = client.Repositories.CreateStatus(ctx, repoOwner, repoName, commitSHA, status)
			if err != nil {
				log.Printf("error setting success status: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			log.Printf("Processed PR #%d", *e.Number)
		}
	}

	// Respond with OK status
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "OK")
}
