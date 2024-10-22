#!/usr/bin/env -S deno run -A --lock=tools/deno.lock.json

import { walk } from "jsr:@std/fs/walk";
import { createTypeImports } from "./create-type-imports.ts";

/**
 * Replacing the following references (without the _):
 * /_* <module> *_/
 * /_* </module> *_/
 */
const data = await createTypeImports("uix", "./src/");
const regex = /^\/\* \<module\>[*\S\s]*\<\/module\>.*$/gm;

async function replaceImports() {
	for await (const dirEntry of walk(".", { exts: ["ts"]})) {
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

if (await replaceImports()) {
	console.info("Replaced modules")
} else console.error("Could not find module reference. Skipping");