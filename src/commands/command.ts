import * as vscode from "vscode";

import Configuration from "../helpers/configuration";
import Utilities from "../helpers/utilities";
import CustomCommand from "./types/command";

export default class Command {
  static createCommands(context: vscode.ExtensionContext, commands: CustomCommand[], commandIds: Set<string>, disposables: vscode.Disposable[]): void {
    commands.forEach(
      (command: CustomCommand) => {
        const commandId = Configuration.extensionName + "." + command.id.replace(" ", "");

        if (commandIds.has(commandId)) {
          const errorMessage = `The id '${command.id}' is used for multiple commands or dropdowns. Please remove duplicate id's.`;
          vscode.window.showErrorMessage(errorMessage);
          return;
        }

        commandIds.add(commandId);

        const disposable = vscode.commands.registerCommand(commandId, async () => {
          const variables = Configuration.variables(command);

          if (command.executeCommand) {
            vscode.commands.executeCommand(command.command, ...command.executeCommandArguments);
          } else {
            const terminalName = command.terminal.name || command.label;

            let associatedTerminal = vscode.window.terminals.find(terminal => terminal.name === terminalName);
            if (!associatedTerminal || !command.terminal.singleInstance) {
              associatedTerminal = vscode.window.createTerminal({ name: terminalName, cwd: variables.cwd });
            }

            if (command.terminal.clear) {
              associatedTerminal.sendText("clear");
            }

            associatedTerminal.show(!command.terminal.focus);
            associatedTerminal.sendText(Utilities.interpolateString(command.command, variables));
          }
        });

        context.subscriptions.push(disposable);
        disposables.push(disposable);
      }
    );
  }
}
