import { MarkdownString, StatusBarAlignment } from "vscode";

export enum BackgroundColor {
  Default = "Default",
  Warning = "Warning",
  Error = "Error",
}

export type TerminalOptions = {
  cwd?: string;
  focus?: boolean;
  singleInstance?: boolean;
};

type CommandButton = {
  id?: string;
  label?: string;
  command?: string;
  alignment?: StatusBarAlignment;
  backgroundColor?: string;
  color?: string;
  createButton?: boolean;
  priority?: number;
  saveAll?: boolean;
  tooltip?: string;
  terminal?: TerminalOptions;
  useVsCodeApi?: boolean;
  args?: string[];
};

export default CommandButton;
