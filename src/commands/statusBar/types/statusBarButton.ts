import { StatusBarAlignment } from "vscode";

interface StatusBarButton {
  alignment: StatusBarAlignment;
  color: string;
  command: string;
  label: string | null;
  priority: number;
  tooltip: string;
}

export default StatusBarButton;
