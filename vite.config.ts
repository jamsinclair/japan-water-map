import { resolve } from "node:path";
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Plugin to minify JSON files in public/data/
const minifyJsonPlugin = () => ({
  name: "minify-json",
  writeBundle() {
    const dataDir = path.join(__dirname, "dist", "data");
    if (fs.existsSync(dataDir)) {
      const jsonFiles = fs
        .readdirSync(dataDir)
        .filter((file) => file.endsWith(".json"));
      jsonFiles.forEach((file) => {
        const filePath = path.join(dataDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        fs.writeFileSync(filePath, JSON.stringify(data));
      });
      console.log(`Minified ${jsonFiles.length} JSON files`);
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), tailwindcss(), minifyJsonPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        ja: resolve(__dirname, "ja/index.html"),
      },
    },
  },
});
