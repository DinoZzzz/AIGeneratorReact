import json
from playwright.sync_api import sync_playwright, Page, Route

def mock_supabase_responses(page: Page):
    # Mock Auth Session via window variable (supported by patched AuthContext)
    page.context.add_init_script("""
        window.MOCK_SESSION = {
            access_token: 'fake-token',
            refresh_token: 'fake-refresh-token',
            user: {
                id: 'user-123',
                email: 'test@example.com',
                role: 'authenticated'
            }
        };
    """)

    # Mock History List
    def handle_history_list(route: Route):
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([
                {
                    "id": "export-1",
                    "type_id": 1,
                    "construction_id": "cons-1",
                    "customer_id": "cust-1",
                    "certifier_id": "cert-1",
                    "user_id": "user-1",
                    "construction_part": "Section A",
                    "created_at": "2023-10-27T10:00:00Z",
                    "certifier": {"name": "John Certifier", "email": "john@example.com"},
                    "user": {"name": "Jane Creator", "email": "jane@example.com"},
                    "report_export_forms": [{"count": 3}]
                },
                {
                    "id": "export-2",
                    "type_id": 2,
                    "construction_id": "cons-2",
                    "customer_id": "cust-2",
                    "certifier_id": "cert-2",
                    "user_id": "user-2",
                    "construction_part": "Section B",
                    "created_at": "2023-10-26T14:30:00Z",
                    "certifier": {"name": "Mike Certifier", "email": "mike@example.com"},
                    "user": {"name": "Sara Creator", "email": "sara@example.com"},
                    "report_export_forms": [{"count": 1}]
                }
            ])
        )

    page.route("**/rest/v1/report_exports?select=*", handle_history_list)
    # Also catch the one with parameters
    page.route("**/rest/v1/report_exports?*&offset=0&limit=50", handle_history_list)

    # Mock History Details
    def handle_history_detail(route: Route):
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "id": "export-1",
                "type_id": 1,
                "construction_id": "cons-1",
                "customer_id": "cust-1",
                "certifier_id": "cert-1",
                "user_id": "user-1",
                "construction_part": "Section A",
                "drainage": "Gravity",
                "water_remark": "None",
                "water_deviation": "None",
                "air_remark": "N/A",
                "air_deviation": "N/A",
                "examination_date": "2023-10-25",
                "created_at": "2023-10-27T10:00:00Z",
                "certifier": {"name": "John Certifier", "email": "john@example.com"},
                "user": {"name": "Jane Creator", "email": "jane@example.com"}
            })
        )
    page.route("**/rest/v1/report_exports?*id=eq.export-1*", handle_history_detail)

    # Mock Export Forms
    def handle_export_forms(route: Route):
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([
                {
                    "id": "ef-1",
                    "type_id": 1,
                    "ordinal": 0,
                    "report_form": {
                        "satisfies": True,
                        "pipe_length": 10.5,
                        "pipe_diameter": 150
                    }
                },
                {
                    "id": "ef-2",
                    "type_id": 1,
                    "ordinal": 1,
                    "report_form": {
                        "satisfies": False,
                        "pipe_length": 5.0,
                        "pipe_diameter": 100
                    }
                }
            ])
        )
    page.route("**/rest/v1/report_export_forms?*", handle_export_forms)


def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Mocking
    mock_supabase_responses(page)

    print("Navigating to History page...")
    page.goto("http://localhost:5173/history")

    # Wait for table to load
    try:
        page.wait_for_selector("text=Section A", timeout=5000)
    except:
        print("Timeout waiting for 'Section A'. Taking screenshot for debug.")
        page.screenshot(path="verification/debug_history_load_fail_2.png")
        raise

    print("History list loaded. Taking screenshot.")
    page.screenshot(path="verification/history_list.png")

    print("Clicking Open on the first item...")
    # Click the Open button for the first row
    page.click("button:has-text('Open')")

    print("Waiting for details page...")
    page.wait_for_selector("text=Export Details: Section A", timeout=5000)

    print("Details page loaded. Taking screenshot.")
    page.screenshot(path="verification/history_details.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
