// services/speechService.ts

/**
 * Converte um texto em fala usando a API de Síntese de Voz do navegador.
 * Garante que apenas uma fala seja executada por vez.
 * @param text O texto a ser falado.
 * @param lang O idioma da fala (padrão: 'pt-BR').
 */
export const speak = (text: string, lang: string = 'pt-BR'): void => {
  // Cancela qualquer fala anterior para evitar sobreposição
  window.speechSynthesis.cancel();

  // Cria uma nova instância de fala
  const utterance = new SpeechSynthesisUtterance(text);

  // Define o idioma
  utterance.lang = lang;

  // Tenta encontrar uma voz em português do Brasil para melhor qualidade
  const voices = window.speechSynthesis.getVoices();
  const a = voices.find(voice => voice.lang === 'pt-BR' && voice.name.includes('Google'));
  const brazilianVoice = voices.find(voice => voice.lang === 'pt-BR');

  if (brazilianVoice) {
    utterance.voice = brazilianVoice;
  }

  // Define um tom e velocidade razoáveis
  utterance.pitch = 1; // Padrão
  utterance.rate = 1;  // Padrão

  // Executa a fala
  window.speechSynthesis.speak(utterance);
};

// É uma boa prática pré-carregar as vozes, pois elas podem não estar disponíveis imediatamente.
// Esta linha solicita ao navegador que carregue a lista de vozes.
window.speechSynthesis.getVoices();
