
from playwright.sync_api import Page, expect
import time

def test_application_submission_loading_state(page: Page):
    """
    This test verifies that the submit button shows a loading state and is disabled
    during the form submission process.
    """
    # 1. Arrange: Go to the application homepage.
    # The server is running on localhost:3007 based on the dev_server.log
    page.goto("http://localhost:3007/")

    # Wait for the main page to load and jobs to be visible
    expect(page.locator("h2").get_by_text("Vagas em Aberto")).to_be_visible(timeout=10000)

    # 2. Act: Find the first "Ver Vaga" button and click it to open the application modal.
    view_job_button = page.get_by_role("button", name="Visualizar Vaga").first
    expect(view_job_button).to_be_visible()
    view_job_button.click()

    # Wait for the modal to appear
    expect(page.locator("h2").get_by_text("Inscreva-se para")).to_be_visible(timeout=5000)

    # Fill out the required fields
    page.get_by_placeholder("Nome completo").fill("Candidato de Teste")
    page.get_by_placeholder("Email").fill("teste@example.com")
    page.get_by_placeholder("Ex: Centro, Campinas-SP").fill("Centro, Campinas-SP")
    page.get_by_label("Manhã").check()
    page.get_by_label("Li e concordo com os termos.").check()
    page.locator('textarea[name="personalSummary"]').fill("Resumo pessoal de teste.")
    page.locator('textarea[name="skills"]').fill("Habilidade 1, Habilidade 2")
    page.locator('textarea[name="fiveYearPlan"]').fill("Plano de 5 anos de teste.")
    page.locator('input[name="age"]').fill("30")
    page.locator('select[name="maritalStatus"]').select_option("Solteiro(a)")
    page.locator('select[name="education"]').select_option("Superior Completo")
    page.locator('input[name="transport"][value="Sim"]').check()
    page.locator('input[name="hasExperience"][value="Não"]').check()

    # Get the submit button
    submit_button = page.get_by_role("button", name="Enviar Inscrição")

    # Intentionally slow down the network to observe the loading state
    page.route("**/*", lambda route: time.sleep(2) or route.continue_())

    # Click the submit button
    submit_button.click()

    # 3. Assert: Check for the loading state.
    # The button should be disabled and show "Enviando..."
    expect(submit_button).to_be_disabled(timeout=1000)
    expect(submit_button).to_contain_text("Enviando...")

    # Take a screenshot of the loading state
    page.screenshot(path="jules-scratch/verification/submission_loading.png")

    # Finally, wait for the success message to ensure the process completes
    expect(page.locator("text=Inscrição enviada com sucesso!")).to_be_visible(timeout=15000)
