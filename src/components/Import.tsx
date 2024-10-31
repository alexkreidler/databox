import { Heading, Stack } from "@chakra-ui/react";
import { snakeCase } from "change-case";
import { insertFile, useDuckDb } from "duckdb-wasm-kit";
import { useEffect, useState } from "react";
import {
	FileUploadDropzone,
	FileUploadList,
	FileUploadRoot,
} from "@/components/ui/file-button";

const ACCEPTED_FILES = {
	"text/csv": [".csv"],
	"application/parquet": [".parquet"],
	"application/arrow": [".arrow"],
	// TODO
	// "text/plain": [".txt"],
	// "application/vnd.ms-excel": [".xls"],
	// "application/json": [".json"],
	// "application/x-sql": [".sql"],
	// "application/x-hdf": [".hdf"],
	// "application/x-hdf5": [".hdf5"],
};

export const Import = () => {
	const { db, loading, error } = useDuckDb();

	const [files, setFiles] = useState<File[]>([]);
	useEffect(() => {
		if (db) {
			window.DB = db;
		}
	}, [db]);

	function addFiles(files: File[]) {
		if (!db) return;
		const out = files.map((f) => {
			insertFile(db, f, snakeCase(f.name.split(".")[0]));
			return { name: f.name, table: snakeCase(f.name) };
		});
		console.log("Loading files", out);
	}
	useEffect(() => {
		if (files.length > 0) {
			console.log("load files");
			addFiles(files);
		}
	}, [files]);

	return (
		<Stack gap={4} p={4} h="full">
			<Heading>Import data</Heading>

			<FileUploadRoot
				maxW="xl"
				alignItems="stretch"
				maxFiles={10}
				accept={ACCEPTED_FILES}
				onFileAccept={(details) => {
					setFiles(details.files);
				}}
			>
				<FileUploadDropzone
					height="full"
					label="Drag and drop here to upload"
					description=".csv, .parquet or .arrow up to 5MB"
				/>
				<FileUploadList />
			</FileUploadRoot>
		</Stack>
	);
};
