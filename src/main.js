// Imports the application's CSS styles
import "./style.css";

// Imports the jsPDF library to generate PDF files
import jsPDF from "jspdf";

// ─────────────────────────────────────────────────────────────
// MAIN APPLICATION HTML
// ─────────────────────────────────────────────────────────────

// Selects the main container from the HTML
const app = document.querySelector("#app");

// Dynamically injects the full application interface
app.innerHTML = `
  <main class="container">

    <!-- Main title -->
    <h1>AI Task Assistant</h1>

    <!-- Input field for the subject -->
    <input 
      id="subject" 
      type="text" 
      placeholder="Subject..." 
    />

    <!-- Text area for the user context -->
    <textarea 
      id="input" 
      placeholder="Example: I need to submit three assignments but I don't know where to start..."
    ></textarea>

    <!-- Tone selector -->
    <select id="tone">

      <!-- Formal tone -->
      <option value="formal">Formal</option>

      <!-- Friendly tone -->
      <option value="friendly">Friendly</option>

      <!-- Professional tone -->
      <option value="professional">Professional</option>

    </select>

    <br />

    <!-- Button to generate AI response -->
    <button id="generate">Generate with AI</button>

    <!-- Button to copy generated text -->
    <button id="copyBtn">Copy</button>

    <!-- Button to export result as PDF -->
    <button id="pdfBtn">Export PDF</button>

    <br>
    <br>

    <!-- Section where the AI response will appear -->
    <section class="result" id="result">
      The response will appear here...
    </section>

  </main>
`;

// ─────────────────────────────────────────────────────────────
// DOM ELEMENT REFERENCES
// ─────────────────────────────────────────────────────────────

// Main generate button
const button = document.querySelector("#generate");

// Result container
const result = document.querySelector("#result");

// Copy button
const copyBtn = document.querySelector("#copyBtn");

// PDF export button
const pdfBtn = document.querySelector("#pdfBtn");

// ─────────────────────────────────────────────────────────────
// GENERATE AI RESPONSE WITH STREAMING
// ─────────────────────────────────────────────────────────────

// Listens for clicks on the generate button
button.addEventListener("click", async () => {

  // Gets the subject value
  const subject = document.querySelector("#subject").value;

  // Gets the user's input/context
  const input = document.querySelector("#input").value;

  // Gets the selected tone
  const tone = document.querySelector("#tone").value;

  // Validates that required fields are filled
  if (!subject.trim() || !input.trim()) {

    // Displays validation message
    result.textContent =
      "You must complete both the subject and context.";

    // Stops execution
    return;
  }

  // Clears previous result
  result.textContent = "";

  // Disables the button while generating
  button.disabled = true;

  // Prompt sent to the AI model
  const prompt = `
Act as an assistant specialized in organizing and prioritizing academic tasks for young students.

Your objective is:
- Analyze the provided information.
- Interpret activities, tasks, and responsibilities.
- Organize tasks by priority.
- Help plan time clearly and simply.

Response format:
- Task name
- Priority reason
- Estimated time
- Short recommendation

Be organized, concise, and easy to understand.

Take into account the selected ${tone} tone based on:

Subject: ${subject}
Context: ${input}
`;

  try {

    // Sends POST request to Ollama
    const response = await fetch(
      "http://localhost:11434/api/generate",
      {
        method: "POST",

        // JSON content type
        headers: {
          "Content-Type": "application/json",
        },

        // Data sent to the AI model
        body: JSON.stringify({

          // AI model name
          model: "llama3.2",

          // Generated prompt
          prompt,

          // Enables real-time streaming
          stream: true,
        }),
      }
    );

    // Creates a stream reader
    const reader = response.body.getReader();

    // Text decoder
    const decoder = new TextDecoder();

    // Stores the full generated response
    let fullText = "";

    // Infinite loop to continuously read stream chunks
    while (true) {

      // Reads a chunk from the stream
      const { done, value } = await reader.read();

      // Stops loop when stream ends
      if (done) break;

      // Decodes binary chunk into text
      const chunk = decoder.decode(value, {
        stream: true,
      });

      // Splits lines and removes empty ones
      const lines = chunk
        .split("\n")
        .filter(line => line.trim() !== "");

      // Processes each line
      for (const line of lines) {

        try {

          // Parses JSON line into object
          const parsed = JSON.parse(line);

          // If response text exists
          if (parsed.response) {

            // Appends generated text
            fullText += parsed.response;

            // Updates UI in real time
            result.textContent = fullText;
          }

        } catch {

          // Ignores incomplete stream lines
        }
      }
    }

  } catch (error) {

    // Displays connection error
    result.textContent =
      "Error connecting to Ollama.";

    // Logs error in console
    console.error(error);

  } finally {

    // Re-enables button when process finishes
    button.disabled = false;
  }
});

// ─────────────────────────────────────────────────────────────
// COPY RESULT TO CLIPBOARD
// ─────────────────────────────────────────────────────────────

// Handles copy button click
copyBtn.addEventListener("click", () => {

  // Copies generated text to clipboard
  navigator.clipboard.writeText(result.textContent);

  // Confirmation message
  alert("Copied");
});

// ─────────────────────────────────────────────────────────────
// EXPORT RESULT AS PDF
// ─────────────────────────────────────────────────────────────

// Handles PDF export button click
pdfBtn.addEventListener("click", () => {

  // Creates a new PDF document
  const doc = new jsPDF();

  // Document margins
  const margin = 20;

  // Calculates maximum available width
  const maxWidth =
    doc.internal.pageSize.getWidth() - margin * 2;

  // Gets page height
  const pageH =
    doc.internal.pageSize.getHeight();

  // Line height
  const lineH = 7;

  // Sets font size
  doc.setFontSize(12);

  // Automatically wraps text
  const lines = doc.splitTextToSize(
    result.textContent,
    maxWidth
  );

  // Initial vertical position
  let y = margin;

  // Iterates through each line
  for (const line of lines) {

    // Creates a new page if needed
    if (y + lineH > pageH - margin) {

      // Adds a new page
      doc.addPage();

      // Resets vertical position
      y = margin;
    }

    // Writes line into the PDF
    doc.text(line, margin, y);

    // Moves to next line
    y += lineH;
  }

  // Downloads the PDF file
  doc.save("Organizer.pdf");
});
