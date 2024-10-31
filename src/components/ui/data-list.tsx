import {
	DataList as ChakraDataList,
	IconButton,
	Spacer,
} from "@chakra-ui/react";
import { ToggleTip } from "./toggle-tip";
import { forwardRef } from "react";
import { HiOutlineInformationCircle } from "react-icons/hi2";

export const DataListRoot = ChakraDataList.Root;

interface ItemProps extends ChakraDataList.ItemProps {
	label: React.ReactNode;
	value: React.ReactNode;
	info?: React.ReactNode;
	grow?: boolean;
}

export const DataListItem = forwardRef<HTMLDivElement, ItemProps>(
	function DataListItem(props, ref) {
		const { label, info, value, children, grow, ...rest } = props;
		return (
			<ChakraDataList.Item ref={ref} {...rest}>
				<ChakraDataList.ItemLabel flex={grow ? "2" : undefined}>
					{label}
					{info && (
						<ToggleTip content={info}>
							<IconButton variant="ghost" aria-label="info" size="2xs">
								<HiOutlineInformationCircle />
							</IconButton>
						</ToggleTip>
					)}
				</ChakraDataList.ItemLabel>
				{/* <Spacer/> */}
				<ChakraDataList.ItemValue w="fit-content" flexGrow="1">
					{value}
				</ChakraDataList.ItemValue>
				{children}
			</ChakraDataList.Item>
		);
	},
);
