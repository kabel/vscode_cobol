'use strict';

import { workspace } from 'vscode';
import { ICOBOLSettings, COBOLSettings, outlineFlag, formatOnReturn } from './iconfiguration';
import * as path from 'path';
import { isDirectory } from './extension';
import { CacheDirectoryStrategy } from './externalfeatures';


export class VSCOBOLConfiguration {
    private static config: ICOBOLSettings = new COBOLSettings();

    public static init(): ICOBOLSettings {
        const vsconfig = VSCOBOLConfiguration.config;

        vsconfig.experimental_features = getBoolean('experimental_features', false);
        vsconfig.enable_tabstop = getBoolean('enable_tabstop', false);
        vsconfig.ignorecolumn_b_onwards = getBoolean('ignorecolumn_b_onwards', false);
        vsconfig.copybooks_nested = getBoolean('copybooks_nested', false);
        vsconfig.fuzzy_variable_search = getBoolean('fuzzy_variable_search', false);
        vsconfig.outline = isOutlineEnabled();
        vsconfig.copybookdirs = getCopybookdirs_defaults(vsconfig.invalid_copybookdirs);
        vsconfig.pre_parse_line_limit = getPreParseLineLimit();
        vsconfig.copybookexts = getCopybookExts();
        vsconfig.program_extensions = getProgram_extensions();
        vsconfig.tabstops = getTabStops();
        vsconfig.linter = getBoolean('linter', false);
        vsconfig.line_comment = getBoolean("line_comment", false);
        vsconfig.fileformat_strategy = getFileformatStrategy();
        vsconfig.enable_data_provider = getBoolean('enable_data_provider', true);
        vsconfig.disable_unc_copybooks_directories = getBoolean('disable_unc_copybooks_directories', false);
        vsconfig.intellisense_include_unchanged = getBoolean("intellisense_include_unchanged", true);
        vsconfig.intellisense_include_camelcase = getBoolean("intellisense_include_camelcase", false);
        vsconfig.intellisense_include_uppercase = getBoolean("intellisense_include_uppercase", false);
        vsconfig.intellisense_include_lowercase = getBoolean("intellisense_include_lowercase", false);
        vsconfig.intellisense_item_limit = getIntellisense_item_limit();
        vsconfig.process_metadata_cache_on_start = getBoolean("process_metadata_cache_on_start", false);
        vsconfig.cache_metadata = getcache_metadata();
        vsconfig.cache_metadata_time_limit = getNumber("cache_metadata_time_limit", 30000);
        vsconfig.cache_metadata_max_directory_scan_depth = getNumber("cache_metadata_max_directory_scan_depth", 32);
        vsconfig.cache_metadata_show_progress_messages = getBoolean("cache_metadata_show_progress_messages", false);
        vsconfig.parse_copybooks_for_references = getBoolean("parse_copybooks_for_references", false);
        vsconfig.workspacefolders_order = getWorkspacefolders_order();
        vsconfig.linter_unused_paragraphs_or_sections = getBoolean("linter_unused_paragraphs_or_sections", true);
        vsconfig.linter_house_standards = getBoolean("linter_house_standards", true);
        vsconfig.linter_house_standards_rules = getlinter_house_standards_rules();
        vsconfig.linter_mark_as_information = getBoolean("linter_mark_as_information", true);
        vsconfig.linter_ignore_section_before_entry = getBoolean("linter_ignore_section_before_entry", true);
        vsconfig.ignore_unsafe_extensions = getBoolean("ignore_unsafe_extensions", false);
        vsconfig.coboldoc_workspace_folder = getCoboldoc_workspace_folder();
        vsconfig.scan_comments_for_hints = getBoolean("scan_comments_for_hints", false);
        vsconfig.scan_comment_copybook_token = getscan_comment_copybook_token();
        vsconfig.process_metadata_cache_on_file_save = getBoolean("process_metadata_cache_on_file_save", false);
        vsconfig.cache_metadata_user_directory = getString("cache_metadata_user_directory", "");
        vsconfig.editor_maxTokenizationLineLength = workspace.getConfiguration('editor').get<number>("maxTokenizationLineLength",20000);
        vsconfig.sourceview = getBoolean("sourceview", false);
        vsconfig.sourceview_include_jcl_files = getBoolean("sourceview_include_jcl_files", true);
        vsconfig.sourceview_include_hlasm_files = getBoolean("sourceview_include_hlasm_files", true);
        vsconfig.sourceview_include_pli_files = getBoolean("sourceview_include_pli_files", true);
        vsconfig.sourceview_include_doc_files = getBoolean("sourceview_include_doc_files", true);
        vsconfig.sourceview_include_script_files = getBoolean("sourceview_include_script_files", true);
        vsconfig.format_on_return = workspace.getConfiguration('coboleditor').get<formatOnReturn>("format_on_return",formatOnReturn.Off);

        return vsconfig;
    }

    public static get(): ICOBOLSettings {
        if (VSCOBOLConfiguration.config.init_required) {
            VSCOBOLConfiguration.init();
            VSCOBOLConfiguration.config.init_required = false;
        }
        return VSCOBOLConfiguration.config;
    }


    public static isOnDiskCachingEnabled(): boolean {
        const config = VSCOBOLConfiguration.get();
        const cacheStrat = config.cache_metadata;
        if (cacheStrat === CacheDirectoryStrategy.Off) {
            return false;
        }

        return true;
    }
}

function getBoolean(configSection: string, defaultValue: boolean): boolean {
    const editorConfig = workspace.getConfiguration('coboleditor');
    let expEnabled = editorConfig.get<boolean>(configSection);
    if (expEnabled === undefined || expEnabled === null) {
        expEnabled = defaultValue;
    }
    return expEnabled;
}

function getString(configSection: string, defaultValue: string): string {
    const editorConfig = workspace.getConfiguration('coboleditor');
    let strValue = editorConfig.get<string>(configSection);
    if (strValue === undefined || strValue === null) {
        strValue = defaultValue;
    }
    return strValue;
}

function getNumber(configSection: string, defaultValue: number): number {
    const editorConfig = workspace.getConfiguration('coboleditor');
    let lineLimit = editorConfig.get<number>(configSection);
    if (lineLimit === undefined || lineLimit === null) {
        lineLimit = defaultValue;
    }
    return lineLimit;
}

function getPreParseLineLimit(): number {
    const editorConfig = workspace.getConfiguration('coboleditor');
    let lineLimit = editorConfig.get<number>('pre_parse_line_limit');
    if (lineLimit === undefined || lineLimit === null) {
        lineLimit = 25;
    }
    return lineLimit;
}

function getCoboldoc_workspace_folder(): string {
    const editorConfig = workspace.getConfiguration('coboleditor');
    const coboldoc_folder = editorConfig.get<string>('coboldoc_workspace_folder');
    if (coboldoc_folder === undefined || coboldoc_folder === null) {
        return "coboldoc";
    }
    return coboldoc_folder;
}

function getcache_metadata(): CacheDirectoryStrategy {
    const editorConfig = workspace.getConfiguration('coboleditor');
    let cacheDirStrategy = editorConfig.get<string>('cache_metadata');

    if (cacheDirStrategy === undefined || cacheDirStrategy === null) {
        return CacheDirectoryStrategy.Off;
    }

    cacheDirStrategy = cacheDirStrategy.toLowerCase();
    if (cacheDirStrategy === "off") {
        return CacheDirectoryStrategy.Off;
    }

    switch (cacheDirStrategy) {
        case 'workspace': return CacheDirectoryStrategy.Workspace;
        case 'user_defined_directory': return CacheDirectoryStrategy.UserDefinedDirectory;
        case 'off': return CacheDirectoryStrategy.Off;
    }
    return CacheDirectoryStrategy.Off;
}


function getscan_comment_copybook_token(): string {
    const editorConfig = workspace.getConfiguration('coboleditor');
    let hintToken = editorConfig.get<string>('scan_comment_copybook_token');
    if (hintToken === undefined || hintToken === null) {
        hintToken = "source-dependency";
    }
    return hintToken;
}

function getIntellisense_item_limit(): number {
    const editorConfig = workspace.getConfiguration('coboleditor');
    let itemLimit = editorConfig.get<number>('intellisense_item_limit');
    if (itemLimit === undefined || itemLimit === null) {
        itemLimit = 0;
    }
    return itemLimit;
}

function getFileformatStrategy(): string {
    const editorConfig = workspace.getConfiguration('coboleditor');
    const fileStrat = editorConfig.get<string>('fileformat_strategy');

    if (fileStrat === undefined || fileStrat === null) {
        return "normal";
    }

    return fileStrat;
}


function isOutlineEnabled(): outlineFlag {
    const editorConfig = workspace.getConfiguration('coboleditor');
    const outlineEnabled = editorConfig.get('outline');
    if (outlineEnabled === undefined || outlineEnabled === null) {
        return outlineFlag.On;
    }

    switch (outlineEnabled) {
        case "on": return outlineFlag.On;
        case "off": return outlineFlag.Off;
        case "partial": return outlineFlag.Partial;
        case "skeleton": return outlineFlag.Skeleton;
    }
    return outlineFlag.On;
}

const DEFAULT_COPYBOOK_DIR: string[] = [];

function expandEnvVars(startEnv: string): string {
    let complete = false;
    let env: string = startEnv;

    while (complete === false) {
        const indexOfEnv = env.indexOf("${env:");
        if (indexOfEnv === -1) {
            complete = true;
        } else {
            const lenOfValue = env.indexOf("}") - (indexOfEnv + 6);
            const envValue = env.substr(6 + indexOfEnv, lenOfValue);
            const left = env.substr(0, indexOfEnv);
            const right = env.substr(1 + env.indexOf("}"));
            env = left + process.env[envValue] + right;
        }
    }

    return env;
}

function getCopybookdirs_defaults(invalidSearchDirectory: string[]): string[] {
    const editorConfig = workspace.getConfiguration('coboleditor');
    let dirs = editorConfig.get<string[]>('copybookdirs');
    if (!dirs || (dirs !== null && dirs.length === 0)) {
        dirs = DEFAULT_COPYBOOK_DIR;
    }

    const extraDirs: string[] = [];

    for (let dirpos = 0; dirpos < dirs.length; dirpos++) {
        let dir = dirs[dirpos];

        /* remove ${workspaceFolder} */
        dir = expandEnvVars(dir);

        if (dir.startsWith("${workspaceFolder}")) {
            dir = dir.replace("${workspaceFolder}", "").trim();

            // remove / or \ forward
            if (dir.startsWith('/') || dir.startsWith('\\')) {
                dir = dir.substr(1).trim();
            }
        }

        // ignore empty elements
        if (dir.length !== 0) {
            if (dir.startsWith("$")) {
                const e = process.env[dir.substr(1)];
                if (e !== undefined && e !== null) {
                    e.split(path.delimiter).forEach(function (item) {
                        if (item !== undefined && item !== null && item.length > 0) {
                            if (isDirectory(item)) {
                                extraDirs.push(item);
                            } else {
                                invalidSearchDirectory.push(item);
                            }
                        }
                    });
                } else {
                    invalidSearchDirectory.push(dir);
                }
            } else {
                if (dir !== ".") {
                    extraDirs.push(dir);
                }
            }
        }
    }

    return extraDirs;
}

const DEFAULT_COPYBOOK_EXTS = ["cpy", "CPY"];
const DEFAULT_PROGRAM_EXTS = ["cbl", "CBL"];

function getCopybookExts(): string[] {
    const editorConfig = workspace.getConfiguration('coboleditor');
    let extensions = editorConfig.get<string[]>('copybookexts');
    if (!extensions || (extensions !== null && extensions.length === 0)) {
        extensions = DEFAULT_COPYBOOK_EXTS;
    }
    extensions.push("");
    return extensions;
}

function getProgram_extensions(): string[] {
    const editorConfig = workspace.getConfiguration('coboleditor');
    let extensions = editorConfig.get<string[]>('program_extensions');
    if (!extensions || (extensions !== null && extensions.length === 0)) {
        extensions = DEFAULT_PROGRAM_EXTS;
    }
    return extensions;
}


const DEFAULT_RULER = [0, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55, 59, 63, 67, 71, 75, 79];

function getTabStops(): number[] {
    const editorConfig = workspace.getConfiguration('coboleditor');
    let tabStops = editorConfig.get<number[]>('tabstops');
    if (!tabStops || (tabStops !== null && tabStops.length === 0)) {
        tabStops = DEFAULT_RULER;
    }
    return tabStops;
}

function getWorkspacefolders_order(): string[] {
    const editorConfig = workspace.getConfiguration('coboleditor');
    let dirs = editorConfig.get<string[]>('workspacefolders_order');
    if (!dirs || (dirs !== null && dirs.length === 0)) {
        dirs = [];
    }
    return dirs;
}


function getlinter_house_standards_rules(): string[] {
    const editorConfig = workspace.getConfiguration('coboleditor');
    let standards = editorConfig.get<string[]>('linter_house_standards_rules');
    if (!standards || (standards !== null && standards.length === 0)) {
        standards = [];
    }
    return standards;
}