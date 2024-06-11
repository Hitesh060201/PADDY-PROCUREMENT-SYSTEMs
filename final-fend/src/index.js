import { App } from "./App.js";
import {createRoot} from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css"

const root=createRoot(document.getElementById("root"));

root.render(
   <div>
    <App/>
   </div>
);