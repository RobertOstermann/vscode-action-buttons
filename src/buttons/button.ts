import * as vscode from "vscode";

import StatusBarButton from "../types/statusBar";

export default class Button {
  static createStatusBarButton(options: StatusBarButton, disposables: vscode.Disposable[]): void {
    const statusBarButton = vscode.window.createStatusBarItem(options.alignment, options.priority);
    statusBarButton.color = options.color;
    statusBarButton.command = options.command;
    statusBarButton.text = options.label;
    statusBarButton.tooltip = options.tooltip;

    statusBarButton.show();
    disposables.push(statusBarButton);
  }
}
