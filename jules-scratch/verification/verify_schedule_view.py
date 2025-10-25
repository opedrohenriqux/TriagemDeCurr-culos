
from playwright.sync_api import sync_playwright, Page, expect

def verify_schedule_view(page: Page):
    """
    Verifies that the schedule view loads correctly after login.
    """
    # 1. Navigate to the application
    page.goto("http://localhost:5173/")

    # 2. Perform login
    page.get_by_label("Email").fill("teste@gmail.com")
    page.get_by_label("Senha").fill("123456")
    page.get_by_role("button", name="Entrar").click()

    # 3. Wait for the main dashboard to load and navigate to schedules
    expect(page.get_by_role("heading", name="Vagas Abertas")).to_be_visible(timeout=10000)
    page.get_by_role("link", name="Agenda").click()

    # 4. Assert that the schedule view is visible
    expect(page.get_by_role("heading", name="Central de Entrevistas")).to_be_visible()
    expect(page.get_by_text("Calendário")).to_be_visible()

    # 5. Take a screenshot for visual confirmation
    page.screenshot(path="jules-scratch/verification/schedule_view_verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_schedule_view(page)
        browser.close()

if __name__ == "__main__":
    main()
