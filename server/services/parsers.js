import mammoth from "mammoth";
import * as unpdf from "unpdf";

/**
 * Returns the text content of a document
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @returns {Promise<string>}
 */
export async function parseDocument(buffer, mimetype) {
  switch (mimetype.toLowerCase()) {
    case "application/pdf":
      return await parsePdf(buffer);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return await parseDocx(buffer);
    default:
      return buffer.toString("utf-8");
  }
}

/**
 * Extracts text from a DOCX buffer
 * @param {Buffer} buffer
 * @returns {Promise<string>} extracted text
 */
export async function parseDocx(buffer) {
  const rawText = await mammoth.extractRawText({ buffer });
  return rawText.value || "No text found in DOCX";
}

/**
 * Extracts text from a PDF buffer
 * @param {Buffer} buffer
 * @returns {Promise<string>} extracted text
 */
export async function parsePdf(buffer) {
  const pdf = await unpdf.getDocumentProxy(new Uint8Array(buffer));
  const results = await unpdf.extractText(pdf, { mergePages: true });
  return results.text.trim() || "No text found in PDF";
}
