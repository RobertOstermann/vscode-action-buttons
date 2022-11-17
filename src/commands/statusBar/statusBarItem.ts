import * as vscode from "vscode";

import StatusBarButton from "./types/statusBarButton";

export default class StatusBarItem {
  static createStatusBarButton(options: StatusBarButton, disposables: vscode.Disposable[]): void {
    const statusBarButton = vscode.window.createStatusBarItem(options.alignment, options.priority);
    statusBarButton.color = options.color;
    statusBarButton.command = options.command;
    statusBarButton.text = options.label ?? "undefined";
    statusBarButton.tooltip = options.tooltip;

    statusBarButton.show();
    disposables.push(statusBarButton);
  }
}
