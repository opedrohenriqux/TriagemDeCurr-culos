from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    for i in range(5): # Try to connect 5 times
        try:
            page.goto("http://localhost:3000/")
            break # If successful, exit the loop
        except Exception as e:
            print(f"Connection attempt {i+1} failed: {e}")
            time.sleep(5) # Wait 5 seconds before retrying
    else:
        print("Failed to connect to the server after multiple attempts.")
        browser.close()
        return

    # Go to interviews and create a new dynamic
    page.wait_for_selector("main[key='vagas']")
    page.get_by_role("button", name="entrevistas").click()
    page.get_by_role("button", name="Dinâmica").click()
    page.get_by_role("button", name="Criar Dinâmica").click()
    page.get_by_label("Título da Dinâmica*").fill("Teste de Dinâmica Colaborativa")
    page.get_by_label("Data da Dinâmica*").fill("2025-10-26")
    page.get_by_label("Script / Instruções").fill("Este é um teste de script para a dinâmica.")
    page.get_by_role("button", name="Selecionar Todos").click()
    page.get_by_role("button", name="Duplas").click()
    page.screenshot(path="jules-scratch/verification/06-dynamic-editor.png")
    page.get_by_role("button", name="Salvar Dinâmica").click()

    # Open the new dynamic and get the group ID
    page.get_by_text("Teste de Dinâmica Colaborativa").click()
    page.screenshot(path="jules-scratch/verification/07-dynamic-viewer.png")
    group_id = page.locator(".font-mono").inner_text()

    # Go to the group room and submit a summary
    page.goto(f"http://localhost:3000/group-room")
    page.get_by_placeholder("Ex: grupo-001").fill(group_id)
    page.get_by_role("button", name="Acessar").click()
    page.screenshot(path="jules-scratch/verification/08-group-room.png")
    page.get_by_placeholder("Escreva aqui as conclusões e o resumo do seu grupo...").fill("Este é o resumo do grupo. Acreditamos que a colaboração é a chave para o sucesso.")
    page.get_by_role("button", name="Enviar Resumo").click()

    # Go back to the dynamic viewer and analyze the summary
    page.goto("http://localhost:3000/")
    page.get_by_role("button", name="entrevistas").click()
    page.get_by_role("button", name="Dinâmica").click()
    page.get_by_text("Teste de Dinâmica Colaborativa").click()
    page.get_by_role("button", name="Analisar com IA").click()
    page.wait_for_selector("text=Analisando...")
    page.wait_for_selector("text=Análise de Originalidade")
    page.screenshot(path="jules-scratch/verification/09-dynamic-analysis.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
