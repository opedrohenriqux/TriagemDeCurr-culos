
import time
from playwright.sync_api import sync_playwright, Page, expect

CANDIDATE_TO_REJECT_NAME = "Ana Beatriz" # Assuming this candidate exists for the test
CANDIDATE_WITH_RESUME = "Carlos Eduardo" # Assuming this candidate exists and has a resume

def verify_rejection_to_talent_pool(page: Page):
    print("Verifying rejection to talent pool...")
    page.goto("http://localhost:3005/")

    # Login
    page.get_by_text("Área do Recrutador").click()
    page.get_by_label("Email").fill("teste@gmail.com")
    page.get_by_label("Senha").fill("123456")
    page.get_by_role("button", name="Entrar").click()

    # Navigate to the first job
    expect(page.get_by_role("heading", name="Vagas Abertas")).to_be_visible(timeout=15000)
    page.locator(".bg-light-surface.dark\\:bg-surface.p-5.rounded-xl").first.click()

    # Find and reject the candidate
    expect(page.get_by_text(CANDIDATE_TO_REJECT_NAME)).to_be_visible(timeout=10000)
    page.get_by_text(CANDIDATE_TO_REJECT_NAME).click()

    # Open profile modal
    # This might need adjustment based on how the card is structured
    page.locator(f"div:has-text('{CANDIDATE_TO_REJECT_NAME}')").get_by_role("button", name="Ver Perfil & Análise IA").click()

    expect(page.get_by_role("heading", name="Perfil do Candidato")).to_be_visible(timeout=10000)
    page.get_by_label("Status da Candidatura").select_option("rejected")

    # Close the modal
    page.get_by_role("button", name="×").click()

    # Navigate to Talent Pool
    page.get_by_role("button", name="Banco de Talentos").click()

    # Verify the candidate is in the talent pool
    expect(page.get_by_role("heading", name="Banco de Talentos")).to_be_visible()
    expect(page.get_by_text(CANDIDATE_TO_REJECT_NAME)).to_be_visible()
    print(f"Candidate '{CANDIDATE_TO_REJECT_NAME}' successfully moved to Talent Pool.")
    page.screenshot(path="jules-scratch/verification/talent_pool_verification.png")

def verify_resume_analysis_ui(page: Page):
    print("Verifying resume analysis UI...")
    # Assuming already logged in from previous test
    page.get_by_role("button", name="Vagas").click()
    expect(page.get_by_role("heading", name="Vagas Abertas")).to_be_visible(timeout=10000)

    # Navigate to the first job again
    page.locator(".bg-light-surface.dark\\:bg-surface.p-5.rounded-xl").first.click()

    # Find the candidate with a resume and open their profile
    expect(page.get_by_text(CANDIDATE_WITH_RESUME)).to_be_visible(timeout=10000)
    page.locator(f"div:has-text('{CANDIDATE_WITH_RESUME}')").get_by_role("button", name="Ver Perfil & Análise IA").click()

    # Check for the renamed button and the new analysis button
    expect(page.get_by_role("heading", name="Perfil do Candidato")).to_be_visible(timeout=10000)
    expect(page.get_by_role("button", name="Visualizar Informações")).to_be_visible()
    expect(page.get_by_role("button", name="Análise de Currículo")).to_be_visible()

    print("UI for resume analysis is correct.")
    page.screenshot(path="jules-scratch/verification/resume_analysis_ui.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        time.sleep(15)
        try:
            verify_rejection_to_talent_pool(page)
            verify_resume_analysis_ui(page)
        finally:
            browser.close()

if __name__ == "__main__":
    main()
