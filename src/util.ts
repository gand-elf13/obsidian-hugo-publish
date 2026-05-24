import { App, TFile } from "obsidian";
import { ensureDir, copy, outputFile, emptyDir, readdir, stat, rmdir, remove } from "fs-extra";
import * as path from 'path';
import { Text, Image, Root, Link, Parent } from 'mdast';
import { visit } from 'unist-util-visit'


// Get all blog post filted by tag
export const get_all_blog_md = async (app: App, tag: string) => {
    const files = app.vault.getMarkdownFiles();
    const blogs: TFile[] = [];
    for (let i = 0; i < files.length; i++) {
        const meta = app.metadataCache.getFileCache(files[i]);
        const tags: string[] = meta?.frontmatter?.tags;
        if (tag.length == 0 || tags?.contains(tag)) {
            blogs.push(files[i])
        }
    }
    return blogs;
}

export const copy_file = async (src: string, dst: string) => {
    await ensureDir(path.dirname(dst));
    await copy(src, dst);
}

export const write_md = async (file_path: string, header: string, body: string) => {
    await outputFile(file_path, "---\n" + header + "---\n" + body);
}

export const delete_files_in_dir = async (dir: string) => {
    await ensureDir(dir);
    await emptyDir(dir);
}

export const delete_files_in_dir_with_keep_list = async (dir: string, keep_list: RegExp[]) => {
    await ensureDir(dir);
    const files = await readdir(dir);
    for (const file of files) {
        const file_path = `${dir}/${file}`;
        const file_stat = await stat(file_path);
        if (file_stat.isDirectory()) {
            await delete_files_in_dir_with_keep_list(file_path, keep_list);
            const sub_files = await readdir(file_path);
            if (sub_files.length === 0) {
                await rmdir(file_path);
            }
        } else {
            let match = false;
            for (const reg of keep_list) {
                if (reg.test(file)) {
                    match = true;
                    break;
                }
            }
            if (!match) {
                await remove(file_path);
            }
        }
    }
}

// parse md content, return yaml header and left content without header
export const get_md_yaml_header_from_content = (content: string): [string, string] => {
    const lines = content.split('\n');
    if (lines.length == 0) {
        return ["", content];
    }
    // the first line must be '---' if there is a header
    if (lines[0].trim() !== '---') {
        return ["", content];
    }

    let i = 0;
    let st = -1;
    let ed = -1;
    for (; i < lines.length - 1; i++) {
        const row = lines[i];
        if (row.trim() === '---') {
            if (st < 0) {
                st = i;
            } else {
                ed = i;
                break;
            }
        }
    }
    // has hader
    if (ed > st) {
        let header = "";
        let body = "";
        for (let i = st + 1; i < ed; i++) {
            header += lines[i];
            header += '\n';
        }
        for (let i = ed + 1; i < lines.length; i++) {
            body += lines[i];
            body += "\n";
        }
        return [header, body]
    } else {
        // no header
        return ["", content]
    }
}

export const transform_better_latex = (ast: Root) => {
    visit(ast, 'math', function (node, index, parent) {
        // https://www.gohugo.org/doc/tutorials/mathjax_en/
        // just put LaTeX code in between <div>$$TeX Code$$</div>
        const new_value = '<div>\n$$\n' + node.value + '\n$$\n</div>';
        node.value = new_value;
        (node as { type: string }).type = 'html'; // force cast
    })
}

// ![[xxx.png]] -> ![xxx.png](xxx.png)
// ![[xxx.png|400]] -> {{< figure src="..." width="400" >}}
// ![[xxx.png|640x480]] -> {{< figure src="..." width="640" height="480" >}}
export const transform_wiki_image = (ast: Root) => {
    visit(ast, 'paragraph', function (node, index, parent) {
        transform_wiki_image_on_parent(node);
    })
    visit(ast, "tableCell", function (node, index, parent) {
        transform_wiki_image_on_parent(node);
    })
}


// [[xxx.png]] -> [xxx.png](xxx.png)
export const transform_wiki_link = (ast: Root) => {
    visit(ast, 'paragraph', function (node, index, parent) {
        transform_wiki_link_on_parent(node);
    })
    visit(ast, 'tableCell', function (node, index, parent) {
        transform_wiki_link_on_parent(node);
    })
}

const transform_wiki_image_on_parent = (node: Parent) => {
    const new_children = [];
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.type === "strong" || child.type === "emphasis") {
            // Recurse so that **![[img]]** and *![[img]]* are handled
            transform_wiki_image_on_parent(child as Parent);
            new_children.push(child);
        } else if (child.type == "text") {
            const text = child.value.slice(); // clone
            const regex = /!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
            let match;
            let last_index = 0;
            let after_text = text.slice();
            while ((match = regex.exec(text)) != null) {
                const link_text = match[1];
                const size_hint = match[2]; // e.g. "468" or "640x480"
                const image_url = link_text;

                const before_text = text.slice(last_index, match.index);
                after_text = text.slice(match.index + match[0].length);

                if (before_text.length > 0) {
                    const v: Text = { type: "text", value: before_text };
                    new_children.push(v);
                }

                if (size_hint && /^\d+(x\d+)?$/.test(size_hint.trim())) {
                    // Has a numeric dimension hint — use hugoFigure flag so the
                    // image visitor in main.ts can emit a figure shortcode after
                    // resolving the final URL. Store width/height in the node.
                    const parts = size_hint.trim().split('x');
                    const v: any = {
                        type: 'image',
                        url: encodeURI(image_url),
                        alt: image_url,
                        title: null,
                        hugoFigure: true,
                        figureWidth: parts[0],
                        figureHeight: parts[1] ?? null,
                    };
                    new_children.push(v);
                } else {
                    const v: Image = {
                        type: 'image',
                        url: encodeURI(image_url),
                        alt: image_url,
                        title: null
                    };
                    new_children.push(v);
                }
                last_index = match.index + match[0].length;
            }
            if (after_text.length > 0) {
                const v: Text = { type: "text", value: after_text };
                new_children.push(v);
            }
        } else {
            new_children.push(child);
        }
    }
    node.children = new_children;
}

export const resolvePermalink = (pattern: string, resolvedPath: string, targetHv: any): string => {
    if (!pattern) pattern = ":sections/:contentbasename";
    if (!/:[a-zA-Z]/.test(pattern)) return resolvedPath;

    const parts = resolvedPath.split('/');
    const contentbasename = parts[parts.length - 1] || '';
    const title = targetHv?.title || contentbasename;
    const slug = targetHv?.slug || title;
    const slugorcontentbasename = targetHv?.slug || contentbasename;
    const section = parts.length > 1 ? parts[0] : '';
    const sections = parts.slice(0, parts.length - 1).join('/');

    let result = pattern;

    const tokenValues: Record<string, string> = {
        ':slug': slug,
        ':title': title,
        ':section': section,
        ':sections': sections,
        ':filename': contentbasename,
        ':contentbasename': contentbasename,
        ':slugorcontentbasename': slugorcontentbasename,
    };

    const rawDate = targetHv?.date;
    if (rawDate) {
        let date: Date | null = null;
        if (rawDate instanceof Date) {
            date = rawDate;
        } else {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) date = d;
        }
        if (date) {
            const pad = (n: number) => String(n).padStart(2, '0');
            tokenValues[':year'] = String(date.getFullYear());
            tokenValues[':month'] = pad(date.getMonth() + 1);
            tokenValues[':monthname'] = date.toLocaleString('en-US', { month: 'long' });
            tokenValues[':day'] = pad(date.getDate());
            tokenValues[':weekday'] = String(date.getDay());
            tokenValues[':weekdayname'] = date.toLocaleString('en-US', { weekday: 'long' });
            const startOfYear = new Date(date.getFullYear(), 0, 0);
            const diff = date.getTime() - startOfYear.getTime();
            tokenValues[':yearday'] = String(Math.ceil(diff / 86400000));
        }
    }

    // Sort tokens by length descending so longer tokens match before shorter ones
    // e.g. :sections before :section, :monthname before :month
    const sortedTokens = Object.keys(tokenValues).sort((a, b) => b.length - a.length);
    for (const token of sortedTokens) {
        result = result.split(token).join(tokenValues[token]);
    }

    result = result.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');

    return result || resolvedPath;
}

const transform_wiki_link_on_parent = (node: Parent) => {
    const new_children = [];
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.type === "strong" || child.type === "emphasis") {
            // Recurse so that **[[link]]** and *[[link]]* are handled
            transform_wiki_link_on_parent(child as Parent);
            new_children.push(child);
        } else if (child.type == "text") {
            const text = child.value.slice(); // clone
            const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
            let match;
            let last_index = 0;
            let after_text = text.slice();
            while ((match = regex.exec(text)) != null) {
                const link_text = match[1];
                const alias = match[2];
                const image_url = link_text;

                const before_text = text.slice(last_index, match.index);
                after_text = text.slice(match.index + match[0].length);

                if (before_text.length > 0) {
                    const v: Text = { type: "text", value: before_text };
                    new_children.push(v);
                }
                const link_txt: Text = {
                    type: "text",
                    value: alias || link_text
                };
                const v: Link = {
                    type: 'link',
                    url: encodeURI(image_url),
                    title: null,
                    children: [link_txt]
                };
                new_children.push(v);
                last_index = match.index + match[0].length;

            }
            if (after_text.length > 0) {
                const v: Text = { type: "text", value: after_text };
                new_children.push(v);
            }
        } else {
            new_children.push(child);
        }
    }
    node.children = new_children;
}
