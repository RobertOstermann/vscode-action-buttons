"use strict";
import * as vscode from "vscode";

import Button from "./buttons/button";
import Command from "./buttons/command";
import Dropdown from "./buttons/dropdown";
import Configuration from "./helpers/configuration";
import { buildConfigFromPackageJson } from "./packageJson";
import CommandButton from "./types/command";
import StatusBarButton from "./types/statusBar";

let disposables: vscode.Disposable[] = [];

const initialize = async (context: vscode.ExtensionContext, disposables: vscode.Disposable[]): Promise<vscode.Disposable[]> => {
  const commands: CommandButton[] = [];
  const commandIds: Set<string> = new Set();

  if (Configuration.showReloadButton()) {
    const statusBarOptions: StatusBarButton = {
      alignment: vscode.StatusBarAlignment.Left,
      color: Configuration.defaultColor(),
      command: Configuration.extensionName + ".refreshButtons",
      label: Configuration.reloadButton(),
      tooltip: "Refresh the status bar buttons.",
      priority: 0
    };

    Button.createStatusBarButton(statusBarOptions, disposables);
  }

  if (Configuration.commands() && Configuration.commands().length) {
    commands.push(...Configuration.commands());
  }

  if (Configuration.loadNpmCommands()) {
    commands.push(...(await buildConfigFromPackageJson(Configuration.defaultColor())));
  }

  Command.createCommands(context, commands, commandIds, disposables);
  Dropdown.createDropdowns(context, commands, commandIds, disposables);

  return disposables;
};

const refresh = async (context: vscode.ExtensionContext): Promise<void> => {
  // Clean up the previous status bar buttons.
  disposables.forEach((disposable: vscode.Disposable) => disposable.dispose());
  disposables.splice(0, disposables.length);

  // Add the new status bar buttons to the list of disposables.
  disposables = Configuration.initialize(context);
  disposables = await initialize(context, disposables);
};

export function activate(context: vscode.ExtensionContext) {
  refresh(context);

  const disposable = vscode.commands.registerCommand(
    `${Configuration.extensionName}.refreshButtons`,
    () => refresh(context)
  );

  context.subscriptions.push(disposable);
}

// This method is called when the extension is deactivated
export function deactivate() {
  return;
}
