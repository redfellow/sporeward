import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BALANCE } from "@sporeward/game";
import "./style.css";
import { RenderingLab } from "./rendering/RenderingLab";
import { SurfaceComparison } from "./rendering/SurfaceComparison";

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");

createRoot(root).render(
	<StrictMode>
		{window.location.pathname === "/rendering/surfaces" ? <SurfaceComparison /> : window.location.pathname === "/rendering" ? <RenderingLab /> : <main className="welcome">
			<h1>Sporeward</h1>
			<p>Head out. Push back the spores.</p>
			<p>The playable map is coming next.</p>
			<p className="welcome__detail">One eligible visit every {BALANCE.visitCooldownMs / 3_600_000} hours.</p>
		</main>}
	</StrictMode>
);
