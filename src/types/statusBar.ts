import { StatusBarAlignment } from "vscode";

type StatusBarButton = {
  alignment: StatusBarAlignment;
  color: string;
  command: string;
  label: string | null;
  priority: number;
  tooltip: string;
};

export default StatusBarButton;
