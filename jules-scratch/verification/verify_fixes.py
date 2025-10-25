
import time
from playwright.sync_api import sync_playwright, Page, expect

def verify_archive_link_visibility(page: Page):
    """
    Logs in as a regular user and verifies the 'Arquivo' link is visible.
    """
    print("Verifying archive link visibility...")
    page.goto("http://localhost:3005/")

    # Perform login
    page.get_by_text("Área do Recrutador").click()
    page.get_by_label("Email").fill("teste@gmail.com")
    page.get_by_label("Senha").fill("123456")
    page.get_by_role("button", name="Entrar").click()

    # Wait for navigation and check for the "Arquivo" link
    expect(page.get_by_role("heading", name="Vagas Abertas")).to_be_visible(timeout=10000)
    archive_link = page.get_by_role("button", name="Arquivo")
    expect(archive_link).to_be_visible()
    print("Archive link is visible for non-admin user.")

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/archive_link_visible.png")

def verify_application_submission(page: Page):
    """
    Fills and submits the application form and verifies the success message.
    """
    print("Verifying application submission...")
    page.goto("http://localhost:3005/")

    # Fill out required fields
    page.get_by_label("Vaga Desejada").select_option(index=0)
    page.get_by_label("Nome Completo").fill("Candidato de Teste")
    page.get_by_label("E-mail").fill("teste.candidato@email.com")
    page.get_by_label("Idade").fill("30")
    page.get_by_label("Estado Civil").select_option("Solteiro")
    page.get_by_label("Escolaridade").select_option("Superior Completo")
    page.get_by_label("Faça um resumo sobre você").fill("Resumo profissional do candidato de teste.")
    page.get_by_label("Bairro e Cidade").fill("Centro, São Paulo-SP")
    page.get_by_text("Sim", exact=True).first.check() # Transport
    page.get_by_text("Não", exact=True).last.check() # Experience
    page.get_by_label("Escreva as habilidades (palavras) que te definem").fill("Proativo, Comunicativo")
    page.get_by_label("Como se imagina daqui a 5 anos?").fill("Em uma posição de liderança.")
    page.get_by_text("Manhã").check()
    page.get_by_label("Li e concordo com os termos.").check()

    # Submit the form
    page.get_by_role("button", name="Enviar Inscrição").click()

    # Verify the success message and candidate ID
    expect(page.get_by_role("heading", name="Inscrição Enviada!")).to_be_visible(timeout=10000)
    expect(page.get_by_text("Seu ID de acompanhamento é:")).to_be_visible()
    candidate_id = page.locator("p.text-2xl.font-bold").inner_text()
    assert candidate_id.isdigit(), f"Expected a digit ID, but got {candidate_id}"
    print(f"Application submitted successfully. Candidate ID: {candidate_id}")

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/application_success.png")


def main():
    time.sleep(5) # Wait for dev server to start
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            verify_archive_link_visibility(page)
            verify_application_submission(page)
        finally:
            browser.close()

if __name__ == "__main__":
    main()
