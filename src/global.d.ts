import type { AsyncDuckDB } from "duckdb-wasm-kit";

declare global {
	interface Window {
		DB: AsyncDuckDB;
	}
}
