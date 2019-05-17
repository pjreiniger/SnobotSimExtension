// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as path from 'path';
import * as vscode from 'vscode';
import { readFile } from './shared/file_utils';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('snobotsim.setupProject', async () => {

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
        
        const panel = vscode.window.createWebviewPanel('x', 'y', vscode.ViewColumn.One, {}) 
        {

        }
        // And set its HTML content
        try {
            panel.webview.html = await getWebviewContent(context);
        }
        catch(err) {
            
        }
    });
    context.subscriptions.push(disposable);
}


async function getWebviewContent(context: vscode.ExtensionContext) {
    let html = await readFile(path.join(context.extensionPath, 'resources', 'index.html'));
    
    const scriptOnDisk = vscode.Uri.file(path.join(context.extensionPath, 'resources', 'dist', 'snobotSimUpdator.js'));
    const scriptResourcePath = scriptOnDisk.with({ scheme: 'vscode-resource' });
    html += '\r\n<script src="';
    html += scriptResourcePath.toString();
    html += '">\r\n';
    html += '\r\n</script>\r\n';

    return html
}

// this method is called when your extension is deactivated
export function deactivate() {}
