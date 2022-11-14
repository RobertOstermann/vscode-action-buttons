import { StatusBarAlignment } from "vscode";

type StatusBarButton = {
  alignment: StatusBarAlignment;
  color: string;
  command: string;
  label: string;
  priority: number;
  tooltip: string;
};

export default StatusBarButton;
