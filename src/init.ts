import { buildConfigFromPackageJson } from './packageJson';
import * as vscode from 'vscode';
import { ButtonOpts, CommandOpts, DropdownOpts } from './types';
import * as path from 'path';

const registerCommand = vscode.commands.registerCommand;

const disposables = [];

const init = async (context: vscode.ExtensionContext) => {
  disposables.forEach(d => d.dispose());
  const extensionName = 'actionButtons';
  const config = vscode.workspace.getConfiguration('actionButtons');
  const defaultColor = config.get<string>('defaultColor');
  const reloadButton = config.get<string>('reloadButton');
  const loadNpmCommands = config.get<boolean>('loadNpmCommands');
  const dropdowns = config.get<DropdownOpts[]>('dropdowns');
  const cmds = config.get<CommandOpts[]>('commands');
  const commands: CommandOpts[] = [];
  const commandIds: Set<string> = new Set();

  if (reloadButton !== null) {
    loadButton({
      command: 'extension.refreshButtons',
      name: reloadButton,
      tooltip: 'Refreshes the action buttons',
      color: defaultColor
    });
  } else {
    const onCfgChange: vscode.Disposable = vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('actionButtons')) {
        vscode.commands.executeCommand('extension.refreshButtons');
      }
    });
    context.subscriptions.push(onCfgChange);
    disposables.push(onCfgChange);
  }

  if (cmds && cmds.length) {
    commands.push(...cmds);
  }

  if (loadNpmCommands !== false) commands.push(...(await buildConfigFromPackageJson(defaultColor)));

  if (commands.length) {
    const terminals: { [name: string]: vscode.Terminal; } = {};
    commands.forEach(
      ({ cwd, saveAll, command, id, name, createButton, tooltip, color, singleInstance, focus, useVsCodeApi, args }: CommandOpts) => {
        const vsCommand = extensionName + '.' + id.replace(' ', '');

        if (commandIds.has(vsCommand)) {
          vscode.window.showErrorMessage(`The id '${id}' is used for multiple commands. Please remove duplicate id's.`);
          return;
        }
        commandIds.add(vsCommand);

        const disposable = registerCommand(vsCommand, async () => {
          const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;

          const vars = {
            // - the path of the folder opened in VS Code
            workspaceFolder: rootPath,

            // - the name of the folder opened in VS Code without any slashes (/)
            workspaceFolderBasename: (rootPath) ? path.basename(rootPath) : null,

            // - the current opened file
            file: (vscode.window.activeTextEditor) ? vscode.window.activeTextEditor.document.fileName : null,

            // - the current opened file relative to workspaceFolder
            relativeFile: (vscode.window.activeTextEditor && rootPath) ? path.relative(
              rootPath,
              vscode.window.activeTextEditor.document.fileName
            ) : null,

            // - the current opened file's basename
            fileBasename: (vscode.window.activeTextEditor) ? path.basename(vscode.window.activeTextEditor.document.fileName) : null,

            // - the current opened file's basename with no file extension
            fileBasenameNoExtension: (vscode.window.activeTextEditor) ? path.parse(path.basename(vscode.window.activeTextEditor.document.fileName)).name : null,

            // - the current opened file's dirname
            fileDirname: (vscode.window.activeTextEditor) ? path.dirname(vscode.window.activeTextEditor.document.fileName) : null,

            // - the current opened file's extension
            fileExtname: (vscode.window.activeTextEditor) ? path.parse(path.basename(vscode.window.activeTextEditor.document.fileName)).ext : null,

            // - the task runner's current working directory on startup
            cwd: cwd || rootPath || require('os').homedir(),

            // - the current selected line number in the active file
            lineNumber: (vscode.window.activeTextEditor) ? vscode.window.activeTextEditor.selection.active.line + 1 : null,

            // - the current selected text in the active file
            selectedText: (vscode.window.activeTextEditor) ? vscode.window.activeTextEditor.document.getText(vscode.window.activeTextEditor.selection) : null,

            // - the path to the running VS Code executable
            execPath: process.execPath
          };

          if (!command) {
            vscode.window.showErrorMessage('No command to execute for this action');
            return;
          }

          if (saveAll) {
            vscode.commands.executeCommand('workbench.action.files.saveAll');
          }

          if (useVsCodeApi) {
            vscode.commands.executeCommand(command, ...(args || []));
          } else {
            let assocTerminal = terminals[vsCommand];
            if (!assocTerminal) {
              assocTerminal = vscode.window.createTerminal({ name, cwd: vars.cwd });
              terminals[vsCommand] = assocTerminal;
            } else {
              if (singleInstance) {
                delete terminals[vsCommand];
                assocTerminal.dispose();
                assocTerminal = vscode.window.createTerminal({ name, cwd: vars.cwd });
                terminals[vsCommand] = assocTerminal;
              } else {
                assocTerminal.sendText('clear');
              }
            }
            assocTerminal.show(!focus);
            assocTerminal.sendText(interpolateString(command, vars));
          }
        });

        context.subscriptions.push(disposable);

        disposables.push(disposable);

        if (createButton) {
          loadButton({
            command: vsCommand,
            name,
            tooltip: tooltip || command,
            color: color || defaultColor,
          });
        }
      }
    );
  } else {
    vscode.window.setStatusBarMessage(
      'VsCode Action Buttons: You have no run commands.',
      4000
    );
  }

  if (commands.length && dropdowns.length) {
    dropdowns.forEach((dropdown: DropdownOpts) => {
      const vsCommand = extensionName + '.' + dropdown.id.replace(' ', '');

      if (commandIds.has(vsCommand)) {
        vscode.window.showErrorMessage(`The id '${dropdown.id}' is used for multiple commands or dropdowns. Please remove duplicate id's.`);
        return;
      }
      commandIds.add(vsCommand);

      const dropdownCommands = commands.filter((command) => dropdown.commands.includes(command.id) || dropdown.commands.includes(command.name));
      const quickPickItems: vscode.QuickPickItem[] = [];
      dropdownCommands.forEach((command: CommandOpts) => {
        const quickPickItem: vscode.QuickPickItem = {
          label: command.name,
          description: extensionName + '.' + command.id.replace(' ', '')
        };
        quickPickItems.push(quickPickItem);
      });

      const disposable = registerCommand(vsCommand, async () => {
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = quickPickItems;
        quickPick.ignoreFocusOut = dropdown.ignoreFocusOut || false;
        quickPick.onDidChangeSelection(selection => {
          if (selection[0]) {
            quickPick.hide();
            const quickPickCommand = selection[0].description;
            vscode.commands.executeCommand(quickPickCommand);
          }
        });
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
      });

      context.subscriptions.push(disposable);

      disposables.push(disposable);

      loadButton({
        command: vsCommand,
        name: dropdown.name,
        tooltip: dropdown.tooltip || null,
        color: dropdown.color || defaultColor,
      });
    });
  }
};

function loadButton({
  command,
  name,
  tooltip,
  color,
}: ButtonOpts) {
  const alignment = vscode.StatusBarAlignment.Left;
  const priority = 0;
  const runButton = vscode.window.createStatusBarItem(alignment, priority);
  runButton.text = name;
  runButton.color = color;
  runButton.tooltip = tooltip;

  runButton.command = command;
  runButton.show();
  disposables.push(runButton);
}

function interpolateString(tpl: string, data: object): string {
  let re = /\$\{([^\}]+)\}/g, match;
  while (match = re.exec(tpl)) {
    let path = match[1].split('.').reverse();
    let obj = data[path.pop()];
    while (path.length) obj = obj[path.pop()];
    tpl = tpl.replace(match[0], obj);
  }
  return tpl;
}

export default init;
