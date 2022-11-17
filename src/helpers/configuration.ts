import * as fs from "fs";
import * as glob from "glob";
import { homedir } from "os";
import * as path from "path";
import * as vscode from "vscode";

import CustomCommand from "../commands/types/command";
import DropdownButton from "../commands/types/dropdown";
import Variables from "../commands/types/variables";
import Utilities from "./utilities";

export default class Configuration {
  static extensionName = "customCommands";

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
        const path = event.uri.fsPath.replace(/\\/g, "/").toLowerCase();
        if (path === Configuration.configurationFilePath()?.toLowerCase()) {
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
    return Configuration.configurationFile() ? false : true;
  }

  /**
   * @returns Determines whether or not to use the configuration file.
   */
  static configurationFile(): string {
    return vscode.workspace
      .getConfiguration(Configuration.extensionName)
      .get("configurationFile", "");
  }


  /**
   * @returns The path to the configuration file.
   */
  static configurationFilePath(): string | undefined {
    const configurationFile = Configuration.configurationFile();
    // TODO: Add more options
    const fileTypes = "json, jsonc";
    let pattern = `{**/{c,C}ommands.{${fileTypes}},`;
    pattern += `**/{c,C}ustom{c,C}ommands.{${fileTypes}},`;
    pattern += `.vscode/{c,C}ommands.{${fileTypes}}},`;
    pattern += `.vscode/{c,C}ustom{c,C}ommands.{${fileTypes}}}`;

    if (configurationFile.toLowerCase() === "find") {
      let folder = "";
      let files: string[] = [];
      vscode.workspace.workspaceFolders?.forEach(workspaceFolder => {
        if (files[0] !== undefined) return;

        folder = workspaceFolder.uri.fsPath.replace(/\\/g, "/");
        files = glob.sync(pattern, { cwd: folder });
      });

      if (files[0] === undefined) return undefined;
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
    if (!Configuration.useConfigurationFile() || !path) return null;
    if (!fs.existsSync(path)) return null;

    let fileData = fs.readFileSync(path).toString();
    // Strip the comments.
    fileData = fileData.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m);
    // Remove the default name of customCommands.
    fileData = fileData.replace(/customCommands\./g, "");
    try {
      return JSON.parse(fileData);
    } catch (error) {
      console.log("Error parsing configuration file.");
      return null;
    }
  }

  /**
   * @returns The color to use for status bar button text. The default is the theme color.
   */
  static defaultColor(): string {
    if (Configuration.useConfigurationFile()) {
      const configuration = Configuration.configurationFileJSON();
      const defaultColor = configuration?.defaultColor;
      if (defaultColor !== undefined) defaultColor;
    }

    return vscode.workspace
      .getConfiguration(Configuration.extensionName)
      .get<string>("defaultColor", `${Configuration.extensionName}.foreground`);
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
      .get<string | null>("reloadButton", null);
  }

  /**
   * @returns The text for the reload button. The default is to reload on configuration change and not show a reload button.
   */
  static showReloadButton(): boolean {
    return Configuration.reloadButton() !== null;
  }

  /**
   * @returns A list of status bar buttons for specified commands.
   */
  static commands(): CustomCommand[] {
    let commands = [];

    if (Configuration.useConfigurationFile()) {
      const configuration = Configuration.configurationFileJSON();
      commands = configuration?.commands ? configuration.commands : [];
    }

    const userCommands = vscode.workspace
      .getConfiguration(Configuration.extensionName)
      .get<CustomCommand[]>("commands", []);

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
   * @returns A status bar button that opens a quick-select of specified commands.
   */
  static dropdowns(): DropdownButton[] {
    let dropdowns = [];

    if (Configuration.useConfigurationFile()) {
      const configuration = Configuration.configurationFileJSON();
      dropdowns = configuration?.dropdowns ? configuration.dropdowns : [];
    }

    const userDropdowns = vscode.workspace
      .getConfiguration(Configuration.extensionName)
      .get<DropdownButton[]>("dropdowns", []);

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
  static variables(command: CustomCommand): Variables {
    const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    const rootPath = workspaceFolder ? Utilities.normalizePath(workspaceFolder) : undefined;

    const editor = vscode.window.activeTextEditor;
    const fileName = editor ? Utilities.normalizePath(editor.document.fileName) : undefined;

    const vars: Variables = {
      // - the path of the folder opened in VS Code
      workspaceFolder: rootPath,

      // - the last portion of the path of the folder opened in VS Code
      workspaceFolderBasename: rootPath ? path.basename(rootPath) : undefined,

      // - the current opened file
      file: fileName,

      // - the current opened file relative to workspaceFolder
      relativeFile: (vscode.window.activeTextEditor && rootPath && fileName) ? Utilities.normalizePath(path.relative(
        rootPath,
        fileName
      )) : undefined,

      // - the last portion of the path to the file
      fileBasename: fileName ? path.basename(fileName) : undefined,

      // - the last portion of the path to the file with no file extension
      fileBasenameNoExtension: fileName ? path.parse(path.basename(fileName)).name : undefined,

      // - the current opened file's dirname
      fileDirname: fileName ? path.dirname(fileName) : undefined,

      // - the current opened file's extension
      fileExtname: fileName ? path.parse(path.basename(fileName)).ext : undefined,

      // - the task runner's current working directory on startup
      cwd: command.terminal?.workingDirectory || rootPath || homedir(),

      // - the current selected line number in the active file
      lineNumber: editor ? (editor.selection.active.line + 1) : undefined,

      // - the current selected text in the active file
      selectedText: editor ? editor.document.getText(editor.selection) : undefined,

      // - the path to the running VS Code executable
      execPath: process.execPath
    };

    return vars;
  }
}
