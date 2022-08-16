import { StatusBarAlignment } from "vscode";

type DropdownOptions = {
  ignoreFocusOut?: boolean;
  placeholder?: string;
  prompt?: string;
  title?: string;
};

type DropdownButton = {
  id?: string;
  label?: string;
  commands?: string[];
  alignment?: StatusBarAlignment;
  color?: string;
  ignoreFocusOut?: boolean;
  priority?: number;
  tooltip?: string;
  options?: DropdownOptions;
};

export default DropdownButton;
