
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:3003/")
    page.wait_for_load_state("networkidle")

    # Use a more direct text selector
    page.click('text=Área do Recrutador')

    page.wait_for_selector('h2:has-text("Área do Recrutador")')
    page.screenshot(path="jules-scratch/verification/login_screen.png")

    page.locator('input[name="email"]').fill("test@example.com")
    page.locator('input[name="password"]').fill("password")

    page.get_by_role("button", name="Entrar").click()

    page.wait_for_selector("h1:has-text('Vagas')")

    page.screenshot(path="jules-scratch/verification/dashboard_screen.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
