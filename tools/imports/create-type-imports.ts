import { walk } from "jsr:@std/fs/walk";
import * as path from "jsr:@std/path";

export async function createTypeImports(specifier = "uix", base = './src/') {
	let imports = `// deno-lint-ignore-file no-unused-vars\n// This part is auto generated to allow Deno to resolve the ${specifier}-modules`;
	const originalPath = path.resolve(base);
	let index=0;
	for await (const dirEntry of walk(originalPath, { exts: ["ts"]})) {
		const currentPath = `${specifier}/${path.relative(originalPath, dirEntry.path)}`;
		imports += `\nimport type * as _${specifier}_${index} from "${currentPath}";`;
		index++;
	}
	return imports;
}