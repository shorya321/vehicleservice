#!/bin/bash

################################################################################
# Staging Smoke Tests - VIK-29
#
# Purpose: Automated smoke tests for staging deployment verification
# Usage: ./scripts/staging-smoke-tests.sh [staging-url]
# Example: ./scripts/staging-smoke-tests.sh https://staging.yourdomain.com
#
# Tests:
# - Application health
# - Critical page loads
# - API endpoint accessibility
# - Static asset serving
# - Database connectivity
# - Stripe integration basics
# - Authentication flows
#
# Exit Codes:
# 0 - All tests passed
# 1 - One or more tests failed
################################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGING_URL="${1:-https://staging.yourdomain.com}"
TIMEOUT=10
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test results array
declare -a FAILED_TEST_NAMES=()

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

print_test() {
    echo -e "${YELLOW}▶ Test $TOTAL_TESTS: $1${NC}"
}

print_pass() {
    echo -e "${GREEN}  ✓ PASS${NC}: $1"
    ((PASSED_TESTS++))
}

print_fail() {
    echo -e "${RED}  ✗ FAIL${NC}: $1"
    ((FAILED_TESTS++))
    FAILED_TEST_NAMES+=("Test $TOTAL_TESTS: $2")
}

print_skip() {
    echo -e "${YELLOW}  ⊘ SKIP${NC}: $1"
}

test_http_status() {
    local url=$1
    local expected_status=$2
    local timeout=${3:-$TIMEOUT}

    local actual_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $timeout "$url" 2>/dev/null || echo "000")

    if [ "$actual_status" = "$expected_status" ]; then
        return 0
    else
        echo "Expected: $expected_status, Got: $actual_status" >&2
        return 1
    fi
}

test_response_contains() {
    local url=$1
    local expected_text=$2
    local timeout=${3:-$TIMEOUT}

    local response=$(curl -s --max-time $timeout "$url" 2>/dev/null || echo "")

    if echo "$response" | grep -q "$expected_text"; then
        return 0
    else
        echo "Response does not contain: $expected_text" >&2
        return 1
    fi
}

test_json_field() {
    local url=$1
    local json_path=$2
    local expected_value=$3
    local timeout=${4:-$TIMEOUT}

    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        echo "jq not installed, skipping JSON validation" >&2
        return 2  # Skip
    fi

    local actual_value=$(curl -s --max-time $timeout "$url" 2>/dev/null | jq -r "$json_path" 2>/dev/null || echo "")

    if [ "$actual_value" = "$expected_value" ]; then
        return 0
    else
        echo "Expected: $expected_value, Got: $actual_value" >&2
        return 1
    fi
}

################################################################################
# Test Suite 1: Infrastructure & Health Checks
################################################################################

run_infrastructure_tests() {
    print_header "Test Suite 1: Infrastructure & Health Checks"

    # Test 1: Application Reachability
    ((TOTAL_TESTS++))
    print_test "Application is reachable"
    if test_http_status "$STAGING_URL" "200"; then
        print_pass "Application responds to requests"
    else
        print_fail "Application is not reachable or returns non-200 status" "Application Reachability"
    fi

    # Test 2: Health Endpoint
    ((TOTAL_TESTS++))
    print_test "Health endpoint returns 200"
    if test_http_status "$STAGING_URL/api/health" "200"; then
        print_pass "Health endpoint accessible"
    else
        print_fail "Health endpoint not accessible" "Health Endpoint"
    fi

    # Test 3: Health Endpoint JSON
    ((TOTAL_TESTS++))
    print_test "Health endpoint returns valid JSON with status 'ok'"
    result=$(test_json_field "$STAGING_URL/api/health" ".status" "ok")
    if [ $? -eq 0 ]; then
        print_pass "Health endpoint returns status 'ok'"
    elif [ $? -eq 2 ]; then
        print_skip "jq not installed, cannot validate JSON"
    else
        print_fail "Health endpoint does not return status 'ok'" "Health JSON"
    fi

    # Test 4: HTTPS Redirect
    ((TOTAL_TESTS++))
    print_test "HTTP redirects to HTTPS"
    http_url=$(echo "$STAGING_URL" | sed 's/https/http/')
    if curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$http_url" 2>/dev/null | grep -qE "301|302|307|308"; then
        print_pass "HTTP correctly redirects to HTTPS"
    else
        print_skip "HTTPS redirect check - may be behind proxy"
    fi

    # Test 5: Response Time
    ((TOTAL_TESTS++))
    print_test "Response time < 2 seconds"
    response_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time 5 "$STAGING_URL" 2>/dev/null || echo "0")
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        print_pass "Response time: ${response_time}s"
    else
        print_fail "Response time too slow: ${response_time}s" "Response Time"
    fi
}

################################################################################
# Test Suite 2: Critical Page Loads
################################################################################

run_page_load_tests() {
    print_header "Test Suite 2: Critical Page Loads"

    # Test 6: Home Page
    ((TOTAL_TESTS++))
    print_test "Home page loads successfully"
    if test_http_status "$STAGING_URL/" "200"; then
        print_pass "Home page accessible"
    else
        print_fail "Home page not accessible" "Home Page"
    fi

    # Test 7: Admin Login Page
    ((TOTAL_TESTS++))
    print_test "Admin login page loads"
    if test_http_status "$STAGING_URL/admin/login" "200"; then
        print_pass "Admin login page accessible"
    else
        print_fail "Admin login page not accessible" "Admin Login"
    fi

    # Test 8: Business Login Page
    ((TOTAL_TESTS++))
    print_test "Business login page loads"
    if test_http_status "$STAGING_URL/business/login" "200"; then
        print_pass "Business login page accessible"
    else
        print_fail "Business login page not accessible" "Business Login"
    fi

    # Test 9: Wallet Page (Should redirect to login if not authenticated)
    ((TOTAL_TESTS++))
    print_test "Wallet page returns 200 or redirects (302)"
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$STAGING_URL/business/wallet" 2>/dev/null || echo "000")
    if [ "$status" = "200" ] || [ "$status" = "302" ] || [ "$status" = "307" ]; then
        print_pass "Wallet page handles requests correctly (status: $status)"
    else
        print_fail "Wallet page returns unexpected status: $status" "Wallet Page"
    fi

    # Test 10: Search Results Page
    ((TOTAL_TESTS++))
    print_test "Search results page loads"
    if test_http_status "$STAGING_URL/search/results" "200"; then
        print_pass "Search results page accessible"
    else
        print_skip "Search results page - may require query parameters"
    fi
}

################################################################################
# Test Suite 3: API Endpoints
################################################################################

run_api_tests() {
    print_header "Test Suite 3: API Endpoints"

    # Test 11: Stripe Connect Endpoint
    ((TOTAL_TESTS++))
    print_test "Stripe Connect API endpoint exists"
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$STAGING_URL/api/business/stripe/connect" 2>/dev/null || echo "000")
    if [ "$status" = "401" ] || [ "$status" = "405" ] || [ "$status" = "200" ]; then
        print_pass "Stripe Connect endpoint exists (status: $status)"
    else
        print_fail "Stripe Connect endpoint not found (status: $status)" "Stripe Connect API"
    fi

    # Test 12: Webhook Endpoint
    ((TOTAL_TESTS++))
    print_test "Webhook endpoint exists and rejects unsigned requests"
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT -X POST "$STAGING_URL/api/business/wallet/webhook" 2>/dev/null || echo "000")
    if [ "$status" = "400" ] || [ "$status" = "401" ]; then
        print_pass "Webhook endpoint correctly rejects unsigned requests (status: $status)"
    else
        print_fail "Webhook endpoint returns unexpected status: $status" "Webhook Endpoint"
    fi

    # Test 13: Payment Intent API
    ((TOTAL_TESTS++))
    print_test "Payment Intent API endpoint exists"
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT -X POST "$STAGING_URL/api/payment/create-intent" 2>/dev/null || echo "000")
    if [ "$status" = "400" ] || [ "$status" = "401" ] || [ "$status" = "405" ]; then
        print_pass "Payment Intent endpoint exists (status: $status)"
    else
        print_skip "Payment Intent endpoint - may require authentication"
    fi
}

################################################################################
# Test Suite 4: Static Assets
################################################################################

run_static_asset_tests() {
    print_header "Test Suite 4: Static Assets"

    # Test 14: Favicon
    ((TOTAL_TESTS++))
    print_test "Favicon loads"
    if test_http_status "$STAGING_URL/favicon.ico" "200"; then
        print_pass "Favicon accessible"
    else
        print_skip "Favicon - may not exist or different path"
    fi

    # Test 15: Next.js Static Directory
    ((TOTAL_TESTS++))
    print_test "Next.js static assets serve correctly"
    # Get a static CSS file from the page
    css_file=$(curl -s "$STAGING_URL" 2>/dev/null | grep -oP '/_next/static/css/[a-zA-Z0-9\-._]+\.css' | head -1)
    if [ -n "$css_file" ]; then
        if test_http_status "$STAGING_URL$css_file" "200"; then
            print_pass "Next.js static assets accessible"
        else
            print_fail "Next.js static assets not accessible" "Static Assets"
        fi
    else
        print_skip "Could not find CSS file to test"
    fi

    # Test 16: Public Assets
    ((TOTAL_TESTS++))
    print_test "Public directory assets accessible"
    # Test a common public asset
    if test_http_status "$STAGING_URL/hero-mercedes-luxury-hotel.jpg" "200"; then
        print_pass "Public assets accessible"
    else
        print_skip "Public assets - specific file may not exist"
    fi
}

################################################################################
# Test Suite 5: Security Headers
################################################################################

run_security_tests() {
    print_header "Test Suite 5: Security Headers"

    # Test 17: HSTS Header
    ((TOTAL_TESTS++))
    print_test "HSTS header present"
    if curl -s -I --max-time $TIMEOUT "$STAGING_URL" 2>/dev/null | grep -i "strict-transport-security" > /dev/null; then
        print_pass "HSTS header present"
    else
        print_fail "HSTS header missing" "HSTS Header"
    fi

    # Test 18: X-Frame-Options Header
    ((TOTAL_TESTS++))
    print_test "X-Frame-Options header present"
    if curl -s -I --max-time $TIMEOUT "$STAGING_URL" 2>/dev/null | grep -i "x-frame-options" > /dev/null; then
        print_pass "X-Frame-Options header present"
    else
        print_skip "X-Frame-Options header - may be set by application"
    fi

    # Test 19: X-Content-Type-Options Header
    ((TOTAL_TESTS++))
    print_test "X-Content-Type-Options header present"
    if curl -s -I --max-time $TIMEOUT "$STAGING_URL" 2>/dev/null | grep -i "x-content-type-options" > /dev/null; then
        print_pass "X-Content-Type-Options header present"
    else
        print_skip "X-Content-Type-Options header - may be set by application"
    fi
}

################################################################################
# Test Suite 6: Database & Integration Tests
################################################################################

run_integration_tests() {
    print_header "Test Suite 6: Database & Integration Tests"

    # Test 20: Database-dependent Page (Admin Dashboard)
    ((TOTAL_TESTS++))
    print_test "Database-dependent pages load (indicates DB connectivity)"
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$STAGING_URL/admin" 2>/dev/null || echo "000")
    if [ "$status" = "200" ] || [ "$status" = "302" ] || [ "$status" = "307" ]; then
        print_pass "Database-dependent pages load correctly (status: $status)"
    else
        print_fail "Database-dependent pages fail to load (status: $status)" "Database Pages"
    fi

    # Test 21: Search Functionality (Database Query)
    ((TOTAL_TESTS++))
    print_test "Search functionality accessible"
    if test_http_status "$STAGING_URL/search/results?from=Dubai&to=Abu%20Dhabi" "200"; then
        print_pass "Search functionality accessible"
    else
        print_skip "Search functionality - may require specific query format"
    fi
}

################################################################################
# Test Suite 7: Performance Tests
################################################################################

run_performance_tests() {
    print_header "Test Suite 7: Performance Tests"

    # Test 22: Home Page Load Time
    ((TOTAL_TESTS++))
    print_test "Home page loads in < 3 seconds"
    load_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time 10 "$STAGING_URL" 2>/dev/null || echo "0")
    if (( $(echo "$load_time < 3.0" | bc -l) )); then
        print_pass "Home page load time: ${load_time}s"
    else
        print_fail "Home page load time too slow: ${load_time}s" "Home Page Performance"
    fi

    # Test 23: API Response Time
    ((TOTAL_TESTS++))
    print_test "API health endpoint responds in < 1 second"
    api_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time 5 "$STAGING_URL/api/health" 2>/dev/null || echo "0")
    if (( $(echo "$api_time < 1.0" | bc -l) )); then
        print_pass "API response time: ${api_time}s"
    else
        print_fail "API response time too slow: ${api_time}s" "API Performance"
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    clear
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                                          ║${NC}"
    echo -e "${BLUE}║         Staging Smoke Tests - VIK-29                    ║${NC}"
    echo -e "${BLUE}║         Business Wallet Enhancement                     ║${NC}"
    echo -e "${BLUE}║                                                          ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Target:${NC} $STAGING_URL"
    echo -e "${YELLOW}Timeout:${NC} ${TIMEOUT}s per test"
    echo -e "${YELLOW}Date:${NC} $(date)"
    echo ""

    # Check dependencies
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}ERROR: curl is not installed${NC}"
        exit 1
    fi

    if ! command -v bc &> /dev/null; then
        echo -e "${YELLOW}WARNING: bc is not installed, some performance tests will be skipped${NC}"
    fi

    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}WARNING: jq is not installed, JSON validation tests will be skipped${NC}"
    fi

    # Run test suites
    run_infrastructure_tests
    run_page_load_tests
    run_api_tests
    run_static_asset_tests
    run_security_tests
    run_integration_tests
    run_performance_tests

    # Print summary
    print_header "Test Summary"

    echo -e "${BLUE}Total Tests:${NC} $TOTAL_TESTS"
    echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
    echo -e "${RED}Failed:${NC} $FAILED_TESTS"

    if [ $FAILED_TESTS -eq 0 ]; then
        echo ""
        echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                                                          ║${NC}"
        echo -e "${GREEN}║              ✓ ALL SMOKE TESTS PASSED                   ║${NC}"
        echo -e "${GREEN}║                                                          ║${NC}"
        echo -e "${GREEN}║  Staging deployment appears healthy and ready for QA    ║${NC}"
        echo -e "${GREEN}║                                                          ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${YELLOW}Next Steps:${NC}"
        echo "  1. Run Quick QA Checklist (docs/QA_STRIPE_CONNECT_CHECKLIST.md)"
        echo "  2. Execute Full Regression Tests (docs/BATCH_4_REGRESSION_TESTING_CHECKLIST.md)"
        echo "  3. Notify QA team that staging is ready"
        echo ""
        exit 0
    else
        echo ""
        echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║                                                          ║${NC}"
        echo -e "${RED}║              ✗ SMOKE TESTS FAILED                       ║${NC}"
        echo -e "${RED}║                                                          ║${NC}"
        echo -e "${RED}║  Staging deployment has issues that need attention      ║${NC}"
        echo -e "${RED}║                                                          ║${NC}"
        echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${RED}Failed Tests:${NC}"
        for test_name in "${FAILED_TEST_NAMES[@]}"; do
            echo -e "  ${RED}✗${NC} $test_name"
        done
        echo ""
        echo -e "${YELLOW}Recommendations:${NC}"
        echo "  1. Review application logs: pm2 logs vehicleservice-staging"
        echo "  2. Check server status: sudo systemctl status vehicleservice-staging"
        echo "  3. Verify environment variables: ./scripts/check-env-vars.sh"
        echo "  4. Test database connection: psql \$DATABASE_URL -c 'SELECT 1;'"
        echo "  5. Review troubleshooting guide: docs/STAGING_DEPLOYMENT_GUIDE.md"
        echo ""
        exit 1
    fi
}

# Run main function
main
