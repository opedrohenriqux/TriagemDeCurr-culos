from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    for i in range(5): # Try to connect 5 times
        try:
            page.goto("http://localhost:5173/")
            break # If successful, exit the loop
        except Exception as e:
            print(f"Connection attempt {i+1} failed: {e}")
            time.sleep(5) # Wait 5 seconds before retrying
    else:
        print("Failed to connect to the server after multiple attempts.")
        browser.close()
        return

    page.screenshot(path="jules-scratch/verification/01-login-page.png")
    page.get_by_role("button", name="Área do Recrutador →").click()
    page.get_by_placeholder("seuemail@exemplo.com").fill("admin@lacoste.com")
    page.get_by_placeholder("••••••••").fill("admin123")
    page.get_by_role("button", name="Login").click()
    page.wait_for_url("http://localhost:5173/")
    page.screenshot(path="jules-scratch/verification/02-dashboard.png")
    page.get_by_role("button", name="vagas").click()
    page.screenshot(path="jules-scratch/verification/03-vagas.png")
    page.get_by_role("button", name="talentos").click()
    page.screenshot(path="jules-scratch/verification/04-talentos.png")
    page.get_by_role("button", name="entrevistas").click()
    page.screenshot(path="jules-scratch/verification/05-entrevistas.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
