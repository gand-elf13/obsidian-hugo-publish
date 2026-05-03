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

## Features
This plugin will convert the `.md` file and related images in obsidian to the hugo site dir.

Conversion includes:
- `[[link.com]]` -> `[link.com](link.com)`
- `[[link.com|alias-text]]` -> `[alias-text](link.com)`
- `![[xxx.png]]` -> `![xxx.png](/${static_dir}/xx.png)`
- `![[xxx.png|200*100]]` -> `![xxx.png](/${static_dir}/xx.png)`
- Auto write md's yaml header like: title,date,lastmod

## How to use

1. Complete the plugin settings: `blog_tag`,`hugo_site`...
2. Set `tags` in obsidian's md as `${blog_tag}`
3. Click `hugo sync` button or run cmd `Hugo Publish: Sync blog`
4. Enter the hugo site dir to run `hugo server` to check it
