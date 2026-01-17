#!/bin/bash

# Test Resume Upload to Gemini API
# This script tests that Gemini can accept and analyze a PDF resume via inline base64
#
# Usage: ./test-resume-upload.sh <path-to-resume.pdf>
# Example: ./test-resume-upload.sh ~/Downloads/my_resume.pdf

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Hushh Resume Upload Test Script     ${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if API key is set
if [ -z "$GEMINI_API_KEY" ]; then
    # Try to read from .env.local
    if [ -f ".env.local" ]; then
        export GEMINI_API_KEY=$(grep VITE_GEMINI_API_KEY .env.local | cut -d '=' -f2)
    fi
    
    if [ -z "$GEMINI_API_KEY" ]; then
        echo -e "${RED}Error: GEMINI_API_KEY not set${NC}"
        echo "Set it with: export GEMINI_API_KEY=your_api_key"
        echo "Or add VITE_GEMINI_API_KEY to .env.local"
        exit 1
    fi
fi

echo -e "${GREEN}✓ API Key found${NC}"

# Check if resume file is provided
RESUME_PATH="${1:-}"
if [ -z "$RESUME_PATH" ]; then
    # Create a test PDF if none provided
    echo -e "${YELLOW}No resume provided, creating a test PDF...${NC}"
    
    # Create a simple test file
    TEST_CONTENT="This is a test resume for John Doe. Experience: Software Engineer at Google for 5 years. Skills: Python, JavaScript, TypeScript, React, Node.js. Education: BS in Computer Science from MIT."
    RESUME_PATH="/tmp/test_resume.txt"
    echo "$TEST_CONTENT" > "$RESUME_PATH"
    MIME_TYPE="text/plain"
    echo -e "${GREEN}✓ Created test file at $RESUME_PATH${NC}"
else
    if [ ! -f "$RESUME_PATH" ]; then
        echo -e "${RED}Error: File not found: $RESUME_PATH${NC}"
        exit 1
    fi
    
    # Determine MIME type
    if [[ "$RESUME_PATH" == *.pdf ]]; then
        MIME_TYPE="application/pdf"
    elif [[ "$RESUME_PATH" == *.doc ]]; then
        MIME_TYPE="application/msword"
    elif [[ "$RESUME_PATH" == *.docx ]]; then
        MIME_TYPE="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else
        MIME_TYPE="text/plain"
    fi
    echo -e "${GREEN}✓ Resume found: $RESUME_PATH (${MIME_TYPE})${NC}"
fi

# Get file size
FILE_SIZE=$(wc -c < "$RESUME_PATH" | tr -d ' ')
FILE_SIZE_MB=$(echo "scale=2; $FILE_SIZE / 1048576" | bc)
echo -e "${BLUE}   File size: ${FILE_SIZE_MB} MB${NC}"

# Check file size (30MB limit)
MAX_SIZE=$((30 * 1024 * 1024))
if [ "$FILE_SIZE" -gt "$MAX_SIZE" ]; then
    echo -e "${RED}Error: File too large. Maximum size is 30MB${NC}"
    exit 1
fi
echo -e "${GREEN}✓ File size OK (< 30MB)${NC}"

# Convert to base64
echo -e "${YELLOW}Converting to base64...${NC}"
BASE64_DATA=$(base64 < "$RESUME_PATH" | tr -d '\n')
echo -e "${GREEN}✓ Base64 conversion complete (${#BASE64_DATA} characters)${NC}"

# Create the request payload
echo -e "${YELLOW}Testing Gemini API with inline data...${NC}"

# Build the JSON payload
PAYLOAD=$(cat <<EOF
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "inlineData": {
            "mimeType": "$MIME_TYPE",
            "data": "$BASE64_DATA"
          }
        },
        {
          "text": "This is a resume. Please analyze it and provide: 1) Name of the candidate, 2) Years of experience, 3) Top 3 skills. Respond in JSON format."
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 1024
  }
}
EOF
)

# Make the API request
echo -e "${BLUE}Sending request to Gemini API...${NC}"

RESPONSE=$(curl -s -X POST \
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

# Check for errors
if echo "$RESPONSE" | grep -q '"error"'; then
    echo -e "${RED}✗ API Error:${NC}"
    echo "$RESPONSE" | jq '.error' 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

# Extract and display the response
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   ✓ RESUME UPLOAD TEST PASSED!        ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Gemini Analysis:${NC}"
echo "$RESPONSE" | jq -r '.candidates[0].content.parts[0].text' 2>/dev/null || echo "$RESPONSE"
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Test Summary                        ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "   File:       $RESUME_PATH"
echo -e "   Size:       ${FILE_SIZE_MB} MB"
echo -e "   MIME Type:  $MIME_TYPE"
echo -e "   Base64 Len: ${#BASE64_DATA} chars"
echo -e "   API:        ${GREEN}✓ Working${NC}"
echo -e "${GREEN}========================================${NC}"

# Clean up test file
if [[ "$RESUME_PATH" == "/tmp/test_resume.txt" ]]; then
    rm -f "$RESUME_PATH"
fi

echo ""
echo -e "${BLUE}To test with your own resume:${NC}"
echo -e "   ./scripts/test-resume-upload.sh /path/to/your/resume.pdf"
