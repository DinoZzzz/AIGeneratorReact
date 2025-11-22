
from playwright.sync_api import Page, expect, sync_playwright

def verify_settings_locked(page: Page):
    page.goto("http://localhost:5174/settings")

    # Verify Header
    expect(page.get_by_role("heading", name="Settings")).to_be_visible()

    # Verify Appearance (should still be there)
    expect(page.get_by_text("Appearance")).to_be_visible()

    # Verify Materials Section
    expect(page.get_by_text("Materials")).to_be_visible()

    # Verify Add Button is NOT there
    expect(page.get_by_role("button", name="Add Material")).not_to_be_visible()

    # Verify Lock Message
    expect(page.get_by_text("Material management is restricted to administrators.")).to_be_visible()

    page.screenshot(path="/home/jules/verification/settings_locked.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_settings_locked(page)
        finally:
            browser.close()
