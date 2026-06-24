package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIResponse represents a standard API response structure
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// SendSuccess sends a successful response with data
func SendSuccess(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
	})
}

// SendCreated sends a successful response for created resources (201)
func SendCreated(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, APIResponse{
		Success: true,
		Data:    data,
	})
}

// SendError sends an error response with a status code and message
func SendError(c *gin.Context, status int, message string) {
	c.JSON(status, APIResponse{
		Success: false,
		Error:   message,
	})
}

// SendValidationError sends a validation error response (400)
func SendValidationError(c *gin.Context, errors map[string]string) {
	c.JSON(http.StatusBadRequest, APIResponse{
		Success: false,
		Error:   "Validation failed",
		Data:    errors,
	})
}

// SendNotFound sends a 404 response
func SendNotFound(c *gin.Context, message string) {
	if message == "" {
		message = "Resource not found"
	}
	SendError(c, http.StatusNotFound, message)
}

// SendInternalError sends a 500 response
func SendInternalError(c *gin.Context, message string) {
	if message == "" {
		message = "Internal server error"
	}
	SendError(c, http.StatusInternalServerError, message)
}

// SendUnauthorized sends a 401 response
func SendUnauthorized(c *gin.Context, message string) {
	if message == "" {
		message = "Unauthorized"
	}
	SendError(c, http.StatusUnauthorized, message)
}

// SendForbidden sends a 403 response
func SendForbidden(c *gin.Context, message string) {
	if message == "" {
		message = "Forbidden"
	}
	SendError(c, http.StatusForbidden, message)
}
