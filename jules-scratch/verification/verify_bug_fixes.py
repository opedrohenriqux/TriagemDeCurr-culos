
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = browser.new_page()

    try:
        # 1. Verificar envio do formulário sem anexo
        page.goto("http://localhost:5173")
        page.locator('input[name="name"]').fill("Candidato Teste")
        page.locator('input[name="email"]').fill("teste@teste.com")
        page.locator('input[name="phone"]').fill("123456789")
        page.locator('select[name="jobId"]').select_option(label="Desenvolvedor Frontend")
        page.click('button[type="submit"]')
        # Apenas verificamos se a aplicação não quebra. Uma confirmação visual não é necessária aqui.

        # 2. Fazer login como admin
        page.goto("http://localhost:5173")
        page.click("text=Login de Recrutador")
        page.locator('input[name="email"]').fill("admin@example.com")
        page.locator('input[name="password"]').fill("password")
        page.click('button[type="submit"]')
        page.wait_for_url("http://localhost:5173/")

        # 3. Verificar o painel de mensagens
        page.locator('button[aria-label="Abrir mensagens"]').click()
        expect(page.locator("text=Mensagens")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/01_messaging_panel.png")

        # 4. Verificar detalhes do candidato (erro de 'split')
        page.locator('button[aria-label="Fechar"]').click() # Fechar painel de mensagens
        page.click("text=Vagas")
        page.locator(".job-card").first.click()
        page.locator(".candidate-card").first.click()
        expect(page.locator("text=Perfil do Candidato")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/02_candidate_profile.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
