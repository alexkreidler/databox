// 1. Import the createSystem and defaultConfig functions
import {
	createSystem,
	defaultConfig,
	defaultBaseConfig,
} from "@chakra-ui/react";

console.log(defaultBaseConfig.theme?.tokens?.colors);
// 3. Create the system with the new configuration
export const system = createSystem(defaultConfig, {
	theme: {
		tokens: {
			fonts: {
				heading: { value: `'Figtree', sans-serif` },
				body: { value: `'Figtree', sans-serif` },
			},
			colors: {
				// primary: { value: defaultBaseConfig.theme?.tokens?.colors },
			},
		},
	},
});
