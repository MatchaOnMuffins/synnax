import { Layout, useLayoutPlacer } from "@/features/layout";
import { Header, Space, Accordion } from "@synnaxlabs/pluto";
import { AiOutlinePlus } from "react-icons/ai";
import { MdWorkspacesFilled } from "react-icons/md";
import { RangesAccordionEntry } from "./RangesAccordionEntry";

const defineRangeWindowLayout: Layout = {
	key: "defineRange",
	type: "defineRange",
	title: "Define Range",
	location: "window",
	window: {
		resizable: false,
		height: 325,
		width: 550,
		navTop: true,
	},
};

const Content = () => {
	const openWindow = useLayoutPlacer();
	return (
		<Space empty style={{ height: "100%" }}>
			<Header level="h4" divided icon={<MdWorkspacesFilled />}>
				Workspace
			</Header>
			<Accordion
				direction="vertical"
				entries={[
					{
						key: "ranges",
						title: "Ranges",
						content: <RangesAccordionEntry />,
						actions: [
							{
								children: <AiOutlinePlus />,
								onClick: () => openWindow(defineRangeWindowLayout),
							},
						],
					},
				]}
			/>
		</Space>
	);
};

export const WorkspaceToolBar = {
	key: "workspace",
	icon: <MdWorkspacesFilled />,
	content: <Content />,
};
function openWindow(defineRangeWindowLayout: Layout) {
	throw new Error("Function not implemented.");
}