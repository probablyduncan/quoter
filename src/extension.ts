import * as vscode from 'vscode';
// import path from 'path';

// called the very first time a command is executed
export function activate(context: vscode.ExtensionContext) {

    // matches command in package.json
    const disposable = vscode.commands.registerCommand('quoter.formatQuotes', async () => {
        
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor");
            return;
        }

        const document = editor.document;
        // const ext = path.parse(document.fileName).ext;
        const edits: { range: vscode.Range; replacement: string }[] = [];

        let selection = editor.selection;
        if (selection.isEmpty) {

            let start = new vscode.Position(0, 0);
            const docText = document.getText();
            const fmMatch = docText.match(/^---[\s\S]*?---\r?\n/);
            if (fmMatch && docText.startsWith('---')) {
                start = document.positionAt(fmMatch[0].length);
            }

            const end = document.validatePosition(new vscode.Position(99999999999, 9999999999));
            selection = new vscode.Selection(start, end);
        }

        // if (!edits.length) {
        //     vscode.window.showInformationMessage(`No quotes to format in ${selection.isEmpty ? "document" : "selection"}`);
        //     return;
        // }

        await editor.edit(e => {

            for (let l = selection.start.line; l <= selection.end.line; l++) {
                const lineSelection = new vscode.Selection(document.validatePosition(new vscode.Position(l, l === selection.start.line ? selection.start.character : 0)), document.validatePosition(new vscode.Position(l, l === selection.end.line ? selection.end.character : 99999999999)));

                const text = document.getText(lineSelection);
                const replacement = formatLine(lineSelection, text);
                e.replace(lineSelection, replacement);
            }
        });
    });

    context.subscriptions.push(disposable);
}

// called when extension is deactivated
export function deactivate() { }

function formatLine(selection: vscode.Selection, text: string) {

    if (!selection.isSingleLine) {
        return text;
    }

    for (let i = selection.start.character; i < selection.end.character; i++) {
        const char = text[i] as keyof typeof replacements;
        if (!(char in replacements)) {
            continue;
        }

        let dir: keyof typeof replacements[typeof char] = "left";

        if (i === text.length - 1 || text[i + 1] === " ") {
            dir = "right";
        }

        text = text.replace(char, replacements[char][dir]);
    }

    return text;
}

const replacements = {
    "'": {
        left: "‘",
        right: "’"
    },
    '"': {
        left: "“",
        right: "”",
    }
} as const;