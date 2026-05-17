# AI Task Assistant

AI-powered web application built with JavaScript, Vite, and a local AI model using Ollama + TinyLlama.

The app helps students organize and prioritize academic tasks based on their subject, context, and preferred response tone.

---

# Features

* Task prioritization with AI
* Real-time streaming responses
* Copy generated text
* Export results as PDF
* Responsive modern UI
* 100% local AI execution

---

# Technologies

* HTML5
* CSS3
* JavaScript
* Vite
* jsPDF
* Ollama
* llama3.2

# Install the Project

## 1. Install dependencies

```bash
npm install
```

---

# Install Local AI (Ollama)

## 1. Download Ollama

[Ollama](https://ollama.com/download)

---

## 2. Install llama3.2

```bash
ollama pull llama3.2
```

---

## 3. Run Ollama

```bash
ollama serve
```

The local AI server will run on:

```bash
http://localhost:11434
```

---

# Run the Project

Start the development server:

```bash
npm run dev
```

Open the local Vite URL in your browser.

---

# Basic Logic

1. The user enters:

   * Subject
   * Task context
   * Response tone

2. JavaScript creates a custom AI prompt.

3. The app sends the prompt to Ollama using:

```js
fetch("http://localhost:11434/api/generate")
```

4. llama3.2 generates a streamed response in real time.

5. The result is displayed live and can be:

   * Copied
   * Exported as PDF

---

# Main Dependencies

* **Vite** → Development server
* **jsPDF** → PDF export
* **Ollama** → Local AI runtime
* **llama3.2** → AI model

