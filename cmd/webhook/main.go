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

func main() {
	http.HandleFunc("/webhook", handleWebhook)
	port := os.Getenv("WEBHOOK_PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Webhook server listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func handleWebhook(w http.ResponseWriter, r *http.Request) {
	payload, err := github.ValidatePayload(r, []byte(os.Getenv("WEBHOOK_SECRET")))
	if err != nil {
		log.Printf("error validating payload: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	event, err := github.ParseWebHook(github.WebHookType(r), payload)
	if err != nil {
		log.Printf("error parsing webhook: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	switch e := event.(type) {
	case *github.PullRequestEvent:
		if *e.Action == "opened" || *e.Action == "synchronize" {
			token := os.Getenv("GITHUB_TOKEN")
			if token == "" {
				log.Println("GITHUB_TOKEN not set")
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			ctx := r.Context()
			ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: token})
			tc := oauth2.NewClient(ctx, ts)
			client := github.NewClient(tc)

			repoOwner := *e.Repo.Owner.Login
			repoName := *e.Repo.Name
			commitSHA := *e.PullRequest.Head.SHA

			// set pending status
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

			// here you can run your tests or any validation
			// e.g., exec.Command("go", "test", "./...").Run()

			// after checks, update status
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
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "OK")
}
