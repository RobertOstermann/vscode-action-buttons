import { StatusBarAlignment } from "vscode";

export type TerminalOptions = {
  name?: string;
  clear?: boolean;
  cwd?: string;
  focus?: boolean;
  singleInstance?: boolean;
};

type CommandButton = {
  id?: string;
  label?: string;
  command?: string;
  alignment?: StatusBarAlignment;
  color?: string;
  priority?: number;
  saveAll?: boolean;
  showButton?: boolean;
  tooltip?: string;
  terminal?: TerminalOptions;
  useVsCodeApi?: boolean;
  args?: string[];
};

export default CommandButton;
