"use strict";
import * as vscode from "vscode";

import Configuration from "./helpers/configuration";
import init from "./init";

let disposables: vscode.Disposable[] = [];

const initialize = async (context: vscode.ExtensionContext): Promise<void> => {
  // Clean up the previous action buttons.
  disposables.forEach((disposable: vscode.Disposable) => disposable.dispose());
  disposables.splice(0, disposables.length);

  // Add the new action buttons to the list of disposables.
  const disposable = Configuration.initialize(context);
  disposables = await init(context, disposables);
  if (disposable !== null) disposables.push(disposable);
};

export function activate(context: vscode.ExtensionContext) {
  initialize(context);

  const disposable = vscode.commands.registerCommand(
    "actionButtons.refreshButtons",
    () => initialize(context)
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
  return;
}
