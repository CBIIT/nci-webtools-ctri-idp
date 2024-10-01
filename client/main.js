import { h, render } from "preact";
import htm from "htm";
import App from "./components/app.js";

const html = htm.bind(h);
render(html`<${App} />`, window.app);