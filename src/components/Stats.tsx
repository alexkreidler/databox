import {
	Box,
	Button,
	Heading,
	Link,
	Spacer,
	Spinner,
	Stack,
	Text,
} from "@chakra-ui/react";
import prettyBytes from "pretty-bytes";
import React, { useState } from "react";
import { useAsync } from "react-async-hook";

import { DataListItem, DataListRoot } from "@/components/ui/data-list";

const flatten = (data: object, prefix = "") => {
	const result: { [key: string]: string | number | null } = {};

	for (const [key, value] of Object.entries(data)) {
		if (typeof value === "object") {
			Object.assign(result, flatten(value, `${prefix}${key}.`));
		} else {
			result[`${prefix}${key}`] = value;
		}
	}

	return result;
};

export const Stats = () => {
	const [key, setKey] = useState(Math.random());
	// TODO: show MDN links for each property, maybe have a special percent indicator somewhere in UI for memory usage
	const stats = useAsync(
		async (id: number) => {
			try {
				return {
					storage: await navigator?.storage?.estimate(),
					// @ts-ignore
					deviceMemory: navigator.deviceMemory,
					memory: {
						jsHeapSizeLimit: (performance as any)?.memory?.jsHeapSizeLimit,
						totalJSHeapSize: (performance as any)?.memory?.totalJSHeapSize,
						usedJSHeapSize: (performance as any)?.memory?.usedJSHeapSize,
					},
					crossOriginIsolated,
					// The measureUserAgentSpecificMemory method is only available in secure contexts/when cross origin isolation is enabled.
					// @ts-ignore
					memoryDetails: await performance?.measureUserAgentSpecificMemory?.(),
				};
			} catch (e) {
				console.log(e);
			}
		},
		[key],
	);
	console.log(stats.result);

	return (
		<Stack p={4}>
			<Heading>Stats</Heading>
			<Text>
				Use a Chromium-based browser to see the{" "}
				<Link
					color="blue.700"
					href="https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory"
					target="_blank"
				>
					most detailed information
				</Link>{" "}
				about memory usage.
			</Text>
			<Button mb={4} size="xs" onClick={() => setKey(Math.random())}>
				Refresh
			</Button>
			{stats.loading && <Spinner />}
			<DataListRoot orientation="horizontal">
				{stats.result &&
					Object.entries(flatten(stats.result)).map(([key, value]) => (
						<DataListItem
							key={key}
							label={key}
							value={
								typeof value === "number" && value > 10
									? prettyBytes(value)
									: value?.toString()
							}
							grow={true}
						/>
					))}
			</DataListRoot>
		</Stack>
	);
};
