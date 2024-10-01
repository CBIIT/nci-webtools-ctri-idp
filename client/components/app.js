import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import htm from "htm";
import Workspaces from "./workspaces.js";
import Results from "./results.js";
import { defaultWorkspaces } from "./options.js";
import { loadFromStorage } from "../utils.js";

const html = htm.bind(h);
const initialWorkspaces = loadFromStorage("workspaces") || defaultWorkspaces;

export default function App() {
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const [selectedWorkspace, setSelectedWorkspace] = useState(0);
  useEffect(() => {
    localStorage.setItem("workspaces", JSON.stringify(workspaces));
  }, [workspaces, setSelectedWorkspace]);

  return html`
    <div class="row h-100">
      <div class="col-md-3">
        <${Workspaces}
          workspaces=${workspaces}
          setWorkspaces=${setWorkspaces}
          selectedWorkspace=${selectedWorkspace}
          setSelectedWorkspace=${setSelectedWorkspace} />
      </div>

      <div class="col-md-9">
        <${Results} selectedWorkspace=${selectedWorkspace} workspaces=${workspaces} setWorkspaces=${setWorkspaces} />
      </div>
    </div>
  `;
}
