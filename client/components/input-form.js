import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import htm from "htm";
import { models } from "./options.js";
import { getId } from "../utils.js";

const html = htm.bind(h);

export default function InputForm({ workspace, onChange, onResults }) {
  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const documents = formData.getAll("documents");
    const ids = new Array(documents.length).fill().map(getId);
    formData.append("ids", ids.join(","));
    onResults(documents.map((document, index) => ({ id: ids[index], modelId: formData.get("model"), document: document.name, status: "Processing" })));
    const endpoint = "api/submit";
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });
    const results = await response.json();
    onResults(results.map((result) => ({ ...result, status: result.error ? "Failed" : "Succeeded" })));
  }

  return html`
    <form onSubmit=${handleSubmit}>
      <div class="mb-3">
        <label for="model" class="form-label">Model</label>
        <select id="model" class="form-select" name="model" value=${workspace.model} onChange=${onChange} required>
          <option value="" hidden>Select a model</option>
          ${models.map(
            ({ group, options }) => html`
              <optgroup label=${group}>
                ${options.map((option) => html` <option value=${option.value}>${option.label}</option> `)}
              </optgroup>
            `
          )}
        </select>
      </div>

      <div class="mb-3">
        <label for="prompt" class="form-label">Prompt</label>
        <textarea
          id="prompt"
          class="form-control"
          name="prompt"
          rows="3"
          value=${workspace.prompt}
          onInput=${onChange}
          required></textarea>
      </div>

      <div class="mb-3">
        <label for="documents" class="form-label">Documents</label>
        <input
          type="file"
          id="documents"
          name="documents"
          class="form-control"
          multiple
          accept=".pdf,.docx,.txt"
          required />
      </div>

      <div class="text-end">
        <button type="submit" class="btn btn-primary">Submit</button>
      </div>
    </form>
  `;
}
