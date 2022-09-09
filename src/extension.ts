"use strict";
import * as vscode from "vscode";

import Configuration from "./helpers/configuration";
import init from "./init";

let disposables: vscode.Disposable[] = [];

const initialize = async (context: vscode.ExtensionContext): Promise<void> => {
  // Clean up the previous status bar buttons.
  disposables.forEach((disposable: vscode.Disposable) => disposable.dispose());
  disposables.splice(0, disposables.length);

  // Add the new status bar buttons to the list of disposables.
  disposables = Configuration.initialize(context);
  disposables = await init(context, disposables);
};

export function activate(context: vscode.ExtensionContext) {
  initialize(context);

  const disposable = vscode.commands.registerCommand(
    `${Configuration.extensionName}.refreshButtons`,
    () => initialize(context)
  );

  context.subscriptions.push(disposable);
}

// This method is called when the extension is deactivated
export function deactivate() {
  return;
}
