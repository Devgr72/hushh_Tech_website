#!/bin/bash
# ============================================
# Hushh Studio - Veo 3.1 API Test Script
# Tests video generation using curl
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f ".env.local" ]; then
    export $(grep -E "^VITE_GEMINI_API_KEY=" .env.local | xargs)
fi

# Check if API key is set
if [ -z "$VITE_GEMINI_API_KEY" ]; then
    echo -e "${RED}ERROR: VITE_GEMINI_API_KEY not set${NC}"
    echo "Please set the API key in .env.local or export it:"
    echo "  export VITE_GEMINI_API_KEY='your-api-key'"
    exit 1
fi

API_KEY="$VITE_GEMINI_API_KEY"
BASE_URL="https://generativelanguage.googleapis.com/v1beta"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  Hushh Studio - Veo 3.1 API Test${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Test 1: Check API Key Validity
echo -e "${YELLOW}Test 1: Checking API Key Validity...${NC}"

MODELS_RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${BASE_URL}/models?key=${API_KEY}" \
    -H "Content-Type: application/json")

HTTP_CODE=$(echo "$MODELS_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$MODELS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ API Key is valid${NC}"
    
    # Check if Veo model is available
    if echo "$RESPONSE_BODY" | grep -q "veo"; then
        echo -e "${GREEN}✓ Veo model is available${NC}"
    else
        echo -e "${YELLOW}⚠ Veo model not found in list. Checking specific model...${NC}"
    fi
else
    echo -e "${RED}✗ API Key validation failed (HTTP $HTTP_CODE)${NC}"
    echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
    exit 1
fi

echo ""

# Test 2: Check Veo Model Availability
echo -e "${YELLOW}Test 2: Checking Veo 3.1 Model...${NC}"

MODEL_RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${BASE_URL}/models/veo-3.1-generate-preview?key=${API_KEY}" \
    -H "Content-Type: application/json")

HTTP_CODE=$(echo "$MODEL_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$MODEL_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Veo 3.1 model (veo-3.1-generate-preview) is accessible${NC}"
    MODEL_NAME=$(echo "$RESPONSE_BODY" | jq -r '.displayName // "Veo 3.1"')
    echo -e "  Model: ${MODEL_NAME}"
else
    echo -e "${RED}✗ Veo 3.1 model not accessible (HTTP $HTTP_CODE)${NC}"
    echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
    
    # Try alternative model names
    echo ""
    echo -e "${YELLOW}Trying alternative model names...${NC}"
    
    for model in "veo-3.0-generate-preview" "veo-2.0-generate-preview" "veo-preview"; do
        ALT_RESPONSE=$(curl -s -w "\n%{http_code}" \
            "${BASE_URL}/models/${model}?key=${API_KEY}" \
            -H "Content-Type: application/json")
        ALT_CODE=$(echo "$ALT_RESPONSE" | tail -n 1)
        
        if [ "$ALT_CODE" -eq 200 ]; then
            echo -e "${GREEN}✓ Found alternative model: ${model}${NC}"
            break
        fi
    done
fi

echo ""

# Test 3: Start Video Generation
echo -e "${YELLOW}Test 3: Starting Video Generation...${NC}"
echo -e "  Prompt: 'A calm ocean wave rolling onto a sandy beach at sunset'"
echo -e "  Aspect Ratio: 16:9"
echo ""

# Veo uses predictLongRunning endpoint with instances/parameters format
GENERATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning?key=${API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
        "instances": [{"prompt": "A calm ocean wave rolling onto a sandy beach at sunset, golden hour lighting, peaceful atmosphere"}],
        "parameters": {"aspectRatio": "16:9"}
    }')

HTTP_CODE=$(echo "$GENERATE_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$GENERATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Video generation started successfully${NC}"
    
    # Extract operation name
    OPERATION_NAME=$(echo "$RESPONSE_BODY" | jq -r '.name // empty')
    
    if [ -n "$OPERATION_NAME" ]; then
        echo -e "  Operation: ${OPERATION_NAME}"
        echo ""
        
        # Test 4: Poll for completion
        echo -e "${YELLOW}Test 4: Polling for Video Completion...${NC}"
        echo -e "  (This may take 1-2 minutes)"
        echo ""
        
        MAX_POLLS=18  # 18 * 10s = 3 minutes max
        POLL_COUNT=0
        
        while [ $POLL_COUNT -lt $MAX_POLLS ]; do
            POLL_COUNT=$((POLL_COUNT + 1))
            
            POLL_RESPONSE=$(curl -s -w "\n%{http_code}" \
                "${BASE_URL}/${OPERATION_NAME}?key=${API_KEY}" \
                -H "Content-Type: application/json")
            
            POLL_CODE=$(echo "$POLL_RESPONSE" | tail -n 1)
            POLL_BODY=$(echo "$POLL_RESPONSE" | sed '$d')
            
            if [ "$POLL_CODE" -eq 200 ]; then
                IS_DONE=$(echo "$POLL_BODY" | jq -r '.done // false')
                
                if [ "$IS_DONE" = "true" ]; then
                    echo -e "${GREEN}✓ Video generation completed!${NC}"
                    
                    # Check for error
                    ERROR=$(echo "$POLL_BODY" | jq -r '.error // empty')
                    if [ -n "$ERROR" ] && [ "$ERROR" != "null" ]; then
                        echo -e "${RED}✗ Generation Error:${NC}"
                        echo "$ERROR" | jq .
                    else
                        # Extract video info
                        VIDEO_INFO=$(echo "$POLL_BODY" | jq -r '.response.generatedVideos[0] // empty')
                        if [ -n "$VIDEO_INFO" ]; then
                            echo -e "${GREEN}✓ Video generated successfully!${NC}"
                            
                            VIDEO_URI=$(echo "$VIDEO_INFO" | jq -r '.video.uri // empty')
                            if [ -n "$VIDEO_URI" ]; then
                                echo -e "  Video URI: ${VIDEO_URI}"
                                
                                # Save result
                                echo "$POLL_BODY" > /tmp/veo-test-result.json
                                echo -e "${GREEN}✓ Full result saved to: /tmp/veo-test-result.json${NC}"
                            fi
                        fi
                    fi
                    break
                else
                    ELAPSED=$((POLL_COUNT * 10))
                    echo -e "  [${ELAPSED}s] Still generating..."
                fi
            else
                echo -e "${RED}✗ Poll failed (HTTP $POLL_CODE)${NC}"
            fi
            
            sleep 10
        done
        
        if [ $POLL_COUNT -eq $MAX_POLLS ]; then
            echo -e "${YELLOW}⚠ Polling timeout. Video may still be generating.${NC}"
            echo "  Operation: ${OPERATION_NAME}"
        fi
    else
        echo -e "${YELLOW}⚠ Could not extract operation name from response${NC}"
        echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
    fi
else
    echo -e "${RED}✗ Video generation request failed (HTTP $HTTP_CODE)${NC}"
    echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
    
    # Check for specific errors
    ERROR_MSG=$(echo "$RESPONSE_BODY" | jq -r '.error.message // empty')
    if [ -n "$ERROR_MSG" ]; then
        echo ""
        echo -e "${YELLOW}Error Analysis:${NC}"
        
        if echo "$ERROR_MSG" | grep -qi "permission denied\|not authorized"; then
            echo -e "  → API key may not have Veo access enabled"
            echo -e "  → Visit Google AI Studio to enable Veo API"
        elif echo "$ERROR_MSG" | grep -qi "model not found\|unknown model"; then
            echo -e "  → Veo 3.1 model may not be available in your region"
            echo -e "  → Try different model: veo-2.0-generate-preview"
        elif echo "$ERROR_MSG" | grep -qi "quota\|rate limit"; then
            echo -e "  → API quota exceeded. Wait and try again."
        fi
    fi
fi

echo ""
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  Test Complete${NC}"
echo -e "${BLUE}======================================${NC}"
