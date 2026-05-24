import { App, PluginSettingTab, Setting } from "obsidian";
import HugoPublishPlugin from "./main";
import * as path from 'path';


export interface HugoPublishSettings {
    blog_tag: string;
    export_blog_tag: boolean;
    exclude_dir: string; // relative path to vault_dir
    site_dir: string; // absolute path
    blog_dir: string; // relative path to site_dir
    static_dir: string; // relative path to site_dir/static
    keep_list: string;
    slugify_paths: boolean;
    permalink_pattern: string;
    export_media: boolean;
    convert_wikilinks: boolean;
    render_math: boolean;
    inject_dates: boolean;
    get_exclude_dir: () => string[];
    get_blog_abs_dir: () => string;
    get_static_abs_dir: () => string;
    get_blog_keep_list: () => RegExp[];
}

export const DEFAULT_SETTINGS: HugoPublishSettings = {
    blog_tag: "blog",
    exclude_dir: "",
    blog_dir: "",
    static_dir: "ob",
    site_dir: "",
    keep_list: "",
    get_exclude_dir(): string[] {
        if (this.exclude_dir === "") {
            return [];
        }
        return this.exclude_dir.split(',');
    },
    get_blog_abs_dir(): string {
        return path.join(this.site_dir, this.blog_dir);
    },
    get_static_abs_dir(): string {
        return path.join(this.site_dir, "static", this.static_dir);
    },
    get_blog_keep_list(): RegExp[] {
        const strs: string[] = this.keep_list.split(",");
        const regs = Array(0);
        for (const s of strs) {
            if (s.length > 0) {
                regs.push(RegExp(s));
            }
        }
        return regs;
    },
    export_blog_tag: true,
    slugify_paths: false,
    permalink_pattern: "",
    export_media: true,
    convert_wikilinks: true,
    render_math: true,
    inject_dates: true
}

export class HugoPublishSettingTab extends PluginSettingTab {
    plugin: HugoPublishPlugin;

    constructor(app: App, plugin: HugoPublishPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Hugo Location' });

        new Setting(containerEl).setName("site dir").setDesc("Hugo site root dir, absolute path")
            .addText(text => text.setPlaceholder("/path/to/hugo/site").setValue(this.plugin.settings.site_dir).onChange(async (value) => {
                this.plugin.settings.site_dir = value;
                await this.plugin.saveSettings();
            }));
        new Setting(containerEl).setName("blog dir").setDesc("All blog copy to this dir, relative path to site, note that content will be deleted first when syncing")
            .addText(text => text.setPlaceholder("blog/dir").setValue(this.plugin.settings.blog_dir).onChange(async (value) => {
                this.plugin.settings.blog_dir = value;
                await this.plugin.saveSettings();
            }));
        new Setting(containerEl).setName("static dir").setDesc("All static(like images) copy to static/${static dir}, like static/ob, relative path to site/static. Can be empty, note that content will be deleted first when syncing")
            .addText(text => text.setPlaceholder("./").setValue(this.plugin.settings.static_dir).onChange(async (value) => {
                this.plugin.settings.static_dir = value;
                await this.plugin.saveSettings();
            }));

        containerEl.createEl('h2', { text: 'Content Selection' });

        new Setting(containerEl)
            .setName('blog tag')
            .setDesc('All articles with this tag are treated as blogs, if empty process all articles')
            .addText(text => text
                .setPlaceholder('Enter your secret')
                .setValue(this.plugin.settings.blog_tag)
                .onChange(async (value) => {
                    this.plugin.settings.blog_tag = value;
                    await this.plugin.saveSettings();
                }));
        new Setting(containerEl).setName("exclude dir").setDesc('Exclude dir when syncing, relative path to vault, split by ","')
            .addText(text => text.setPlaceholder("templates,dir2,tmp/dir3").setValue(this.plugin.settings.exclude_dir).onChange(async (value) => {
                this.plugin.settings.exclude_dir = value;
                await this.plugin.saveSettings();
            }))
        new Setting(containerEl).setName("blog dir keep list").setDesc('Optional, do not delete matching files, use js regexp and split by ",". e.g. .*\\.html,.*\\.toml')
            .addText(text => text.setValue(this.plugin.settings.keep_list).onChange(async (value) => {
                this.plugin.settings.keep_list = value;
                await this.plugin.saveSettings();
            }));
        new Setting(containerEl).setName("export blog tag").setDesc("Export ${blog tag} to hugo md file's header")
            .addToggle(toggle => toggle.setValue(this.plugin.settings.export_blog_tag).onChange(async (value) => {
                this.plugin.settings.export_blog_tag = value;
                await this.plugin.saveSettings();
            }));

        containerEl.createEl('h2', { text: 'Export Features' });

		new Setting(containerEl)
			.setName("slugify paths")
			.setDesc("Convert link paths to Hugo-compatible slugs (lowercase, spaces to hyphens). Enable if your Hugo site uses default permalink settings.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.slugify_paths)
				.onChange(async (value) => {
					this.plugin.settings.slugify_paths = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("permalink pattern")
			.setDesc("URL pattern for internal links. Use tokens like :slug, :title, :section, :sections, :filename, :year, :month, :day. Leave empty for no modification. Plain text works as a prefix (e.g. 'post' → /post/note-name/).")
			.addText(text => text
				.setPlaceholder(":section/:slug")
				.setValue(this.plugin.settings.permalink_pattern)
				.onChange(async (value) => {
					this.plugin.settings.permalink_pattern = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName("export media files")
			.setDesc("Copy embedded images, PDFs, and other linked non-markdown files to the Hugo static directory.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.export_media)
				.onChange(async (value) => {
					this.plugin.settings.export_media = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("convert wikilinks")
			.setDesc("Convert Obsidian [[wikilinks]] to standard markdown links. Disable if your Hugo theme already supports wikilinks.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.convert_wikilinks)
				.onChange(async (value) => {
					this.plugin.settings.convert_wikilinks = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("render math")
			.setDesc("Convert $$LaTeX$$ expressions to Hugo-compatible HTML math blocks.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.render_math)
				.onChange(async (value) => {
					this.plugin.settings.render_math = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("inject dates")
			.setDesc("Auto-inject date and lastmod from file creation and modification timestamps when missing from frontmatter.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.inject_dates)
				.onChange(async (value) => {
					this.plugin.settings.inject_dates = value;
					await this.plugin.saveSettings();
				}));
    }
}

export const check_setting = (setting: HugoPublishSettings): boolean => {
    if (setting.blog_dir.length == 0 || setting.site_dir.length == 0) {
        return false
    }
    return true;
}
