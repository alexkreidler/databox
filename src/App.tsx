import { useEffect, useRef } from "react";
import {
	Layout,
	Model,
	type TabNode,
	type IJsonModel,
	type Node,
} from "flexlayout-react";
import { Import } from "./components/Import";

import { SQLEditor } from "./components/SQLEditor";
import { Results, ResultsProvider } from "./components/Results";
import { Stats } from "./components/Stats";
import { Toaster } from "./components/ui/toaster";

import "flexlayout-react/style/light.css";
import "react-complex-tree/lib/style.css";

const json: IJsonModel = {
	global: { tabEnablePopout: true },
	borders: [],
	layout: {
		type: "row",
		weight: 100,
		children: [
			{
				type: "column",
				weight: 70,
				children: [
					{
						type: "tabset",
						weight: 50,
						children: [
							{
								type: "tab",
								name: "SQL",
								component: "sql",
							},
						],
					},
					{
						type: "tabset",
						weight: 50,
						children: [
							{
								type: "tab",
								name: "Results",
								component: "results",
							},
						],
					},
				],
			},
			{
				type: "column",
				weight: 30,
				children: [
					{
						type: "tabset",
						weight: 50,
						children: [
							{
								type: "tab",
								name: "Import",
								component: "import",
							},
						],
					},
					{
						type: "tabset",
						weight: 50,
						children: [
							{
								type: "tab",
								name: "Stats",
								component: "stats",
							},
						],
					},
				],
			},
		],
	},
};

const model = Model.fromJson(json);

export function App() {
	const ref = useRef<Layout | null>(null);

	const factory = (node: TabNode) => {
		const component = node.getComponent()?.toLowerCase();
		if (component && Components[component]) {
			const Comp = Components[component];
			// @ts-ignore
			return <Comp node={node} />;
		}
		return <>No component found</>;
	};
	useEffect(() => {
		if (ref.current) {
			const root = ref.current.getRootDiv();
			// Don't need anymore, in styles
			root?.style.setProperty("--font-size", "small");
			console.log(root);
		}
	}, []);
	return (
		<ResultsProvider>
			<Toaster />
			<Layout ref={ref} model={model} factory={factory} />
		</ResultsProvider>
	);
}

export const Components: Record<string, React.FC<{ node: Node }>> = {
	// welcome: Welcome,
	import: Import,
	sql: SQLEditor,
	results: Results,
	stats: Stats,
};
