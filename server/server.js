import express from "express";
import api from "./services/api.js";
const { PORT = 9000, CLIENT_FOLDER = "../client" } = process.env;
const app = express();

app.use(express.static(CLIENT_FOLDER));
app.use("/api", api);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
