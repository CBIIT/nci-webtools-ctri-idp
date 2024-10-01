import { Router } from "express";
import multer from "multer";
import { processDocuments } from "./inference.js";

const api = Router();
// 1gb 
const upload = multer({limits: { fieldSize: 1024 * 1024 * 1024 }});

api.get("/ping", (req, res) => {
  res.json(true);
});

api.post("/submit", upload.any(), async (req, res) => {
  console.log(req.files);
  console.log(req.body);
  const { model, prompt, ids } = req.body;
  const results = await processDocuments(model, prompt, req.files);
  const mappedResults = ids.split(',').map((id, index) => ({ id, ...results[index] }));
  res.json(mappedResults);
  // res.send("File uploaded");
});

export default api;

