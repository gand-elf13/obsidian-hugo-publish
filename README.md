# Hugo Publish

This plugin helps you publish hugo blog through obsidian.

## This is a fork.

you can find the original plugin here : https://github.com/kirito41dd/obsidian-hugo-publish.git

I add functionalities that i need while trying to keep to plugin as general as possible.

Currently added features :

- obsidian image resizing syntax support
- "basic" wikilink management
	You can prepend an arbitrary path, and enable rendering of the path based on the obsidian file structure
- Capture images in the yaml header
	the preoperty "image" will be changed to match the path of the corresponding image, and that image is exported. this uses the same methods as the already present wikilink image exports
- Capture images in html
	if there are html image insert they get exported too following the same principle

I gotta add toggle for some of theese since they are breaking chanes

## My setup

The plugin is currently optimised for having obsidian managing the whole content folder, post folder and other are created in obsidian.
if the url setting are simple enough (Eg : no dates), wikilinks should work, picture too.

Finally the latest changes where made to handle chronicler vaults as much as possible, with the latest version, i can fully export correctly a chronicler vault present inside my obsdian vault.

See https://codeberg.org/gand_elf/neocities-gandelf-place.git for my implementation

## To-Do

- [ ] settings for renaming properties in certain folder,
	this is needed in order to differentiate tags or categories in different Types of the website.

- [ ] merging the Page bundle Fork https://github.com/natarajmb/obsidian-hugo-publish.git, it seems like a real improvement

## Hugo Config Compatibility

Settings that map 1:1 to Hugo configuration options:

| Plugin setting | Hugo config | Type | Default | Status |
|---|---|---|---|---|
| `disable_path_to_lower` | `disablePathToLower` | bool | `false` | ✅ |
| `ugly_urls` | `uglyURLs` | bool | `false` | ✅ |
| `remove_path_accents` | `removePathAccents` | bool | `false` | ✅ |
| `permalink_pattern` | `[permalinks]` (pattern) | string | `:sections/:contentbasename` | ✅ |

Not covered (handled by Hugo at build time — out of plugin scope):

| Hugo config | Reason |
|---|---|
| `buildDrafts` | Hugo skips drafts during build |
| `buildExpired` | Hugo handles date-based exclusion |
| `buildFuture` | Hugo handles date-based exclusion |
| `canonifyURLs` | Deprecated, Hugo post-processing |
| `relativeURLs` | Niche serverless use case |

## URL Token Support

Tokens available in `permalink_pattern`:

| Token | Supported | Notes |
|---|---|---|
| `:slug` | ✅ | From frontmatter `slug`, else `:title` |
| `:title` | ✅ | From frontmatter `title`, else filename |
| `:section` | ✅ | First directory of the path |
| `:sections` | ✅ | Full directory hierarchy |
| `:contentbasename` | ✅ | Filename without extension |
| `:slugorcontentbasename` | ✅ | Frontmatter `slug`, else `:contentbasename` |
| `:filename` | ✅ | Same as `:contentbasename` (deprecated in Hugo) |
| `:year` | ✅ | From frontmatter `date` |
| `:month` | ✅ | 2-digit |
| `:monthname` | ✅ | Full month name |
| `:day` | ✅ | 2-digit |
| `:weekday` | ✅ | 0=Sunday |
| `:weekdayname` | ✅ | Full weekday name |
| `:yearday` | ✅ | 1- to 3-digit day of year |
| `:sectionslug` | ❌ | Hugo v0.149.0+ |
| `:sectionslugs` | ❌ | Hugo v0.149.0+ |
| `:sections[N]` slice | ❌ | `:sections[1:]`, `:sections[:last]`, etc. |
| Go time layouts | ❌ | `/:06/:1/:2/:title/` syntax |

## URL Path Sanitization

All markdown link paths go through this pipeline in order:

1. Spaces → hyphens (always)
2. Strip `(),.` (always)
3. Lowercase (unless `disable_path_to_lower`)
4. NFD accent removal (if `remove_path_accents`)
5. Append `.html` (if `ugly_urls`)

## Front Matter Handling

| Front matter field | Plugin behavior |
|---|---|
| `slug` | Overrides last path segment in resolved URLs |
| `url` | Full path override, bypasses all transforms |
| `title` | Auto-injected if missing (from filename) |
| `date` | Auto-injected if missing (from file ctime) when `inject_dates` is enabled |
| `lastmod` | Auto-injected if missing (from file mtime) when `inject_dates` is enabled |
| `draft` | Passed through, handled by Hugo at build time |
| `image` | Copied to static dir and path rewritten when `export_media` is enabled |
| `aliases` | Passed through for Hugo to process during build |
| `tags` | Blog tag filtered out when `export_blog_tag` is disabled |

## Features

This plugin will convert the `.md` file and related images in obsidian to the hugo site dir.

Conversion includes:
- `[[link.com]]` -> `[link.com](link.com)`
- `[[link.com|alias-text]]` -> `[alias-text](link.com)`
- `![[xxx.png]]` -> `![xxx.png](/${static_dir}/xx.png)`
- `![[xxx.png|200*100]]` -> `![xxx.png](/${static_dir}/xx.png)`
- Auto write md's yaml header like: title,date,lastmod

## How to use

1. Complete the plugin settings: `site_dir`, `blog_dir`, etc.
2. Optionally set `blog_tag` to only sync notes with a specific tag.
3. Click the `hugo sync` ribbon icon or run the command.
4. Enter the Hugo site directory and run `hugo server`.
