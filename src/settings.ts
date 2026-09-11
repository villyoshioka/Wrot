import {
  App,
  ColorComponent,
  Platform,
  PluginSettingTab,
  Setting,
  type SettingDefinition,
  type SettingDefinitionItem,
  type TextComponent,
  setIcon,
} from "obsidian";
import type WrotPlugin from "./main";
import { t, defaultTimestampFormat, defaultHeaderDateFormat } from "./i18n";
import { blendColor, toHex } from "./utils/color";
import { HEX_COLOR_RE } from "./utils/patterns";

export interface SubColorScope {
  buttons?: boolean;
  quote?: boolean;
  list?: boolean;
  ogp?: boolean;
}

export interface TagColorRule {
  tag: string;
  bgColor: string;
  textColor: string;
  accentColor?: string;
  subColor?: string;
  subColorScope?: SubColorScope;
  // Excludes this tag from core integration (graph view / native tag search);
  // all memo tags are integrated by default.
  noIntegration?: boolean;
  // Keeps memos carrying this tag out of the timeline view. The daily note itself
  // is untouched: reading view and live preview still render them as before.
  hideFromTimeline?: boolean;
  // Greys out the delete item on memos carrying this tag, so a whole category of
  // memos can be put out of reach of a mistaken tap.
  protectFromDelete?: boolean;
}

export interface PinEntry {
  timestamp: string;
  file: string;
}

/**
 * A pin that starts showing on a chosen day. Until then the memo stays in its own
 * day's timeline, marked but not pinned. Scheduled pins hold their own allowance,
 * separate from `pins` but capped by the same `pinLimit`, and they keep occupying
 * it after the day arrives — moving them across would let a full pin list block a
 * schedule that was made when there was still room.
 */
export interface ScheduledPinEntry extends PinEntry {
  // Day the pin starts showing, as YYYY-MM-DD.
  from: string;
}

export type PinLimit = 1 | 3 | 5;

/** Where a toolbar action lives: on the bar, inside the overflow menu, or nowhere at all. */
export type ToolbarSlotState = "bar" | "menu" | "off";

/**
 * One entry of the input toolbar's single ordered list. Entries keep their place in the
 * list whatever their state, so putting one back returns it to the same spot.
 */
export interface ToolbarSlot {
  id: string;
  state: ToolbarSlotState;
}

/**
 * Every action the toolbar can offer, in the order it ships. The first group is what a
 * fresh install shows on the bar; the rest start out in the overflow menu. Ids are
 * persisted, so they are renamed only alongside a migration.
 */
export const DEFAULT_TOOLBAR_LAYOUT: ReadonlyArray<ToolbarSlot> = [
  { id: "image", state: "bar" },
  { id: "embed", state: "bar" },
  { id: "bold", state: "bar" },
  { id: "italic", state: "bar" },
  { id: "list", state: "bar" },
  { id: "check", state: "bar" },
  { id: "ol", state: "bar" },
  { id: "schedule", state: "menu" },
  { id: "code", state: "menu" },
  { id: "math", state: "menu" },
  { id: "quote", state: "menu" },
  { id: "link", state: "menu" },
  { id: "strikethrough", state: "menu" },
  { id: "highlight", state: "menu" },
];

// Layouts saved before `state` existed carry a `shown` boolean instead.
function readSlotState(slot: { state?: unknown; shown?: unknown }): ToolbarSlotState {
  if (slot.state === "bar" || slot.state === "menu" || slot.state === "off") return slot.state;
  return slot.shown === true ? "bar" : "menu";
}

/**
 * Fills in a saved layout: unknown and duplicate ids are dropped, and any action the
 * save predates is appended hidden. A button added by a later version therefore lands
 * in the overflow menu rather than shifting positions the hand has already learned.
 * An empty save means "never customised" and yields the shipped layout.
 */
export function resolveToolbarLayout(saved: ToolbarSlot[] | undefined): ToolbarSlot[] {
  const shipped = DEFAULT_TOOLBAR_LAYOUT.map((slot) => ({ ...slot }));
  if (!saved || saved.length === 0) return shipped;

  const known = new Set(DEFAULT_TOOLBAR_LAYOUT.map((slot) => slot.id));
  const seen = new Set<string>();
  const resolved: ToolbarSlot[] = [];
  for (const slot of saved) {
    if (!slot || !known.has(slot.id) || seen.has(slot.id)) continue;
    seen.add(slot.id);
    resolved.push({ id: slot.id, state: readSlotState(slot) });
  }
  for (const slot of shipped) {
    if (!seen.has(slot.id)) resolved.push({ id: slot.id, state: "menu" });
  }
  return resolved;
}

export interface WrotSettings {
  viewPlacement: "left" | "right" | "main";
  openOnStartup: boolean;
  headerDateFormat: string;
  timestampFormat: string;
  bgColorLight: string;
  bgColorDark: string;
  textColorLight: string;
  textColorDark: string;
  submitLabel: string;
  submitIcon: string;
  // Submit-button text while editing a post. Same rules as submitLabel:
  // empty renders icon-only (only when an icon is set, default text otherwise).
  updateLabel: string;
  // Submit-button icon while editing a post. Empty shares submitIcon.
  updateIcon: string;
  inputPlaceholder: string;
  // Saves attached images into attachmentFolder instead of following Obsidian's own
  // attachment setting. The folder is never created here: a missing one falls back.
  useCustomAttachmentFolder: boolean;
  attachmentFolder: string;
  enableOgpFetch: boolean;
  checkStrikethrough: boolean;
  tagSuggestEnabled: boolean;
  // Metadata-cache injection affects both graph view and native tag: search;
  // the two cannot be separated, hence a single toggle.
  graphTagsEnabled: boolean;
  tagColorRulesEnabled: boolean;
  tagColorRules: TagColorRule[];
  followObsidianFontSize: boolean;
  // Deletion is irreversible and the plugin has no undo, so the menu item stays
  // out of sight until it is asked for.
  showPostDelete: boolean;
  // On by default so the arrange affordance is discoverable; can be switched off.
  toolbarEditEnabled: boolean;
  // Lives in layout.json; empty only until loadDeferredState has read or created that file.
  toolbarLayout: ToolbarSlot[];
  showCalendarButton: boolean;
  calendarDayShape: "circle" | "rounded" | "square";
  pins: PinEntry[];
  scheduledPins: ScheduledPinEntry[];
  pinLimit: PinLimit;
  // Off for new installs; loadDeferredState turns it on once for users who already used pins.
  pinFixed: boolean;
  // Locale at last save, used to detect an Obsidian language change on startup.
  // When absent (pre-existing users), loadSettings adopts the current locale without resetting.
  lastLocale?: string;
}

export const DEFAULT_SETTINGS: WrotSettings = {
  viewPlacement: "right",
  openOnStartup: false,
  headerDateFormat: "YYYY年MM月DD日",
  timestampFormat: "YYYY/MM/DD HH:mm:ss",
  bgColorLight: "#efefef",
  bgColorDark: "#303030",
  textColorLight: "#454545",
  textColorDark: "#dcddde",
  submitLabel: "投稿",
  submitIcon: "send",
  updateLabel: "更新",
  updateIcon: "send",
  inputPlaceholder: "あなたが書くのを待っています...",
  useCustomAttachmentFolder: false,
  attachmentFolder: "",
  enableOgpFetch: true,
  checkStrikethrough: false,
  tagSuggestEnabled: true,
  graphTagsEnabled: true,
  tagColorRulesEnabled: false,
  tagColorRules: [],
  followObsidianFontSize: false,
  showPostDelete: false,
  toolbarEditEnabled: true,
  toolbarLayout: [],
  showCalendarButton: true,
  calendarDayShape: "rounded",
  pins: [],
  scheduledPins: [],
  pinLimit: 3,
  pinFixed: false,
};

function setDisabled(el: HTMLElement | null, disabled: boolean): void {
  if (!el) return;
  if (disabled) {
    el.setAttr("disabled", "true");
    el.setAttr("aria-disabled", "true");
    el.addClass("wr-tag-rule-disabled");
  } else {
    el.removeAttribute("disabled");
    el.removeAttribute("aria-disabled");
    el.removeClass("wr-tag-rule-disabled");
  }
}

// Locale strings carry authored line breaks as "\n". They are desktop-only formatting:
// mobile columns are narrow enough that natural wrapping reads better, so the CSS hides
// these breaks there.
function appendWithBreaks(target: DocumentFragment | HTMLElement, text: string): void {
  text.split("\n").forEach((part, i) => {
    if (i > 0) target.createEl("br", { cls: "wr-pc-break" });
    target.appendText(part);
  });
}

function desc(text: string): string | DocumentFragment {
  if (!text.includes("\n")) return text;
  return createFragment((frag) => appendWithBreaks(frag, text));
}

// The colour picker's own input element, which the lock state needs to disable.
function pickerInputEl(picker: ColorComponent): HTMLInputElement {
  return (picker as unknown as { colorPickerEl: HTMLInputElement }).colorPickerEl;
}

/** One tag-rule row in the settings UI: the values it shows and the writes each control makes. */
interface RuleGroupOptions {
  ruleNumber: number;
  ruleKey: number;
  initial: TagColorRule;
  onTagChange: (v: string) => Promise<void>;
  onBgChange: (v: string) => Promise<void>;
  onFgChange: (v: string) => Promise<void>;
  onAccentChange: (v: string | undefined) => Promise<void>;
  onSubChange: (v: string | undefined) => Promise<void>;
  onScopeChange: (key: keyof SubColorScope, value: boolean) => Promise<void>;
  onNoIntegrationChange: (value: boolean) => Promise<void>;
  onHideFromTimelineChange: (value: boolean) => Promise<void>;
  onProtectFromDeleteChange: (value: boolean) => Promise<void>;
  trailing:
    | { kind: "delete"; handler: () => Promise<void> }
    | { kind: "reset"; handler: () => Promise<void> }
    | null;
}

export class WrotSettingTab extends PluginSettingTab {
  plugin: WrotPlugin;
  // In-memory only: all rules relock whenever the settings tab is reopened.
  private unlockedRules: Set<number> = new Set();
  private quickAddBtnEl: HTMLElement | null = null;

  constructor(app: App, plugin: WrotPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.containerEl.addClass("wr-settings");
  }

  hide(): void {
    this.unlockedRules.clear();
    super.hide();
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [this.basicGroup(), this.advancedGroup(), ...this.tagRuleItems()];
  }

  getControlValue(key: string): unknown {
    const settings = this.plugin.settings;
    // Dropdowns persist strings; pinLimit is the only numeric one.
    if (key === "pinLimit") return String(settings.pinLimit);
    return settings[key as keyof WrotSettings];
  }

  /**
   * What each control needs beyond storing its value. Membership decides ownership too:
   * a key absent here is left to the base class.
   *
   * Runs after the value is written to `settings` but before the save, so an entry may still
   * adjust the settings it is reacting to.
   */
  private controlEffects(): Record<string, () => void | Promise<void>> {
    const settings = this.plugin.settings;
    return {
      viewPlacement: () => {
        this.update();
        void this.plugin.relocateView();
      },
      openOnStartup: () => undefined,
      enableOgpFetch: () => undefined,
      attachmentFolder: () => undefined,
      // The folder row is only offered while this is on.
      useCustomAttachmentFolder: () => this.update(),
      followObsidianFontSize: () => this.plugin.applyFontFollow(),
      calendarDayShape: () => this.plugin.applyCalendarDayShape(),
      checkStrikethrough: () => this.plugin.refreshViews(),

      pinLimit: () => {
        if (settings.pins.length > settings.pinLimit) {
          settings.pins = settings.pins.slice(0, settings.pinLimit);
        }
        // Scheduled pins hold their own allowance of the same size, trimmed the same way.
        if (settings.scheduledPins.length > settings.pinLimit) {
          settings.scheduledPins = settings.scheduledPins.slice(0, settings.pinLimit);
        }
        this.plugin.refreshViews();
      },

      // Switching off is also how the remembered candidates are discarded: an unused
      // dictionary is dead weight, and posting rebuilds it once suggestions are back on.
      tagSuggestEnabled: async () => {
        if (settings.tagSuggestEnabled) return;
        this.plugin.recentTags = [];
        await this.plugin.saveRecentTags();
      },

      graphTagsEnabled: async () => {
        await this.plugin.graphTags.applyEnabled();
        // The per-rule "exclude from integration" row is only offered while this is on.
        this.update();
      },

      toolbarEditEnabled: () => {
        // The reset row is only offered while this is on, and a bar left mid-arrangement
        // has to be let go of.
        this.plugin.updateToolbarLayout();
        this.update();
      },

      pinFixed: () => this.plugin.refreshViews(),

      showPostDelete: () => {
        this.plugin.refreshViews();
        // The per-rule "disable delete button" row is only offered while this is on.
        this.update();
      },

      showCalendarButton: () => {
        this.plugin.updateCalendarButton();
        // The day-shape row only applies while the button is shown.
        this.refreshDomState();
      },

      tagColorRulesEnabled: () => {
        this.plugin.applyTagColorRules();
        this.plugin.refreshAllWrDecorations();
        // Toggling rules also changes whether the "no integration" exclusion applies.
        this.plugin.graphTags.rebuild();
        // When switching on with nothing meaningful saved, leave the first rule editable.
        const rules = settings.tagColorRules;
        const noMeaningfulRule =
          rules.length === 0 || (rules.length === 1 && rules[0].tag.trim() === "");
        if (settings.tagColorRulesEnabled && noMeaningfulRule) this.unlockedRules.add(0);
        this.update();
      },
    };
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    const effect = this.controlEffects()[key];
    if (!effect) {
      await super.setControlValue(key, value);
      return;
    }
    const stored = key === "pinLimit" ? (Number(value) as PinLimit) : value;
    (this.plugin.settings as unknown as Record<string, unknown>)[key] = stored;
    await effect();
    await this.plugin.saveSettings();
  }

  private isDarkTheme(): boolean {
    return activeDocument.body.classList.contains("theme-dark");
  }

  private defaultRuleBg(): string {
    return this.isDarkTheme() ? this.plugin.settings.bgColorDark : this.plugin.settings.bgColorLight;
  }

  private defaultRuleText(): string {
    return this.isDarkTheme()
      ? this.plugin.settings.textColorDark
      : this.plugin.settings.textColorLight;
  }

  // A rule still carrying the light-theme default under a dark theme is treated as unset,
  // so a fresh rule starts from the colour the user actually sees.
  private resolveRuleBg(value: string): string {
    const isLightDefault = value === DEFAULT_SETTINGS.bgColorLight;
    return HEX_COLOR_RE.test(value) && !(this.isDarkTheme() && isLightDefault)
      ? value
      : this.defaultRuleBg();
  }

  private resolveRuleText(value: string): string {
    const isLightDefault = value === DEFAULT_SETTINGS.textColorLight;
    return HEX_COLOR_RE.test(value) && !(this.isDarkTheme() && isLightDefault)
      ? value
      : this.defaultRuleText();
  }

  private defaultAccent(): string {
    const raw = getComputedStyle(activeDocument.body).getPropertyValue("--text-accent").trim();
    if (HEX_COLOR_RE.test(raw)) return raw;
    // The theme may express the accent in any colour syntax; let the engine resolve it.
    const probe = createDiv();
    probe.setCssStyles({ color: raw || "var(--text-accent)", display: "none" });
    activeDocument.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    activeDocument.body.removeChild(probe);
    const m = resolved.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
      return `#${toHex(+m[1])}${toHex(+m[2])}${toHex(+m[3])}`;
    }
    return this.defaultRuleText();
  }

  private defaultSub(rule: TagColorRule): string {
    return blendColor(this.resolveRuleText(rule.textColor), this.resolveRuleBg(rule.bgColor), 0.45);
  }

  private isSubCustomized(rule: TagColorRule): boolean {
    return !!rule.subColor && HEX_COLOR_RE.test(rule.subColor);
  }

  // A text row with a reset button. The declarative controls carry no extra affordance,
  // so rows that offer one are rendered by hand.
  private textWithReset(options: {
    name: string;
    desc: string;
    placeholder: string;
    read: () => string;
    write: (value: string) => Promise<void>;
    resetValue: () => string;
  }): SettingDefinition {
    return {
      name: options.name,
      desc: desc(options.desc),
      render: (setting: Setting) => {
        let field: TextComponent;
        setting
          .setName(options.name)
          .setDesc(desc(options.desc))
          .setClass("wr-text-input-row")
          .addText((text) => {
            field = text;
            text
              .setPlaceholder(options.placeholder)
              .setValue(options.read())
              .onChange(async (value) => {
                await options.write(value);
              });
          })
          .addExtraButton((btn) =>
            btn.setIcon("reset").onClick(async () => {
              const value = options.resetValue();
              await options.write(value);
              field.setValue(value);
            })
          );
      },
    };
  }

  // A colour row with a reset button, same reasoning as textWithReset.
  private colorWithReset(options: {
    name: string;
    desc: string;
    read: () => string;
    write: (value: string) => Promise<void>;
    resetValue: () => string;
    onReset?: () => Promise<void>;
    visible?: () => boolean;
  }): SettingDefinition {
    return {
      name: options.name,
      desc: desc(options.desc),
      visible: options.visible,
      render: (setting: Setting) => {
        let picker: ColorComponent;
        setting
          .setName(options.name)
          .setDesc(desc(options.desc))
          .setClass("wr-reverse-controls")
          .addColorPicker((component) => {
            picker = component;
            component.setValue(options.read()).onChange(async (value) => {
              await options.write(value);
            });
          })
          .addExtraButton((btn) =>
            btn.setIcon("reset").onClick(async () => {
              if (options.onReset) await options.onReset();
              else await options.write(options.resetValue());
              picker.setValue(options.resetValue());
            })
          );
      },
    };
  }

  private basicGroup(): SettingDefinitionItem {
    const settings = this.plugin.settings;

    return {
      type: "group",
      heading: t("settings.section.basic"),
      items: [
        {
          name: t("settings.item.viewPlacement.name"),
          desc: desc(t("settings.item.viewPlacement.desc")),
          control: {
            type: "dropdown",
            key: "viewPlacement",
            options: {
              left: t("settings.option.viewPlacement.left"),
              right: t("settings.option.viewPlacement.right"),
              main: t("settings.option.viewPlacement.main"),
            },
          },
        },
        {
          name: t("settings.item.openOnStartup.name"),
          desc: desc(t("settings.item.openOnStartup.desc")),
          visible: () => settings.viewPlacement === "main",
          control: { type: "toggle", key: "openOnStartup" },
        },
        {
          name: t("settings.item.followFontSize.name"),
          desc: desc(t("settings.item.followFontSize.desc")),
          control: { type: "toggle", key: "followObsidianFontSize" },
        },
        this.textWithReset({
          name: t("settings.item.headerDateFormat.name"),
          desc: t("settings.item.headerDateFormat.desc"),
          placeholder: defaultHeaderDateFormat(),
          read: () => settings.headerDateFormat,
          write: async (value) => {
            settings.headerDateFormat = value || defaultHeaderDateFormat();
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          },
          resetValue: () => defaultHeaderDateFormat(),
        }),
        this.textWithReset({
          name: t("settings.item.timestampFormat.name"),
          desc: t("settings.item.timestampFormat.desc"),
          placeholder: defaultTimestampFormat(),
          read: () => settings.timestampFormat,
          write: async (value) => {
            settings.timestampFormat = value || defaultTimestampFormat();
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          },
          resetValue: () => defaultTimestampFormat(),
        }),
        this.themeColorRow("bgColorLight"),
        this.themeColorRow("textColorLight"),
        this.themeColorRow("bgColorDark"),
        this.themeColorRow("textColorDark"),
      ],
    };
  }

  // The four theme colours behave identically apart from which setting they write to.
  private themeColorRow(
    key: "bgColorLight" | "textColorLight" | "bgColorDark" | "textColorDark"
  ): SettingDefinition {
    const settings = this.plugin.settings;
    return this.colorWithReset({
      name: t(`settings.item.${key}.name`),
      desc: t(`settings.item.${key}.desc`),
      read: () => settings[key],
      write: async (value) => {
        settings[key] = value;
        await this.plugin.saveSettings();
        this.plugin.applyBgColor();
      },
      resetValue: () => DEFAULT_SETTINGS[key],
    });
  }

  private advancedGroup(): SettingDefinitionItem {
    const settings = this.plugin.settings;

    return {
      type: "group",
      heading: t("settings.section.advanced"),
      items: [
        this.textWithReset({
          name: t("settings.item.submitLabel.name"),
          desc: t("settings.item.submitLabel.desc"),
          placeholder: t("defaults.submitLabel"),
          read: () => settings.submitLabel,
          write: async (value) => {
            settings.submitLabel = value.trim();
            await this.plugin.saveSettings();
            this.plugin.updateSubmitButton();
          },
          resetValue: () => t("defaults.submitLabel"),
        }),
        this.iconRow("submitIcon"),
        this.textWithReset({
          name: t("settings.item.updateLabel.name"),
          desc: t("settings.item.updateLabel.desc"),
          placeholder: t("defaults.updateLabel"),
          read: () => settings.updateLabel,
          write: async (value) => {
            settings.updateLabel = value.trim();
            await this.plugin.saveSettings();
            this.plugin.updateSubmitButton();
          },
          resetValue: () => t("defaults.updateLabel"),
        }),
        this.iconRow("updateIcon"),
        this.textWithReset({
          name: t("settings.item.inputPlaceholder.name"),
          desc: t("settings.item.inputPlaceholder.desc"),
          placeholder: t("defaults.inputPlaceholder"),
          read: () => settings.inputPlaceholder,
          write: async (value) => {
            settings.inputPlaceholder = value;
            await this.plugin.saveSettings();
            this.plugin.updateInputPlaceholder();
          },
          resetValue: () => t("defaults.inputPlaceholder"),
        }),
        {
          name: t("settings.item.pinLimit.name"),
          desc: desc(t("settings.item.pinLimit.desc")),
          control: {
            type: "dropdown",
            key: "pinLimit",
            options: {
              "1": t("settings.option.pinLimit.1"),
              "3": t("settings.option.pinLimit.3"),
              "5": t("settings.option.pinLimit.5"),
            },
          },
        },
        {
          name: t("settings.item.pinFixed.name"),
          desc: desc(t("settings.item.pinFixed.desc")),
          control: { type: "toggle", key: "pinFixed" },
        },
        {
          name: t("settings.item.tagSuggest.name"),
          desc: desc(t("settings.item.tagSuggest.desc")),
          control: { type: "toggle", key: "tagSuggestEnabled" },
        },
        {
          name: t("settings.item.graphTags.name"),
          desc: desc(t("settings.item.graphTags.desc")),
          control: { type: "toggle", key: "graphTagsEnabled" },
        },
        {
          name: t("settings.item.ogp.name"),
          desc: desc(t("settings.item.ogp.desc")),
          control: { type: "toggle", key: "enableOgpFetch" },
        },
        {
          name: t("settings.item.checkStrikethrough.name"),
          desc: desc(t("settings.item.checkStrikethrough.desc")),
          control: { type: "toggle", key: "checkStrikethrough" },
        },
        {
          name: t("settings.item.showCalendarButton.name"),
          desc: desc(t("settings.item.showCalendarButton.desc")),
          control: { type: "toggle", key: "showCalendarButton" },
        },
        {
          name: t("settings.item.calendarDayShape.name"),
          desc: desc(t("settings.item.calendarDayShape.desc")),
          visible: () => settings.showCalendarButton,
          control: {
            type: "dropdown",
            key: "calendarDayShape",
            options: {
              circle: t("settings.option.calendarDayShape.circle"),
              rounded: t("settings.option.calendarDayShape.rounded"),
              square: t("settings.option.calendarDayShape.square"),
            },
          },
        },
        {
          name: t("settings.item.useCustomAttachmentFolder.name"),
          desc: desc(t("settings.item.useCustomAttachmentFolder.desc")),
          control: { type: "toggle", key: "useCustomAttachmentFolder" },
        },
        {
          name: t("settings.item.attachmentFolder.name"),
          desc: desc(t("settings.item.attachmentFolder.desc")),
          visible: () => settings.useCustomAttachmentFolder,
          control: {
            type: "folder",
            key: "attachmentFolder",
            placeholder: t("settings.item.attachmentFolder.placeholder"),
          },
        },
        {
          name: t("settings.item.toolbarEdit.name"),
          desc: desc(t("settings.item.toolbarEdit.desc")),
          control: { type: "toggle", key: "toolbarEditEnabled" },
        },
        this.resetToolbarRow(),
        {
          name: t("settings.item.showPostDelete.name"),
          desc: desc(t("settings.item.showPostDelete.desc")),
          control: { type: "toggle", key: "showPostDelete" },
        },
      ],
    };
  }

  // Puts the toolbar back to the shipped arrangement. Nothing written can be lost this
  // way, so it asks for a second press rather than a dialog — the same shape the post
  // delete uses, minus the weight.
  private resetToolbarRow(): SettingDefinition {
    return {
      name: t("settings.item.resetToolbar.name"),
      desc: desc(t("settings.item.resetToolbar.desc")),
      // Nothing to put back while the toolbar cannot be arranged in the first place.
      visible: () => this.plugin.settings.toolbarEditEnabled,
      render: (setting: Setting) => {
        let armTimer: number | null = null;
        setting
          .setName(t("settings.item.resetToolbar.name"))
          .setDesc(desc(t("settings.item.resetToolbar.desc")))
          .addButton((btn) => {
            const disarm = () => {
              if (armTimer !== null) window.clearTimeout(armTimer);
              armTimer = null;
              btn.setButtonText(t("settings.item.resetToolbar.button"));
              btn.buttonEl.removeClass("mod-warning");
            };
            disarm();
            btn.onClick(async () => {
              if (armTimer === null) {
                btn.setButtonText(t("settings.item.resetToolbar.confirm"));
                btn.buttonEl.addClass("mod-warning");
                // Expires on its own so an abandoned confirm never lingers.
                armTimer = window.setTimeout(disarm, 3000);
                return;
              }
              disarm();
              this.plugin.settings.toolbarLayout = resolveToolbarLayout(undefined);
              await this.plugin.saveToolbarLayout();
              this.plugin.updateToolbarLayout();
            });
          });
      },
    };
  }

  // The description carries a link to the icon gallery, so the row is built by hand.
  // Shared by the post-button and update-button icon settings.
  private iconRow(key: "submitIcon" | "updateIcon"): SettingDefinition {
    const settings = this.plugin.settings;
    const template = t(`settings.item.${key}.desc`);

    const buildDesc = (): DocumentFragment =>
      createFragment((frag) => {
        const linkOpenIdx = template.indexOf("{linkOpen}");
        const linkCloseIdx = template.indexOf("{linkClose}");
        if (linkOpenIdx < 0 || linkCloseIdx <= linkOpenIdx) {
          appendWithBreaks(frag, template);
          return;
        }
        appendWithBreaks(frag, template.slice(0, linkOpenIdx));
        const link = frag.createEl("a", {
          // Without a class of our own the anchor inherits the muted description color and
          // stops reading as a link.
          cls: "wr-settings-link",
          text: template.slice(linkOpenIdx + "{linkOpen}".length, linkCloseIdx),
          href: t("settings.item.submitIcon.lucideUrl"),
        });
        link.setAttr("target", "_blank");
        link.setAttr("rel", "noopener");
        appendWithBreaks(frag, template.slice(linkCloseIdx + "{linkClose}".length));
      });

    return {
      name: t(`settings.item.${key}.name`),
      desc: buildDesc(),
      render: (setting: Setting) => {
        let field: TextComponent;
        // Lucide icon IDs are lowercase-only; this is an identifier, not UI prose.
        const iconNamePlaceholder = "send";
        setting
          .setName(t(`settings.item.${key}.name`))
          .setDesc(buildDesc())
          .setClass("wr-text-input-row")
          .addText((text) => {
            field = text;
            text
              .setPlaceholder(iconNamePlaceholder)
              .setValue(settings[key])
              .onChange(async (value) => {
                settings[key] = value.trim();
                await this.plugin.saveSettings();
                this.plugin.updateSubmitButton();
              });
          })
          .addExtraButton((btn) =>
            btn.setIcon("reset").onClick(async () => {
              settings[key] = DEFAULT_SETTINGS[key];
              await this.plugin.saveSettings();
              field.setValue(DEFAULT_SETTINGS[key]);
              this.plugin.updateSubmitButton();
            })
          );
      },
    };
  }

  // Per-tag overrides. The framework's list supplies the frame — the rule entries and the
  // add affordance — while each entry draws a whole rule in place: the lock, the colours,
  // and the scope rows that only appear once a sub colour is set are not expressible as
  // setting definitions.
  private tagRuleItems(): SettingDefinitionItem[] {
    return [
      {
        type: "group",
        heading: t("settings.section.tagrules"),
        items: [
          {
            name: t("settings.item.tagColorRules.name"),
            desc: desc(t("settings.item.tagColorRules.desc")),
            control: { type: "toggle", key: "tagColorRulesEnabled" },
          },
        ],
      },
      {
        type: "list",
        visible: () => this.plugin.settings.tagColorRulesEnabled,
        addItem: {
          name: t("settings.tagRule.button.add"),
          action: () => {
            void this.addRule();
          },
        },
        // Deletion stays on the rule's own bin icon, behind the lock: the list's built-in
        // delete would bypass that guard.
        items: Platform.isMobile ? this.ruleRows() : [...this.ruleRows(), this.desktopAddRow()],
      },
    ];
  }

  private ruleRows(): SettingDefinition[] {
    const rules = this.plugin.settings.tagColorRules;
    if (rules.length === 0) return [this.placeholderRuleRow()];

    return rules.map((rule, idx) => ({
      name: t("settings.tagRule.label", { n: idx + 1 }),
      searchable: false,
      render: (setting: Setting) => {
        this.renderRuleRow(setting, (host) => this.buildSavedRule(host, rule, idx, rules.length));
      },
    }));
  }

  private desktopAddRow(): SettingDefinition {
    return {
      name: t("settings.tagRule.button.add"),
      searchable: false,
      // Same classes as the framework's own mobile add row.
      render: (setting: Setting) => {
        setting.setName(t("settings.tagRule.button.add"));
        const rowEl = setting.settingEl;
        rowEl.addClass("mod-add-item", "mod-action", "tappable");
        // List rows may already carry an (empty) icon slot; reuse it rather than add a second.
        const iconEl =
          rowEl.querySelector<HTMLElement>(":scope > .setting-item-icon") ??
          rowEl.createDiv({ cls: "setting-item-icon", prepend: true });
        setIcon(iconEl, "lucide-plus");
        // The same element may be rendered into again on update; one click handler is enough.
        if (rowEl.dataset.wrAddRow) return;
        rowEl.dataset.wrAddRow = "1";
        rowEl.addEventListener("click", () => {
          void this.addRule();
        });
      },
    };
  }

  private renderRuleRow(setting: Setting, build: (host: HTMLElement) => void): void {
    const host = setting.settingEl;
    host.empty();
    host.removeClass("setting-item");
    host.addClass("wr-tag-rule-host");
    build(host);
  }

  private async addRule(): Promise<void> {
    const newIndex = this.plugin.settings.tagColorRules.length;
    this.plugin.settings.tagColorRules.push({
      tag: "",
      bgColor: DEFAULT_SETTINGS.bgColorLight,
      textColor: DEFAULT_SETTINGS.textColorLight,
    });
    // Only the new rule is left editable, so the settled ones stay protected.
    this.unlockedRules.clear();
    this.unlockedRules.add(newIndex);
    await this.plugin.saveTagRules();
    this.plugin.applyTagColorRules();
    this.update();
    // After the redraw: the new rule is the last group.
    window.requestAnimationFrame(() => {
      const groups = this.containerEl.querySelectorAll(".wr-tag-rule-group");
      groups[groups.length - 1]?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  private refreshQuickAddBtn(): void {
    setDisabled(this.quickAddBtnEl, this.unlockedRules.size > 0);
  }

  private buildSavedRule(
    host: HTMLElement,
    rule: TagColorRule,
    idx: number,
    ruleCount: number
  ): void {
    const trailing =
      ruleCount === 1
        ? {
            kind: "reset" as const,
            handler: async () => {
              rule.tag = "";
              rule.bgColor = this.defaultRuleBg();
              rule.textColor = this.defaultRuleText();
              delete rule.accentColor;
              delete rule.subColor;
              delete rule.subColorScope;
              delete rule.noIntegration;
              delete rule.hideFromTimeline;
              delete rule.protectFromDelete;
              await this.plugin.saveTagRules();
              this.plugin.applyTagColorRules();
              this.plugin.refreshAllWrDecorations();
              this.plugin.graphTags.rebuild();
              this.update();
            },
          }
        : {
            kind: "delete" as const,
            handler: async () => {
              this.plugin.settings.tagColorRules.splice(idx, 1);
              // Unlock state is keyed by position, which the splice shifts.
              this.unlockedRules.clear();
              await this.plugin.saveTagRules();
              // Rules are identified by position, so later rules' generated classes shift.
              this.plugin.applyTagColorRules();
              this.plugin.refreshAllWrDecorations();
              this.plugin.graphTags.rebuild();
              this.update();
            },
          };

    this.buildRuleGroup(host, {
      ruleNumber: idx + 1,
      ruleKey: idx,
      initial: rule,
      onTagChange: async (v) => {
        rule.tag = v;
        await this.plugin.saveTagRules();
        this.plugin.applyTagColorRules();
        this.plugin.refreshAllWrDecorations();
        // The excluded tag name may have changed; rebuild the graph injection.
        this.plugin.graphTags.rebuild();
      },
      onBgChange: async (v) => {
        rule.bgColor = v;
        await this.plugin.saveTagRules();
        this.plugin.applyTagColorRules();
      },
      onFgChange: async (v) => {
        rule.textColor = v;
        await this.plugin.saveTagRules();
        this.plugin.applyTagColorRules();
      },
      onAccentChange: async (v) => {
        if (v === undefined) delete rule.accentColor;
        else rule.accentColor = v;
        await this.plugin.saveTagRules();
        this.plugin.applyTagColorRules();
      },
      onSubChange: async (v) => {
        if (v === undefined) {
          delete rule.subColor;
          delete rule.subColorScope;
        } else {
          rule.subColor = v;
        }
        await this.plugin.saveTagRules();
        this.plugin.applyTagColorRules();
      },
      onScopeChange: async (key, value) => {
        const current = rule.subColorScope ?? { buttons: true, quote: true, list: true, ogp: true };
        current[key] = value;
        rule.subColorScope = current;
        await this.plugin.saveTagRules();
        this.plugin.applyTagColorRules();
      },
      onNoIntegrationChange: async (v) => {
        if (v) rule.noIntegration = true;
        else delete rule.noIntegration;
        await this.plugin.saveTagRules();
        this.plugin.graphTags.rebuild();
      },
      onHideFromTimelineChange: async (v) => {
        if (v) rule.hideFromTimeline = true;
        else delete rule.hideFromTimeline;
        await this.plugin.saveTagRules();
        // Only the timeline is affected; reading view and live preview stay as they are.
        this.plugin.refreshViews();
      },
      onProtectFromDeleteChange: async (v) => {
        if (v) rule.protectFromDelete = true;
        else delete rule.protectFromDelete;
        await this.plugin.saveTagRules();
        this.plugin.refreshViews();
      },
      trailing,
    });
  }

  // With no rules saved yet, a rule is shown anyway so the section is never empty.
  // It is only written to settings once the user actually changes something.
  private placeholderRuleRow(): SettingDefinition {
    return {
      name: t("settings.tagRule.label", { n: 1 }),
      searchable: false,
      render: (setting: Setting) => {
        this.renderRuleRow(setting, (host) => this.buildPlaceholderRule(host));
      },
    };
  }

  private buildPlaceholderRule(host: HTMLElement): void {
    const placeholderBg = this.defaultRuleBg();
    const placeholderText = this.defaultRuleText();
    const placeholder: TagColorRule = {
      tag: "",
      bgColor: placeholderBg,
      textColor: placeholderText,
    };

    const promoteIfNeeded = async () => {
      const touched =
        placeholder.tag.trim() !== "" ||
        placeholder.bgColor !== placeholderBg ||
        placeholder.textColor !== placeholderText ||
        placeholder.accentColor !== undefined ||
        placeholder.subColor !== undefined ||
        placeholder.noIntegration === true ||
        placeholder.hideFromTimeline === true ||
        placeholder.protectFromDelete === true;
      if (!touched) return;

      this.plugin.settings.tagColorRules.push({ ...placeholder });
      await this.plugin.saveTagRules();
      this.plugin.applyTagColorRules();
      this.plugin.refreshAllWrDecorations();
      this.plugin.graphTags.rebuild();
      this.update();
    };

    this.buildRuleGroup(host, {
      ruleNumber: 1,
      ruleKey: 0,
      initial: placeholder,
      onTagChange: async (v) => {
        placeholder.tag = v;
        await promoteIfNeeded();
      },
      onBgChange: async (v) => {
        placeholder.bgColor = v;
        await promoteIfNeeded();
      },
      onFgChange: async (v) => {
        placeholder.textColor = v;
        await promoteIfNeeded();
      },
      onAccentChange: async (v) => {
        if (v === undefined) delete placeholder.accentColor;
        else placeholder.accentColor = v;
        await promoteIfNeeded();
      },
      onSubChange: async (v) => {
        if (v === undefined) {
          delete placeholder.subColor;
          delete placeholder.subColorScope;
        } else {
          placeholder.subColor = v;
        }
        await promoteIfNeeded();
      },
      onScopeChange: async (key, value) => {
        const current = placeholder.subColorScope ?? {
          buttons: true,
          quote: true,
          list: true,
          ogp: true,
        };
        current[key] = value;
        placeholder.subColorScope = current;
        await promoteIfNeeded();
      },
      onNoIntegrationChange: async (v) => {
        if (v) placeholder.noIntegration = true;
        else delete placeholder.noIntegration;
        await promoteIfNeeded();
      },
      onHideFromTimelineChange: async (v) => {
        if (v) placeholder.hideFromTimeline = true;
        else delete placeholder.hideFromTimeline;
        await promoteIfNeeded();
      },
      onProtectFromDeleteChange: async (v) => {
        if (v) placeholder.protectFromDelete = true;
        else delete placeholder.protectFromDelete;
        await promoteIfNeeded();
      },
      trailing: null,
    });
  }

  private buildRuleGroup(host: HTMLElement, options: RuleGroupOptions): void {
    const {
      ruleNumber,
      ruleKey,
      initial,
      onTagChange,
      onBgChange,
      onFgChange,
      onAccentChange,
      onSubChange,
      onScopeChange,
      onNoIntegrationChange,
      onHideFromTimelineChange,
      onProtectFromDeleteChange,
      trailing,
    } = options;

    const groupEl = host.createDiv({ cls: "wr-tag-rule-group" });
    const isUnlocked = (): boolean => this.unlockedRules.has(ruleKey);

    const labelSetting = new Setting(groupEl)
      .setName(t("settings.tagRule.label", { n: ruleNumber }))
      .setClass("wr-tag-rule-label-setting");

    let lockBtnEl: HTMLElement | null = null;
    labelSetting.addExtraButton((btn) => {
      lockBtnEl = btn.extraSettingsEl;
      btn.setIcon(isUnlocked() ? "lock-keyhole-open" : "lock-keyhole").onClick(() => {
        if (isUnlocked()) this.unlockedRules.delete(ruleKey);
        else this.unlockedRules.add(ruleKey);
        applyLockState();
        this.refreshQuickAddBtn();
      });
    });

    let trailingBtnEl: HTMLElement | null = null;
    if (trailing) {
      labelSetting.addExtraButton((btn) => {
        trailingBtnEl = btn.extraSettingsEl;
        btn.setIcon(trailing.kind === "delete" ? "trash-2" : "reset").onClick(async () => {
          if (!isUnlocked()) return;
          await trailing.handler();
        });
      });
    }

    if (ruleNumber === 1 && Platform.isMobile && this.plugin.settings.tagColorRules.length >= 3) {
      labelSetting.addExtraButton((btn) => {
        this.quickAddBtnEl = btn.extraSettingsEl;
        btn.setIcon("plus").setTooltip(t("settings.tagRule.button.add")).onClick(() => {
          if (this.unlockedRules.size > 0) return;
          void this.addRule();
        });
      });
      this.refreshQuickAddBtn();
    } else if (ruleNumber === 1) {
      this.quickAddBtnEl = null;
    }

    let tagInputEl: HTMLInputElement | null = null;
    new Setting(groupEl)
      .setName(t("settings.tagRule.tag.name"))
      .setDesc(desc(t("settings.tagRule.tag.desc")))
      .setClass("wr-text-input-row")
      .addText((text) => {
        tagInputEl = text.inputEl;
        text
          .setPlaceholder(t("settings.tagRule.tag.placeholder"))
          .setValue(initial.tag)
          .onChange(async (v) => {
            await onTagChange(v.replace(/^#/, "").trim());
          });
      });

    let bgPickerEl: HTMLInputElement | null = null;
    new Setting(groupEl)
      .setName(t("settings.tagRule.bg.name"))
      .setDesc(desc(t("settings.tagRule.bg.desc")))
      .setClass("wr-reverse-controls")
      .addColorPicker((picker) => {
        bgPickerEl = pickerInputEl(picker);
        picker.setValue(this.resolveRuleBg(initial.bgColor)).onChange(async (v) => {
          await onBgChange(v);
          syncSubDefault();
        });
      });

    let fgPickerEl: HTMLInputElement | null = null;
    new Setting(groupEl)
      .setName(t("settings.tagRule.fg.name"))
      .setDesc(desc(t("settings.tagRule.fg.desc")))
      .setClass("wr-reverse-controls")
      .addColorPicker((picker) => {
        fgPickerEl = pickerInputEl(picker);
        picker.setValue(this.resolveRuleText(initial.textColor)).onChange(async (v) => {
          await onFgChange(v);
          syncSubDefault();
        });
      });

    let accentPicker: ColorComponent;
    let accentPickerEl: HTMLInputElement | null = null;
    let accentResetBtnEl: HTMLElement | null = null;
    new Setting(groupEl)
      .setName(t("settings.tagRule.accent.name"))
      .setDesc(desc(t("settings.tagRule.accent.desc")))
      .setClass("wr-reverse-controls")
      .addColorPicker((picker) => {
        accentPicker = picker;
        accentPickerEl = pickerInputEl(picker);
        const initialAccent =
          initial.accentColor && HEX_COLOR_RE.test(initial.accentColor)
            ? initial.accentColor
            : this.defaultAccent();
        picker.setValue(initialAccent).onChange(async (v) => {
          await onAccentChange(v);
        });
      })
      .addExtraButton((btn) => {
        accentResetBtnEl = btn.extraSettingsEl;
        btn.setIcon("reset").onClick(async () => {
          if (!isUnlocked()) return;
          await onAccentChange(undefined);
          accentPicker.setValue(this.defaultAccent());
        });
      });

    let subPicker: ColorComponent;
    let subPickerEl: HTMLInputElement | null = null;
    let subResetBtnEl: HTMLElement | null = null;
    let suppressSubChange = false;
    new Setting(groupEl)
      .setName(t("settings.tagRule.sub.name"))
      .setDesc(desc(t("settings.tagRule.sub.desc")))
      .setClass("wr-reverse-controls")
      .addColorPicker((picker) => {
        subPicker = picker;
        subPickerEl = pickerInputEl(picker);
        const initialSub = this.isSubCustomized(initial)
          ? (initial.subColor as string)
          : this.defaultSub(initial);
        picker.setValue(initialSub).onChange(async (v) => {
          if (suppressSubChange) return;
          await onSubChange(v);
          renderScope();
          applyLockState();
        });
      })
      .addExtraButton((btn) => {
        subResetBtnEl = btn.extraSettingsEl;
        btn.setIcon("reset").onClick(async () => {
          if (!isUnlocked()) return;
          await onSubChange(undefined);
          suppressSubChange = true;
          subPicker.setValue(this.defaultSub(initial));
          suppressSubChange = false;
          renderScope();
          applyLockState();
        });
      });

    const scopeContainer = groupEl.createDiv({ cls: "wr-sub-color-scope" });
    const scopeToggleEls: HTMLElement[] = [];

    let noIntegrationToggleEl: HTMLElement | null = null;
    if (this.plugin.settings.graphTagsEnabled) {
      new Setting(groupEl)
        .setName(t("settings.tagRule.noIntegration.name"))
        .setDesc(desc(t("settings.tagRule.noIntegration.desc")))
        .addToggle((tg) => {
          noIntegrationToggleEl = tg.toggleEl;
          tg.setValue(initial.noIntegration === true).onChange(async (v) => {
            await onNoIntegrationChange(v);
          });
        });
    }

    // Rendered last: changes what the timeline shows, not how it looks.
    let hideToggleEl: HTMLElement | null = null;
    new Setting(groupEl)
      .setName(t("settings.tagRule.hideTimeline.name"))
      .setDesc(desc(t("settings.tagRule.hideTimeline.desc")))
      .addToggle((tg) => {
        hideToggleEl = tg.toggleEl;
        tg.setValue(initial.hideFromTimeline === true).onChange(async (v) => {
          await onHideFromTimelineChange(v);
        });
      });

    // Only offered while the delete button exists at all; with no button to
    // disable, the row would be a rule about nothing.
    let protectToggleEl: HTMLElement | null = null;
    if (this.plugin.settings.showPostDelete) {
      new Setting(groupEl)
        .setName(t("settings.tagRule.protectDelete.name"))
        .setDesc(desc(t("settings.tagRule.protectDelete.desc")))
        .addToggle((tg) => {
          protectToggleEl = tg.toggleEl;
          tg.setValue(initial.protectFromDelete === true).onChange(async (v) => {
            await onProtectFromDeleteChange(v);
          });
        });
    }

    // While the sub colour is left at its default it is derived from the rule's text and
    // background, so editing either of those has to re-derive what the picker shows. A
    // customised sub colour is the user's own value and stays put.
    const syncSubDefault = (): void => {
      if (this.isSubCustomized(initial)) return;
      suppressSubChange = true;
      subPicker.setValue(this.defaultSub(initial));
      suppressSubChange = false;
    };

    const renderScope = () => {
      scopeContainer.empty();
      scopeToggleEls.length = 0;
      if (!this.isSubCustomized(initial)) return;

      const isOn = (key: keyof SubColorScope): boolean => initial.subColorScope?.[key] !== false;

      const groups: [keyof SubColorScope, string, string][] = [
        ["buttons", t("settings.tagRule.scope.buttons.name"), t("settings.tagRule.scope.buttons.desc")],
        ["quote", t("settings.tagRule.scope.quote.name"), t("settings.tagRule.scope.quote.desc")],
        ["list", t("settings.tagRule.scope.list.name"), t("settings.tagRule.scope.list.desc")],
        ["ogp", t("settings.tagRule.scope.ogp.name"), t("settings.tagRule.scope.ogp.desc")],
      ];

      for (const [key, name, desc] of groups) {
        new Setting(scopeContainer)
          .setName(name)
          .setDesc(desc)
          .addToggle((tg) => {
            scopeToggleEls.push(tg.toggleEl);
            tg.setValue(isOn(key)).onChange(async (v) => {
              await onScopeChange(key, v);
            });
          });
      }
    };

    const applyLockState = () => {
      const unlocked = isUnlocked();
      groupEl.toggleClass("wr-tag-rule-locked", !unlocked);
      setDisabled(tagInputEl, !unlocked);
      setDisabled(bgPickerEl, !unlocked);
      setDisabled(fgPickerEl, !unlocked);
      setDisabled(accentPickerEl, !unlocked);
      setDisabled(accentResetBtnEl, !unlocked);
      setDisabled(subPickerEl, !unlocked);
      setDisabled(subResetBtnEl, !unlocked);
      setDisabled(noIntegrationToggleEl, !unlocked);
      setDisabled(hideToggleEl, !unlocked);
      setDisabled(protectToggleEl, !unlocked);
      setDisabled(trailingBtnEl, !unlocked);
      for (const el of scopeToggleEls) setDisabled(el, !unlocked);
      if (lockBtnEl) {
        setIcon(lockBtnEl, unlocked ? "lock-keyhole-open" : "lock-keyhole");
      }
    };

    renderScope();
    applyLockState();
  }
}
