import "./style.css";
import jsPDF from "jspdf";

// ─── HTML de la app ───────────────────────────────────────────────────────────

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="container">
    <h1>AI Task Assistant</h1>

    <input id="subject" type="text" placeholder="Materia..." />

    <textarea id="input" placeholder="Ejemplo: Necesito presentar tres tarabajos pero no se por cual emepezar..."></textarea>

    <select id="tone">
      <option value="formal">Formal</option>
      <option value="amigable">Amigable</option>
      <option value="profesional">Profesional</option>
    </select>

    <br />

    <button id="generate">Generar con IA</button>
    <button id="copyBtn">Copiar</button>
    <button id="pdfBtn">Exportar PDF</button>
    <br>
   <br> 
    <section class="result" id="result">La respuesta aparecerá aquí...</section>

  </main>
`;

// ─── Referencias a los elementos ─────────────────────────────────────────────

const button     = document.querySelector("#generate");
const result     = document.querySelector("#result");
const copyBtn    = document.querySelector("#copyBtn");
const pdfBtn     = document.querySelector("#pdfBtn");



// ─── Generar correo con streaming ─────────────────────────────────────────────

button.addEventListener("click", async () => {
  const subject = document.querySelector("#subject").value;
  const input   = document.querySelector("#input").value;
  const tone    = document.querySelector("#tone").value;

  if (!subject.trim() || !input.trim()) {
    result.textContent = "Debes completar la materia y el contexto.";
    return;
  }

  result.textContent = "";
  button.disabled = true;

  const prompt = `
Actúa como un asistente especializado en organización y priorización de tareas académicas para estudiantes jóvenes.

Tu objetivo es:
- Analizar la información proporcionada.
- Interpretar actividades, tareas y responsabilidades.
- Organizar las tareas según prioridad
- Ayudar a planificar el tiempo de forma clara y sencilla.

Formato de respuesta:
- Nombre de la tarea
- Motivo de la prioridad
- Tiempo estimado
- Recomendación breve

Sé organizado, breve y fácil de entender. ten en cuenta el ${tone} escogido basado en:

Asunto: ${subject}
Contexto: ${input}
`;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt,
        stream: true, 
      }),
    });

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText  = "";

    // lee los trozos que llegan uno a uno mientras la IA escribe
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter(line => line.trim() !== "");

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            fullText += parsed.response;
            result.textContent = fullText; // actualiza en pantalla con cada trozo
          }
        } catch {
          // línea incompleta, se ignora
        }
      }
    }
  } catch (error) {
    result.textContent = "Error conectando con Ollama.";
    console.error(error);
  } finally {
    button.disabled = false;
  }
});

// ─── Copiar al portapapeles ───────────────────────────────────────────────────

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(result.textContent);
  alert("copiado");
});

// ─── Exportar PDF ─────────────────────────────────────────────────────────────

pdfBtn.addEventListener("click", () => {
  const doc       = new jsPDF();
  const margin    = 20;
  const maxWidth  = doc.internal.pageSize.getWidth() - margin * 2;
  const pageH     = doc.internal.pageSize.getHeight();
  const lineH     = 7;

  doc.setFontSize(12);
  const lines = doc.splitTextToSize(result.textContent, maxWidth);
  let y = margin;

  for (const line of lines) {
    if (y + lineH > pageH - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineH;
  }

  doc.save("Organizador.pdf");
});

