// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as path from 'path';
import * as vscode from 'vscode';
import { setupSnobotSimFiles } from './shared/add_config';
import { exists, readFile } from './shared/file_utils';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

    const setupSnobotDisposable = vscode.commands.registerCommand('snobotsim.setupProject', async () => {

        await displayConfigureSnobotSim(context, vscode.ViewColumn.Active, true, {
            enableScripts: true,
            retainContextWhenHidden: true,
          });
    });
    context.subscriptions.push(setupSnobotDisposable);

    const updateSnobotSimDisposable = vscode.commands.registerCommand('snobotsim.updateSnobotSim', async () => {

        if (vscode.workspace.workspaceFolders === undefined) {
            vscode.window.showErrorMessage('SnobotSim extension is too dumb to handle undefined workspaces');
            return;
        }
        const projectFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
        await gradleRun('updateSnobotSimConfig', projectFolder, vscode.workspace.workspaceFolders[0], 'Update Snobot Sim');

        vscode.window.showInformationMessage('Updating SnobotSim');
    });
    context.subscriptions.push(updateSnobotSimDisposable);

    const runJavaSnobotSimDisposable = vscode.commands.registerCommand('snobotsim.runJavaSnobotSim', async () => {

        if (vscode.workspace.workspaceFolders === undefined) {
            vscode.window.showErrorMessage('SnobotSim extension is too dumb to handle undefined workspaces');
            return;
        }
        const projectFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
        await gradleRun('runJavaSnobotSim', projectFolder, vscode.workspace.workspaceFolders[0], 'Run Java Snobot Sim');

        vscode.window.showInformationMessage('Starting SnobotSim');
    });
    context.subscriptions.push(runJavaSnobotSimDisposable);
}

export async function gradleRun(args: string,
                                rootDir: string,
                                workspace: vscode.WorkspaceFolder,
                                name: string) {

    const command = './gradlew ' + args;
    await executeCommand(command, name, rootDir, workspace);
}

function getIsWindows(): boolean {
    const nodePlatform: NodeJS.Platform = process.platform;
    return nodePlatform === 'win32';
  }

async function executeCommand(command: string,
                              name: string,
                              rootDir: string,
                              workspace: vscode.WorkspaceFolder) {
    const shell = new vscode.ShellExecution(command, {
        cwd: rootDir,
    });

    if (getIsWindows()) {
        if (command.startsWith('./')) {
            command = command.substring(2);
        }
        shell.commandLine = command;
        if (shell.options !== undefined) {
            shell.options.executable = 'cmd.exe';
            shell.options.shellArgs = ['/d', '/c'];
        }
    }

    const task = new vscode.Task({ type: 'wpilibgradle' }, workspace, name, 'wpilib', shell);
    task.presentationOptions.echo = true;
    await vscode.tasks.executeTask(task);
}

async function displayConfigureSnobotSim(context: vscode.ExtensionContext, showOptions: vscode.ViewColumn | { preserveFocus: boolean, viewColumn: vscode.ViewColumn }, reveal?: boolean, options?: vscode.WebviewPanelOptions & vscode.WebviewOptions) {

    const webview = vscode.window.createWebviewPanel('View Type', 'Configure SnobotSim', showOptions, options);
    webview.webview.html = await getWebviewContent(context);

    webview.webview.onDidReceiveMessage(async (data: any) => {

        if (data.type === 'createproject') {
            const addCustomSimulator = false;
            const useVsCode = data.data.use_vscode;
            const useEclipse = data.data.use_eclipse;
            const useIntellij = data.data.use_intellij;
            const basepath = context.extensionPath;
            if (vscode.workspace.workspaceFolders === undefined) {
                return;
            }
            const projectFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;

            vscode.window.showInformationMessage('Adding SnobotSim config to ' + projectFolder);

            const toFolder = path.join(projectFolder, 'snobotsim');
            if (!await exists(toFolder)) {
                const wpilibJsonPath = path.join(projectFolder, '.wpilib', 'wpilib_preferences.json');
                if (!await exists(wpilibJsonPath)) {
                  vscode.window.showErrorMessage('This isnt a WPILib project');
                  return;
                }

                // Read the wpilib settings to figure out the project type
                const wpilibConfig = JSON.parse(await readFile(wpilibJsonPath));
                await setupSnobotSimFiles(wpilibConfig, addCustomSimulator, useVsCode, useEclipse, useIntellij, basepath, projectFolder, toFolder);
                vscode.window.showInformationMessage('Added SnobotSim configuration!');
            } else {
                vscode.window.showWarningMessage('SnobotSim is already configured, any updates have to be made manually');
            }
        } else {
            vscode.window.showWarningMessage('Unknown option ' + data.type + ' - ' + typeof(data.type));
        }
    });

    if (reveal) {
        webview.reveal();
    }
}

async function getWebviewContent(context: vscode.ExtensionContext) {
    let html = await readFile(path.join(context.extensionPath, 'resources', 'index.html'));

    const scriptOnDisk = vscode.Uri.file(path.join(context.extensionPath, 'resources', 'dist', 'snobotSimUpdaterPage.js'));
    const scriptResourcePath = scriptOnDisk.with({ scheme: 'vscode-resource' });
    html += '\r\n<script src="';
    html += scriptResourcePath.toString();
    html += '">\r\n';
    html += '\r\n</script>\r\n';
    console.log(html);

    return html;
}

// this method is called when your extension is deactivated
// tslint:disable-next-line
export function deactivate() {}
