import { useEffect, useMemo, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { runQuery, useDuckDb } from "duckdb-wasm-kit";
import * as monaco from "monaco-editor";
import { useResults } from "./Results";
import { toaster } from "./ui/toaster";

export function SQLEditor() {
	const { updateResults } = useResults();

	const { db, loading } = useDuckDb();
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

	const runSQL = useMemo(
		() => async (ed: monaco.editor.IStandaloneCodeEditor) => {
			const query = ed.getValue();

			if (!db) {
				console.warn("No database");
				return;
			}
			try {
				try {
					const result = await runQuery(db, query);
					updateResults(result);
				} catch (error) {
					toaster.create({ type: "error", title: (error as Error).message });
				}
			} catch (error) {
				console.error("Error running query:", error);
			}
		},
		[db, updateResults],
	);

	useEffect(() => {
		if (db && editorRef.current) {
			// db.
			editorRef.current.addAction({
				id: "run-sql",
				label: "Run SQL",
				keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
				run: () => runSQL(editorRef.current!),
			});
		}
	}, [db, runSQL]);

	const handleEditorDidMount: OnMount = (editor, monaco) => {
		editorRef.current = editor;
	};

	return (
		<Editor
			height="100%"
			defaultLanguage="sql"
			defaultValue="SELECT * FROM information_schema.columns;"
			onMount={handleEditorDidMount}
		/>
	);
}
