import * as fs from "fs";
import * as glob from "glob";
import { homedir } from "os";
import * as path from "path";
import * as vscode from "vscode";

import CommandButton from "../types/command";
import DropdownButton from "../types/dropdown";
import Variables from "../types/variables";

export default class Configuration {
  static extensionName = "betterStatusBar";

  /**
   * Initialize the configuration options that require a reload upon change.
   */
  static initialize(context: vscode.ExtensionContext): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];
    if (Configuration.showReloadButton()) return disposables;

    const configurationChange = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(Configuration.extensionName)) {
        vscode.commands.executeCommand(`${Configuration.extensionName}.refreshButtons`);
      }
    });

    if (Configuration.configurationFilePath() !== null) {
      const configurationFileChange = vscode.workspace.onDidSaveTextDocument((event) => {
        if (event.uri.fsPath.replace(/\\/g, "/").toLowerCase() === Configuration.configurationFilePath().toLowerCase()) {
          vscode.commands.executeCommand(`${Configuration.extensionName}.refreshButtons`);
        }
      });

      context.subscriptions.push(configurationFileChange);
      disposables.push(configurationFileChange);
    }

    context.subscriptions.push(configurationChange);
    disposables.push(configurationChange);

    return disposables;
  }

  /**
   * Initialize the configuration options that require a reload upon change.
   */
  static extensionPath(context: vscode.ExtensionContext): string {
    const extensionPath = context.extensionPath.replace(/\\/g, "/");

    return extensionPath;
  }

  /**
   * @returns Determines whether or not to use the configuration file.
   */
  static useConfigurationFile(): boolean {
    const configurationFile = Configuration.configurationFile() || "";

    return configurationFile === "" ? false : true;
  }

  /**
   * @returns Determines whether or not to use the configuration file.
   */
  static configurationFile(): string {
    return vscode.workspace
      .getConfiguration(Configuration.extensionName)
      .get("configurationFile");
  }


  /**
   * @returns The path to the configuration file.
   */
  static configurationFilePath(): string {
    const configurationFile = Configuration.configurationFile() || "";
    const pattern = "{**/statusBar.{json,jsonc},.vscode/statusBar.{json,jsonc}}";

    if (configurationFile.toLowerCase() === "find") {
      let folder = "";
      let files = [];
      vscode.workspace.workspaceFolders.forEach(workspaceFolder => {
        if (files[0] !== undefined) return;

        folder = workspaceFolder.uri.fsPath.replace(/\\/g, "/");
        files = glob.sync(pattern, { cwd: folder });
      });

      if (files[0] === undefined) return null;
      return folder + "/" + files[0];
    } else {
      return configurationFile;
    }
  }


  /**
   * @returns The JSON object for the configuration file.
   */
  static configurationFileJSON(): any {
    const path = Configuration.configurationFilePath();
    if (!Configuration.useConfigurationFile() || path === null) return null;

    let fileData = fs.readFileSync(path).toString();
    // Strip the comments.
    fileData = fileData.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m);
    // Remove the default name of betterStatusBar.
    fileData = fileData.replace(/betterStatusBar\./g, "");
    const data = JSON.parse(fileData);

    return data;
  }

  /**
   * @returns The color to use for action button text. The default is the theme color.
   */
  static defaultColor(): string {
    if (Configuration.useConfigurationFile()) {
      const configuration = Configuration.configurationFileJSON();
      const defaultColor = configuration?.defaultColor;
      if (defaultColor !== undefined) defaultColor;
    }

    return vscode.workspace
      .getConfiguration(Configuration.extensionName)
      .get("defaultColor") || "statusBar.foreground";
  }

  /**
   * @returns Automatically generate buttons from npm commands listed in `package.json`.
   */
  static loadNpmCommands(): boolean {
    if (Configuration.useConfigurationFile()) {
      const configuration = Configuration.configurationFileJSON();
      const loadNpmCommands = configuration?.loadNpmCommands;
      if (loadNpmCommands !== undefined) return loadNpmCommands;
    }

    return vscode.workspace
      .getConfiguration(Configuration.extensionName)
      .get("loadNpmCommands");
  }

  /**
   * @returns The text for the reload button. The default is to reload on configuration change and not show a reload button.
   */
  static reloadButton(): string | null {
    if (Configuration.useConfigurationFile()) {
      const configuration = Configuration.configurationFileJSON();
      const reloadButton = configuration?.reloadButton;
      if (reloadButton !== undefined) return reloadButton;
    }

    return vscode.workspace
      .getConfiguration(Configuration.extensionName)
      .get<string | null>("reloadButton");
  }

  /**
   * @returns The text for the reload button. The default is to reload on configuration change and not show a reload button.
   */
  static showReloadButton(): boolean {
    if (Configuration.useConfigurationFile()) {
      const configuration = Configuration.configurationFileJSON();
      const reloadButton = configuration?.reloadButton;
      if (reloadButton !== undefined) return reloadButton !== null;
    }

    return vscode.workspace
      .getConfiguration(Configuration.extensionName)
      .get<string | null>("reloadButton") !== null;
  }

  /**
   * @returns A list of action buttons for specified commands.
   */
  static commands(): Array<CommandButton> {
    let commands = [];

    if (Configuration.useConfigurationFile()) {
      const configuration = Configuration.configurationFileJSON();
      commands = configuration?.commands ? configuration.commands : [];
    }

    const userCommands = vscode.workspace
      .getConfiguration(Configuration.extensionName)
      .get<CommandButton[]>("commands");

    commands = [...commands, ...userCommands];

    commands.forEach((command) => {
      // Set defaults for the undefined properties. ID, label, and command must be defined.
      if (command.alignment === undefined) command.alignment = vscode.StatusBarAlignment.Left;
      if (command.color === undefined) command.color = Configuration.defaultColor();
      if (command.priority === undefined) command.priority = 0;
      if (command.saveAll === undefined) command.saveAll = false;
      if (command.showButton === undefined) command.showButton = true;
      if (command.terminal === undefined) command.terminal = {
        name: null,
        clear: true,
        cwd: null,
        focus: false,
        singleInstance: true
      };
      if (command.terminal?.name === undefined) command.terminal.name = null;
      if (command.terminal?.clear === undefined) command.terminal.clear = true;
      if (command.terminal?.cwd === undefined) command.terminal.cwd = null;
      if (command.terminal?.focus === undefined) command.terminal.focus = false;
      if (command.terminal?.singleInstance === undefined) command.terminal.singleInstance = true;
      if (command.tooltip === undefined) command.tooltip = null;
      if (command.useVsCodeApi === undefined) command.useVsCodeApi = false;
      if (command.args === undefined) command.args = [];
    });

    return commands;
  }

  /**
   * @returns An action button that opens a quick-select of specified commands.
   */
  static dropdowns(): Array<DropdownButton> {
    let dropdowns = [];

    if (Configuration.useConfigurationFile()) {
      const configuration = Configuration.configurationFileJSON();
      dropdowns = configuration?.dropdowns ? configuration.dropdowns : [];
    }

    const userDropdowns = vscode.workspace
      .getConfiguration(Configuration.extensionName)
      .get<DropdownButton[]>("dropdowns");

    dropdowns = [...dropdowns, ...userDropdowns];

    dropdowns.forEach((dropdown) => {
      // Set defaults for the undefined properties.
      if (dropdown.alignment === undefined) dropdown.alignment = vscode.StatusBarAlignment.Left;
      if (dropdown.color === undefined) dropdown.color = Configuration.defaultColor();
      if (dropdown.priority === undefined) dropdown.priority = 0;
      if (dropdown.tooltip === undefined) dropdown.tooltip = null;
      if (dropdown.options === undefined) dropdown.options = {
        ignoreFocusOut: false,
        placeholder: null,
        title: null
      };
      if (dropdown.options?.ignoreFocusOut === undefined) dropdown.options.ignoreFocusOut = false;
      if (dropdown.options?.placeholder === undefined) dropdown.options.placeholder = null;
      if (dropdown.showButton === undefined) dropdown.showButton = true;
      if (dropdown.options?.title === undefined) dropdown.options.title = null;
    });

    return dropdowns;
  }

  /**
   * @returns The variables for a terminal
   */
  static variables(command: CommandButton): Variables {
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;

    const vars: Variables = {
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
      cwd: command.terminal.cwd || rootPath || homedir(),

      // - the current selected line number in the active file
      lineNumber: (vscode.window.activeTextEditor) ? vscode.window.activeTextEditor.selection.active.line + 1 : null,

      // - the current selected text in the active file
      selectedText: (vscode.window.activeTextEditor) ? vscode.window.activeTextEditor.document.getText(vscode.window.activeTextEditor.selection) : null,

      // - the path to the running VS Code executable
      execPath: process.execPath
    };

    return vars;
  }
}
