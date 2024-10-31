import type React from "react";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Table } from "apache-arrow";
import { ArrowGrid } from "./ArrowGrid";
import type { Node } from "flexlayout-react";
import { EmptyState } from "./ui/empty-state";

interface ResultsContextType {
	results: Table | null;
	updateResults: (newResults: Table) => void;
}

const ResultsContext = createContext<ResultsContextType | undefined>(undefined);

export const ResultsProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [results, setResults] = useState<Table | null>(null);

	const updateResults = (newResults: Table) => {
		setResults(newResults);
	};

	return (
		<ResultsContext.Provider value={{ results, updateResults }}>
			{children}
		</ResultsContext.Provider>
	);
};

export const useResults = () => {
	const context = useContext(ResultsContext);
	if (context === undefined) {
		throw new Error("useResults must be used within a ResultsProvider");
	}
	return context;
};

export const Results: React.FC<{ node: Node }> = ({ node }) => {
	const { results } = useResults();

	return (
		<div>
			{results ? (
				<ArrowGrid dimensions={node?.getRect()} table={results} />
			) : (
				<EmptyState
					title="No results"
					description="Run a query to see some data"
				/>
			)}
		</div>
	);
};
