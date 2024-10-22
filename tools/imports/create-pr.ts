#!/usr/bin/env -S deno run -A --lock=tools/deno.lock.json
import { walk } from "jsr:@std/fs/walk";
import * as path from "jsr:@std/path";

const data = await createTypeImports("uix", "./src/");
const regex = /^\/\* \<module\>[*\S\s]*\<\/module\>.*$/gm;

console.log(Deno.args)

/**
 * Replacing the following references (without the _):
 * /_* <module> *_/
 * /_* </module> *_/
 */
export async function createTypeImports(specifier: string, base = '.') {
	let imports = `// deno-lint-ignore-file no-unused-vars\n// This part is auto generated to allow Deno to resolve the ${specifier}-modules`;
	const originalPath = path.resolve(base);
	let index=0;
	for await (const dirEntry of walk(originalPath, { exts: ["ts"]})) {
		const currentPath = `${specifier}/${path.relative(originalPath, dirEntry.path)}`;
		imports += `\nimport type * as _${specifier}_${index} from "${currentPath}";`;
		index++;
	}
	console.info(`Found ${index} modules`);
	return imports;
}

async function replaceImports() {
	for await (const dirEntry of walk('.', { exts: ["ts"]})) {
		const path = dirEntry.path;
		const content = Deno.readTextFileSync(path);
		if (content.match(regex)) {
			Deno.writeTextFileSync(path, content.replace(regex, `/* <module> */\n${data}\n/* </module> */`));
			console.info(`Replaced module tags in ${path}`);
			return true;
		}
	}
	return false;
}

function runGitHubCommand(...args: string[]) {
	return new Deno.Command('git', { args: args, cwd: "." }).outputSync().success;
}
const branchName = "dependency-bump";

if (await replaceImports()) {
	console.info("Replaced modules");
	runGitHubCommand("checkout", "-b", branchName);
	runGitHubCommand("add", ".");
	runGitHubCommand("commit", "-m", "Updating module imports");
	runGitHubCommand("push", "origin", branchName);
} else console.error("Could not find module reference. Skipping");