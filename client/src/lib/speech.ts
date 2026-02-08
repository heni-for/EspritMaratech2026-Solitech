type BrowserSpeechRecognition = SpeechRecognitionConstructor | undefined;

export function getBrowserRecognition(): SpeechRecognition | null {
  const Ctor: BrowserSpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

export function browserTtsSpeak(text: string, lang = "fr-FR") {
  if (!("speechSynthesis" in window)) {
    throw new Error("Synthese vocale indisponible dans ce navigateur.");
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return btoa(
    new Uint8Array(buffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );
}
