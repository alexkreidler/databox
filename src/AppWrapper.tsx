import type * as React from "react";

import { Provider } from "./components/ui/provider";

export function AppWrapper({ children }: React.PropsWithChildren) {
	return <Provider>{children}</Provider>;
}
