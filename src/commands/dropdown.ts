import * as vscode from "vscode";

import Configuration from "../helpers/configuration";
import StatusBarItem from "./statusBar/statusBarItem";
import StatusBarButton from "./statusBar/types/statusBarButton";
import CommandButton from "./types/command";
import DropdownButton from "./types/dropdown";

export default class Dropdown {
  static createDropdowns(context: vscode.ExtensionContext, commands: CommandButton[], commandIds: Set<string>, disposables: vscode.Disposable[]): void {
    const dropdowns = Configuration.dropdowns();

    if (!commands.length || !dropdowns.length) return;

    dropdowns.forEach((dropdown: DropdownButton) => {
      const commandId = Configuration.extensionName + "." + dropdown.id?.replace(" ", "");

      if (commandIds.has(commandId)) {
        const errorMessage = `The id '${dropdown.id}' is used for multiple commands or dropdowns. Please remove duplicate id's.`;
        vscode.window.showErrorMessage(errorMessage);
        return;
      }

      commandIds.add(commandId);

      const dropdownCommands = commands.filter(
        (command: CommandButton) =>
          dropdown.commands.includes(command.id) ||
          dropdown.commands.includes(command.label)
      );
      const quickPickItems: vscode.QuickPickItem[] = [];
      dropdownCommands.forEach((command: CommandButton) => {
        const quickPickItem: vscode.QuickPickItem = {
          label: command.label,
          description: Configuration.extensionName + "." + command.id.replace(" ", ""),
        };
        quickPickItems.push(quickPickItem);
      });

      const disposable = vscode.commands.registerCommand(commandId, async () => {
        const quickPick = vscode.window.createQuickPick();
        quickPick.title = dropdown.options?.title;
        quickPick.items = quickPickItems;
        quickPick.ignoreFocusOut = dropdown.ignoreFocusOut || false;
        quickPick.placeholder = dropdown.options?.placeholder;
        quickPick.onDidChangeSelection((selection) => {
          if (selection[0]) {
            quickPick.hide();
            const quickPickCommand = selection[0].description;
            if (quickPickCommand) {
              vscode.commands.executeCommand(quickPickCommand);
            }
          }
        });
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
      });

      context.subscriptions.push(disposable);
      disposables.push(disposable);

      if (dropdown.showButton) {
        const statusBarOptions: StatusBarButton = {
          alignment: dropdown.alignment,
          color: dropdown.color,
          command: commandId,
          label: dropdown.label,
          tooltip: dropdown.tooltip,
          priority: dropdown.priority
        };

        StatusBarItem.createStatusBarButton(statusBarOptions, disposables);
      }
    });
  }
}
