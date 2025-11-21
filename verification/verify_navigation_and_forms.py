import time
from playwright.sync_api import sync_playwright, expect

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # 1. Navigate to Login (Just to show we can see it)
            print("Navigating to login...")
            page.goto("http://localhost:5173/login")
            page.screenshot(path="verification/01_login.png")
            print("Login page screenshot taken.")

            # 2. Navigate to Dashboard (Bypassing login form submission because we mocked AuthContext)
            print("Navigating to Platform (Dashboard)...")
            page.goto("http://localhost:5173/")

            # Wait for the "Platform" link in sidebar to ensure layout is loaded
            expect(page.get_by_role("link", name="Platform")).to_be_visible(timeout=30000)
            print("Accessed Platform.")

            # 3. Verify Sidebar
            print("Verifying sidebar...")
            # Check for new items
            expect(page.get_by_role("link", name="Platform")).to_be_visible()
            expect(page.get_by_role("link", name="History")).to_be_visible()
            expect(page.get_by_role("link", name="Examiners")).to_be_visible()
            expect(page.get_by_role("link", name="Help")).to_be_visible()

            # Check that removed items are NOT present in the SIDEBAR
            sidebar = page.locator("nav").first
            expect(sidebar.get_by_role("link", name="Reports")).not_to_be_visible()
            expect(sidebar.get_by_role("link", name="Constructions")).not_to_be_visible()

            page.screenshot(path="verification/02_sidebar_platform.png")
            print("Sidebar verification screenshot taken.")

            # 4. Navigate to Water Form
            print("Navigating to Water Form...")
            page.goto("http://localhost:5173/reports/new")

            # 5. Verify Water Form Split View - Step 1
            print("Verifying Water Form Step 1...")
            expect(page.get_by_text("Step 1: Parameters & Dimensions")).to_be_visible()
            expect(page.get_by_text("Test Parameters")).to_be_visible()

            # Use first match for 'Dimensions'
            expect(page.get_by_text("Dimensions").first).to_be_visible()

            expect(page.get_by_role("button", name="Next Step")).to_be_visible()

            # Ensure Step 2 content is NOT visible
            expect(page.get_by_text("Measurements")).not_to_be_visible()

            page.screenshot(path="verification/03_water_form_step1.png")
            print("Water Form Step 1 screenshot taken.")

            # 6. Go to Step 2
            print("Going to Step 2...")
            page.get_by_role("button", name="Next Step").click()

            expect(page.get_by_text("Step 2: Measurements & Results")).to_be_visible()

            # Use first match for 'Measurements'
            expect(page.get_by_text("Measurements").first).to_be_visible()

            expect(page.get_by_text("Calculated Results")).to_be_visible()
            expect(page.get_by_role("button", name="Previous Step")).to_be_visible()

            page.screenshot(path="verification/04_water_form_step2.png")
            print("Water Form Step 2 screenshot taken.")

            # 7. Verify Air Form Split View
            print("Verifying Air Form...")
            page.goto("http://localhost:5173/reports/new/air")

            expect(page.get_by_text("Step 1: Parameters & Dimensions")).to_be_visible()
            expect(page.get_by_role("button", name="Next Step")).to_be_visible()

            page.screenshot(path="verification/05_air_form_step1.png")
            print("Air Form Step 1 screenshot taken.")

            page.get_by_role("button", name="Next Step").click()
            expect(page.get_by_text("Step 2: Measurements & Results")).to_be_visible()
            expect(page.get_by_text("Pressure Measurements")).to_be_visible()

            page.screenshot(path="verification/06_air_form_step2.png")
            print("Air Form Step 2 screenshot taken.")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
