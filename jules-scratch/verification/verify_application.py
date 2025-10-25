
from playwright.sync_api import Page, expect
import time

def test_application_submission(page: Page):
    """
    This test verifies that a candidate can successfully submit an application.
    It navigates to the application form, fills it out, submits it, and
    checks for a success confirmation.
    """
    # 1. Arrange: Go to the application homepage.
    # The server is running on localhost:5173 based on dev_server.log
    page.goto("http://localhost:5173/")

    # Wait for the main page to load and jobs to be visible
    expect(page.locator("h2").get_by_text("Vagas em Aberto")).to_be_visible(timeout=10000)

    # 2. Act: Find the first "Ver Vaga" button and click it to open the application modal.
    # Assuming there's at least one job listing.
    view_job_button = page.get_by_role("button", name="Ver Vaga").first
    expect(view_job_button).to_be_visible()
    view_job_button.click()

    # Wait for the modal to appear
    expect(page.locator("h2").get_by_text("Inscreva-se para")).to_be_visible(timeout=5000)

    # Fill out the form
    page.get_by_placeholder("Nome completo").fill("Candidato Teste")
    page.get_by_placeholder("Email").fill("teste@email.com")
    page.get_by_placeholder("Telefone").fill("11999998888")
    page.get_by_placeholder("Cidade").fill("São Paulo")
    page.get_by_placeholder("URL do LinkedIn").fill("https://linkedin.com/in/teste")

    # Check availability
    page.get_by_label("Período Integral").check()

    # Answer questions
    page.locator('textarea[placeholder*="pretensão salarial"]').fill("R$ 3.000,00")
    page.locator('textarea[placeholder*="daqui a 5 anos"]').fill("Espero estar crescendo na Lacoste Burger")

    # Upload a dummy resume (create a dummy file for this)
    # This is crucial as resume processing was a source of bugs.
    with open("jules-scratch/verification/dummy_resume.txt", "w") as f:
        f.write("Este é um currículo de teste.")
    page.locator('input[type="file"]').set_input_files("jules-scratch/verification/dummy_resume.txt")


    # Agree to terms
    page.get_by_label("Li e concordo com os termos.").check()

    # Submit the application
    submit_button = page.get_by_role("button", name="Enviar Inscrição")
    submit_button.click()

    # 3. Assert: Confirm the submission was successful.
    # We expect to see a success message.
    success_message = page.locator("text=Inscrição enviada com sucesso!")
    expect(success_message).to_be_visible(timeout=10000)

    # 4. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/application_success.png")
