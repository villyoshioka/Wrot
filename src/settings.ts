import { App, ColorComponent, PluginSettingTab, Setting, TextComponent, setIcon } from "obsidian";
import type WrotPlugin from "./main";
import { t } from "./i18n";

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
}

export interface PinEntry {
  timestamp: string;
  file: string;
}

export type PinLimit = 1 | 3 | 5;

export interface WrotSettings {
  viewPlacement: "left" | "right" | "main";
  headerDateFormat: string;
  timestampFormat: string;
  bgColorLight: string;
  bgColorDark: string;
  textColorLight: string;
  textColorDark: string;
  submitLabel: string;
  submitIcon: string;
  inputPlaceholder: string;
  enableOgpFetch: boolean;
  checkStrikethrough: boolean;
  tagColorRulesEnabled: boolean;
  tagColorRules: TagColorRule[];
  followObsidianFontSize: boolean;
  showCalendarButton: boolean;
  calendarDayShape: "circle" | "rounded" | "square";
  pins: PinEntry[];
  pinLimit: PinLimit;
  zenMode: boolean;
  zenModePins: "hide" | "show";
  // 起動時に Obsidian の言語が変わったかを検知するための「前回保存時のロケール」記録。
  // 未設定（既存ユーザーで初出のとき）は loadSettings で現在ロケールを採用するだけで、リセットは走らせない。
  lastLocale?: string;
}

export const DEFAULT_SETTINGS: WrotSettings = {
  viewPlacement: "right",
  headerDateFormat: "YYYY年MM月DD日",
  timestampFormat: "YYYY/MM/DD HH:mm:ss",
  bgColorLight: "#efefef",
  bgColorDark: "#303030",
  textColorLight: "#454545",
  textColorDark: "#dcddde",
  submitLabel: "投稿",
  submitIcon: "send",
  inputPlaceholder: "あなたが書くのを待っています...",
  enableOgpFetch: true,
  checkStrikethrough: false,
  tagColorRulesEnabled: false,
  tagColorRules: [],
  followObsidianFontSize: false,
  showCalendarButton: true,
  calendarDayShape: "rounded",
  pins: [],
  pinLimit: 3,
  zenMode: false,
  zenModePins: "hide",
};

const SETTINGS_NARROW_THRESHOLD_PX = 600;

export class WrotSettingTab extends PluginSettingTab {
  plugin: WrotPlugin;
  private narrowObserver: ResizeObserver | null = null;
  // .setting-item の追加/削除を検知して状態クラスを再走査するための監視
  private settingItemObserver: MutationObserver | null = null;
  // メモリ上のみ。設定タブを開き直すたびに全ルールがロック状態に戻る
  private unlockedRules: Set<number> = new Set();
  // display()内部からの再構築でロック状態を保持したい場合にtrueにする
  private skipLockReset = false;

  constructor(app: App, plugin: WrotPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  hide(): void {
    if (this.narrowObserver) {
      this.narrowObserver.disconnect();
      this.narrowObserver = null;
    }
    if (this.settingItemObserver) {
      this.settingItemObserver.disconnect();
      this.settingItemObserver = null;
    }
    super.hide();
  }

  // CSS `:has()` 警告回避用: 各 .setting-item に「テキスト入力 / セレクトを含むか」の
  // 状態クラスを付与する。CSS 側は `:has(...)` の代わりに通常のクラスセレクタで判定する。
  private applySettingItemStateClasses(containerEl: HTMLElement): void {
    const items = containerEl.querySelectorAll<HTMLElement>(".setting-item");
    items.forEach((item) => {
      const hasTextInput = !!item.querySelector('.setting-item-control input[type="text"]');
      const hasSelect = !!item.querySelector(".setting-item-control select");
      item.toggleClass("wr-setting-has-text-input", hasTextInput);
      item.toggleClass("wr-setting-has-select", hasSelect);
    });
  }

  // Obsidianのバージョン/プラットフォーム差を吸収するためスクロール対象候補を網羅的に収集する
  private collectScrollCandidates(): HTMLElement[] {
    const list: HTMLElement[] = [];
    if (this.containerEl.scrollHeight > this.containerEl.clientHeight) {
      list.push(this.containerEl);
    }
    let el: HTMLElement | null = this.containerEl.parentElement;
    while (el) {
      const style = getComputedStyle(el);
      const overflowY = style.overflowY;
      const scrolls =
        (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
        el.scrollHeight > el.clientHeight;
      // overflowがvisibleでもscrollTopが0でない要素を拾う（WebView対策）
      if (scrolls || el.scrollTop > 0) {
        list.push(el);
      }
      el = el.parentElement;
      if (!el || el === activeDocument.body || el === activeDocument.documentElement) break;
    }
    return list;
  }

  // 設定タブのスクロール位置を保ったまま `work` を実行する
  private withScrollPreserved(work: () => void): void {
    const before = this.collectScrollCandidates().map((el) => ({ el, top: el.scrollTop }));
    work();
    const restore = () => {
      for (const { el, top } of before) {
        if (el.scrollTop !== top) el.scrollTop = top;
      }
    };
    // 同期/次フレーム/フォールバックの3段階で復元を試行
    restore();
    window.requestAnimationFrame(restore);
    window.setTimeout(restore, 0);
    window.setTimeout(restore, 50);
  }

  display(): void {
    this.render();
  }

  private render(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("wr-settings");

    // 設定タブの開き直し時はロック状態をリセット（内部再構築時はskipLockResetで保持）
    if (this.skipLockReset) {
      this.skipLockReset = false;
    } else {
      this.unlockedRules.clear();
    }

    if (this.narrowObserver) {
      this.narrowObserver.disconnect();
      this.narrowObserver = null;
    }
    if (this.settingItemObserver) {
      this.settingItemObserver.disconnect();
      this.settingItemObserver = null;
    }
    const updateNarrow = () => {
      const narrow = containerEl.clientWidth > 0 && containerEl.clientWidth < SETTINGS_NARROW_THRESHOLD_PX;
      containerEl.toggleClass("wr-settings-narrow", narrow);
      this.applySettingItemStateClasses(containerEl);
    };
    window.requestAnimationFrame(updateNarrow);
    if (typeof ResizeObserver !== "undefined") {
      this.narrowObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(updateNarrow);
      });
      this.narrowObserver.observe(containerEl);
    }
    // タグルール add/remove などの部分更新時にも .setting-item の状態クラスを追従させる
    if (typeof MutationObserver !== "undefined") {
      this.settingItemObserver = new MutationObserver(() => {
        this.applySettingItemStateClasses(containerEl);
      });
      this.settingItemObserver.observe(containerEl, { childList: true, subtree: true });
    }

    new Setting(containerEl).setName(t("settings.section.basic")).setHeading();

    new Setting(containerEl)
      .setName(t("settings.item.viewPlacement.name"))
      .setDesc(t("settings.item.viewPlacement.desc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("left", t("settings.option.viewPlacement.left"))
          .addOption("right", t("settings.option.viewPlacement.right"))
          .addOption("main", t("settings.option.viewPlacement.main"))
          .setValue(this.plugin.settings.viewPlacement)
          .onChange(async (value) => {
            this.plugin.settings.viewPlacement = value as WrotSettings["viewPlacement"];
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.item.followFontSize.name"))
      .setDesc(t("settings.item.followFontSize.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.followObsidianFontSize)
          .onChange(async (value) => {
            this.plugin.settings.followObsidianFontSize = value;
            await this.plugin.saveSettings();
            this.plugin.applyFontFollow();
          })
      );

    let headerDateText: TextComponent;
    new Setting(containerEl)
      .setName(t("settings.item.headerDateFormat.name"))
      .setDesc(t("settings.item.headerDateFormat.desc"))
      .addText((text) => {
        headerDateText = text;
        const localizedDefault = t("defaults.headerDateFormat");
        text
          .setPlaceholder(localizedDefault)
          .setValue(this.plugin.settings.headerDateFormat)
          .onChange(async (value) => {
            this.plugin.settings.headerDateFormat = value || localizedDefault;
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          });
      })
      .addExtraButton((btn) =>
        btn.setIcon("reset").setTooltip(t("settings.tooltip.resetDefault")).onClick(async () => {
          const localizedDefault = t("defaults.headerDateFormat");
          this.plugin.settings.headerDateFormat = localizedDefault;
          await this.plugin.saveSettings();
          this.plugin.refreshViews();
          headerDateText.setValue(localizedDefault);
        })
      );

    let tsText: TextComponent;
    new Setting(containerEl)
      .setName(t("settings.item.timestampFormat.name"))
      .setDesc(t("settings.item.timestampFormat.desc"))
      .addText((text) => {
        tsText = text;
        // 日付フォーマットのトークン例（大文字小文字に意味があるため表記を変えない）
        const tsFormatPlaceholder = "YYYY/MM/DD HH:mm:ss";
        text
          .setPlaceholder(tsFormatPlaceholder)
          .setValue(this.plugin.settings.timestampFormat)
          .onChange(async (value) => {
            this.plugin.settings.timestampFormat = value || DEFAULT_SETTINGS.timestampFormat;
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          });
      })
      .addExtraButton((btn) =>
        btn.setIcon("reset").setTooltip(t("settings.tooltip.resetDefault")).onClick(async () => {
          this.plugin.settings.timestampFormat = DEFAULT_SETTINGS.timestampFormat;
          await this.plugin.saveSettings();
          this.plugin.refreshViews();
          tsText.setValue(DEFAULT_SETTINGS.timestampFormat);
        })
      );

    let lightPicker: ColorComponent;
    new Setting(containerEl)
      .setName(t("settings.item.bgColorLight.name"))
      .setDesc(t("settings.item.bgColorLight.desc"))
      .setClass("wr-reverse-controls")
      .addColorPicker((picker) => {
        lightPicker = picker;
        picker
          .setValue(this.plugin.settings.bgColorLight)
          .onChange(async (value) => {
            this.plugin.settings.bgColorLight = value;
            await this.plugin.saveSettings();
            this.plugin.applyBgColor();
          });
      })
      .addExtraButton((btn) =>
        btn.setIcon("reset").setTooltip(t("settings.tooltip.resetDefault")).onClick(async () => {
          this.plugin.settings.bgColorLight = DEFAULT_SETTINGS.bgColorLight;
          await this.plugin.saveSettings();
          this.plugin.applyBgColor();
          lightPicker.setValue(DEFAULT_SETTINGS.bgColorLight);
        })
      );

    let textLightPicker: ColorComponent;
    new Setting(containerEl)
      .setName(t("settings.item.textColorLight.name"))
      .setDesc(t("settings.item.textColorLight.desc"))
      .setClass("wr-reverse-controls")
      .addColorPicker((picker) => {
        textLightPicker = picker;
        picker
          .setValue(this.plugin.settings.textColorLight)
          .onChange(async (value) => {
            this.plugin.settings.textColorLight = value;
            await this.plugin.saveSettings();
            this.plugin.applyBgColor();
          });
      })
      .addExtraButton((btn) =>
        btn.setIcon("reset").setTooltip(t("settings.tooltip.resetDefault")).onClick(async () => {
          this.plugin.settings.textColorLight = DEFAULT_SETTINGS.textColorLight;
          await this.plugin.saveSettings();
          this.plugin.applyBgColor();
          textLightPicker.setValue(DEFAULT_SETTINGS.textColorLight);
        })
      );

    let darkPicker: ColorComponent;
    new Setting(containerEl)
      .setName(t("settings.item.bgColorDark.name"))
      .setDesc(t("settings.item.bgColorDark.desc"))
      .setClass("wr-reverse-controls")
      .addColorPicker((picker) => {
        darkPicker = picker;
        picker
          .setValue(this.plugin.settings.bgColorDark)
          .onChange(async (value) => {
            this.plugin.settings.bgColorDark = value;
            await this.plugin.saveSettings();
            this.plugin.applyBgColor();
          });
      })
      .addExtraButton((btn) =>
        btn.setIcon("reset").setTooltip(t("settings.tooltip.resetDefault")).onClick(async () => {
          this.plugin.settings.bgColorDark = DEFAULT_SETTINGS.bgColorDark;
          await this.plugin.saveSettings();
          this.plugin.applyBgColor();
          darkPicker.setValue(DEFAULT_SETTINGS.bgColorDark);
        })
      );

    let textDarkPicker: ColorComponent;
    new Setting(containerEl)
      .setName(t("settings.item.textColorDark.name"))
      .setDesc(t("settings.item.textColorDark.desc"))
      .setClass("wr-reverse-controls")
      .addColorPicker((picker) => {
        textDarkPicker = picker;
        picker
          .setValue(this.plugin.settings.textColorDark)
          .onChange(async (value) => {
            this.plugin.settings.textColorDark = value;
            await this.plugin.saveSettings();
            this.plugin.applyBgColor();
          });
      })
      .addExtraButton((btn) =>
        btn.setIcon("reset").setTooltip(t("settings.tooltip.resetDefault")).onClick(async () => {
          this.plugin.settings.textColorDark = DEFAULT_SETTINGS.textColorDark;
          await this.plugin.saveSettings();
          this.plugin.applyBgColor();
          textDarkPicker.setValue(DEFAULT_SETTINGS.textColorDark);
        })
      );

    new Setting(containerEl).setName(t("settings.section.display")).setHeading();

    let submitText: TextComponent;
    new Setting(containerEl)
      .setName(t("settings.item.submitLabel.name"))
      .setDesc(t("settings.item.submitLabel.desc"))
      .addText((text) => {
        submitText = text;
        const localizedDefault = t("defaults.submitLabel");
        text
          .setPlaceholder(localizedDefault)
          .setValue(this.plugin.settings.submitLabel)
          .onChange(async (value) => {
            this.plugin.settings.submitLabel = value || localizedDefault;
            await this.plugin.saveSettings();
            this.plugin.updateSubmitLabel();
          });
      })
      .addExtraButton((btn) =>
        btn.setIcon("reset").setTooltip(t("settings.tooltip.resetDefault")).onClick(async () => {
          const localizedDefault = t("defaults.submitLabel");
          this.plugin.settings.submitLabel = localizedDefault;
          await this.plugin.saveSettings();
          submitText.setValue(localizedDefault);
          this.plugin.updateSubmitLabel();
        })
      );

    let iconText: TextComponent;
    const iconSetting = new Setting(containerEl)
      .setName(t("settings.item.submitIcon.name"));
    const descEl = iconSetting.descEl;
    // 「{linkOpen}こちら{linkClose}」を中央のアンカー要素に置き換えて挿入する
    const descTemplate = t("settings.item.submitIcon.desc");
    const linkOpenIdx = descTemplate.indexOf("{linkOpen}");
    const linkCloseIdx = descTemplate.indexOf("{linkClose}");
    if (linkOpenIdx >= 0 && linkCloseIdx > linkOpenIdx) {
      const prefix = descTemplate.slice(0, linkOpenIdx);
      const linkText = descTemplate.slice(linkOpenIdx + "{linkOpen}".length, linkCloseIdx);
      const suffix = descTemplate.slice(linkCloseIdx + "{linkClose}".length);
      descEl.appendText(prefix);
      const link = descEl.createEl("a", { text: linkText, href: t("settings.item.submitIcon.lucideUrl") });
      link.setAttr("target", "_blank");
      descEl.appendText(suffix);
    } else {
      // プレースホルダが含まれない辞書のときは素のテキストとして表示
      descEl.appendText(descTemplate);
    }
    iconSetting
      .addText((text) => {
        iconText = text;
        // Lucide アイコンID（小文字固定のため表記を変えない）
        const iconNamePlaceholder = "send";
        text
          .setPlaceholder(iconNamePlaceholder)
          .setValue(this.plugin.settings.submitIcon)
          .onChange(async (value) => {
            this.plugin.settings.submitIcon = value.trim();
            await this.plugin.saveSettings();
            this.plugin.updateSubmitIcon();
          });
      })
      .addExtraButton((btn) =>
        btn.setIcon("reset").setTooltip(t("settings.tooltip.resetDefault")).onClick(async () => {
          this.plugin.settings.submitIcon = DEFAULT_SETTINGS.submitIcon;
          await this.plugin.saveSettings();
          iconText.setValue(DEFAULT_SETTINGS.submitIcon);
          this.plugin.updateSubmitIcon();
        })
      );

    let placeholderText: TextComponent;
    new Setting(containerEl)
      .setName(t("settings.item.inputPlaceholder.name"))
      .setDesc(t("settings.item.inputPlaceholder.desc"))
      .addText((text) => {
        placeholderText = text;
        const localizedDefault = t("defaults.inputPlaceholder");
        text
          .setPlaceholder(localizedDefault)
          .setValue(this.plugin.settings.inputPlaceholder)
          .onChange(async (value) => {
            this.plugin.settings.inputPlaceholder = value;
            await this.plugin.saveSettings();
            this.plugin.updateInputPlaceholder();
          });
      })
      .addExtraButton((btn) =>
        btn.setIcon("reset").setTooltip(t("settings.tooltip.resetDefault")).onClick(async () => {
          const localizedDefault = t("defaults.inputPlaceholder");
          this.plugin.settings.inputPlaceholder = localizedDefault;
          await this.plugin.saveSettings();
          placeholderText.setValue(localizedDefault);
          this.plugin.updateInputPlaceholder();
        })
      );

    new Setting(containerEl)
      .setName(t("settings.item.pinLimit.name"))
      .setDesc(t("settings.item.pinLimit.desc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("1", t("settings.option.pinLimit.1"))
          .addOption("3", t("settings.option.pinLimit.3"))
          .addOption("5", t("settings.option.pinLimit.5"))
          .setValue(String(this.plugin.settings.pinLimit))
          .onChange(async (value) => {
            const limit = Number(value) as PinLimit;
            this.plugin.settings.pinLimit = limit;
            if (this.plugin.settings.pins.length > limit) {
              this.plugin.settings.pins = this.plugin.settings.pins.slice(0, limit);
            }
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.item.ogp.name"))
      .setDesc(t("settings.item.ogp.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableOgpFetch)
          .onChange(async (value) => {
            this.plugin.settings.enableOgpFetch = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.item.checkStrikethrough.name"))
      .setDesc(t("settings.item.checkStrikethrough.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.checkStrikethrough)
          .onChange(async (value) => {
            this.plugin.settings.checkStrikethrough = value;
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          })
      );

    let calendarDayShapeSetting: Setting;

    new Setting(containerEl)
      .setName(t("settings.item.showCalendarButton.name"))
      .setDesc(t("settings.item.showCalendarButton.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showCalendarButton)
          .onChange(async (value) => {
            this.plugin.settings.showCalendarButton = value;
            await this.plugin.saveSettings();
            this.plugin.updateCalendarButton();
            calendarDayShapeSetting.settingEl.toggle(value);
          })
      );

    calendarDayShapeSetting = new Setting(containerEl)
      .setName(t("settings.item.calendarDayShape.name"))
      .setDesc(t("settings.item.calendarDayShape.desc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("circle", t("settings.option.calendarDayShape.circle"))
          .addOption("rounded", t("settings.option.calendarDayShape.rounded"))
          .addOption("square", t("settings.option.calendarDayShape.square"))
          .setValue(this.plugin.settings.calendarDayShape)
          .onChange(async (value) => {
            this.plugin.settings.calendarDayShape = value as WrotSettings["calendarDayShape"];
            await this.plugin.saveSettings();
            this.plugin.applyCalendarDayShape();
          })
      )
    calendarDayShapeSetting.settingEl.toggle(this.plugin.settings.showCalendarButton);

    new Setting(containerEl)
      .setName(t("settings.item.zenModePins.name"))
      .setDesc(t("settings.item.zenModePins.desc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("hide", t("settings.option.zenModePins.hide"))
          .addOption("show", t("settings.option.zenModePins.show"))
          .setValue(this.plugin.settings.zenModePins)
          .onChange(async (value) => {
            this.plugin.settings.zenModePins = value as WrotSettings["zenModePins"];
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          })
      );

    new Setting(containerEl).setName(t("settings.section.tagrules")).setHeading();

    new Setting(containerEl)
      .setName(t("settings.item.tagColorRules.name"))
      .setDesc(t("settings.item.tagColorRules.desc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.tagColorRulesEnabled).onChange(async (v) => {
          this.plugin.settings.tagColorRulesEnabled = v;
          await this.plugin.saveSettings();
          this.plugin.applyTagColorRules();
          this.plugin.refreshAllWrDecorations();
          // ルールが実質空の状態で機能をオンにしたら、最初のルールをアンロックして即編集可能にする
          const rules = this.plugin.settings.tagColorRules;
          const noMeaningfulRule =
            rules.length === 0 || (rules.length === 1 && rules[0].tag.trim() === "");
          if (v && noMeaningfulRule) {
            this.unlockedRules.add(0);
          }
          // ルールブロックの表示/非表示を切り替えるため設定タブ全体を再構築
          this.skipLockReset = true;
          this.withScrollPreserved(() => this.render());
        })
      );

    const rulesContainer = containerEl.createDiv({ cls: "wr-tag-rules-container" });
    const addBtnContainer = containerEl.createDiv();

    const renderRulesInner = () => {
      rulesContainer.empty();
      addBtnContainer.empty();

      if (!this.plugin.settings.tagColorRulesEnabled) return;

      const isDarkTheme = (): boolean => activeDocument.body.classList.contains("theme-dark");
      const getDefaultBg = (): string =>
        isDarkTheme() ? this.plugin.settings.bgColorDark : this.plugin.settings.bgColorLight;
      const getDefaultText = (): string =>
        isDarkTheme() ? this.plugin.settings.textColorDark : this.plugin.settings.textColorLight;

      const isLightDefaultBg = (v: string): boolean => v === DEFAULT_SETTINGS.bgColorLight;
      const isLightDefaultText = (v: string): boolean => v === DEFAULT_SETTINGS.textColorLight;
      const resolveRuleBg = (v: string): string =>
        /^#[0-9a-fA-F]{6}$/.test(v) && !(isDarkTheme() && isLightDefaultBg(v)) ? v : getDefaultBg();
      const resolveRuleText = (v: string): string =>
        /^#[0-9a-fA-F]{6}$/.test(v) && !(isDarkTheme() && isLightDefaultText(v)) ? v : getDefaultText();

      const getDefaultAccent = (): string => {
        const raw = getComputedStyle(activeDocument.body).getPropertyValue("--text-accent").trim();
        if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
        const probe = activeDocument.createElement("div");
        probe.setCssStyles({ color: raw || "var(--text-accent)", display: "none" });
        activeDocument.body.appendChild(probe);
        const resolved = getComputedStyle(probe).color;
        activeDocument.body.removeChild(probe);
        const m = resolved.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) {
          const toHex = (n: string) => parseInt(n, 10).toString(16).padStart(2, "0");
          return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`;
        }
        return getDefaultText();
      };

      const getDefaultSub = (rule: TagColorRule): string => {
        const fg = resolveRuleText(rule.textColor);
        const bg = resolveRuleBg(rule.bgColor);
        return this.plugin.blendColor(fg, bg, 0.45);
      };

      const buildRuleGroup = (
        isFirst: boolean,
        ruleNumber: number,
        ruleKey: number,
        initial: TagColorRule,
        onTagChange: (v: string) => Promise<void>,
        onBgChange: (v: string) => Promise<void>,
        onFgChange: (v: string) => Promise<void>,
        onAccentChange: (v: string | undefined) => Promise<void>,
        onSubChange: (v: string | undefined) => Promise<void>,
        onScopeChange: (key: keyof SubColorScope, value: boolean) => Promise<void>,
        trailing: { kind: "delete"; handler: () => Promise<void> } | { kind: "reset"; handler: () => Promise<void> } | null
      ) => {
        if (!isFirst) {
          rulesContainer.createEl("hr", { cls: "wr-tag-rule-separator" });
        }

        const groupEl = rulesContainer.createDiv({ cls: "wr-tag-rule-group" });

        const isUnlocked = (): boolean => this.unlockedRules.has(ruleKey);

        const labelSetting = new Setting(groupEl)
          .setName(t("settings.tagRule.label", { n: ruleNumber }))
          .setClass("wr-tag-rule-label-setting");

        // ルールラベル右の鍵アイコン。タップでロック/アンロックを切り替え（メモリ上のみ）
        let lockBtnEl: HTMLElement | null = null;
        labelSetting.addExtraButton((btn) => {
          lockBtnEl = btn.extraSettingsEl;
          btn
            .setIcon(isUnlocked() ? "lock-keyhole-open" : "lock-keyhole")
            .setTooltip(isUnlocked() ? t("settings.tooltip.lock") : t("settings.tooltip.unlock"))
            .onClick(() => {
              if (isUnlocked()) {
                this.unlockedRules.delete(ruleKey);
              } else {
                this.unlockedRules.add(ruleKey);
              }
              applyLockState();
            });
        });

        let trailingBtnEl: HTMLElement | null = null;
        if (trailing) {
          labelSetting.addExtraButton((btn) => {
            trailingBtnEl = btn.extraSettingsEl;
            btn
              .setIcon(trailing.kind === "delete" ? "trash-2" : "reset")
              .setTooltip(trailing.kind === "delete" ? t("settings.tooltip.deleteRule") : t("settings.tooltip.resetDefault"))
              .onClick(async () => {
                if (!isUnlocked()) return;
                await trailing.handler();
              });
          });
        }

        let tagInputEl: HTMLInputElement | null = null;
        new Setting(groupEl)
          .setName(t("settings.tagRule.tag.name"))
          .setDesc(t("settings.tagRule.tag.desc"))
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
          .setDesc(t("settings.tagRule.bg.desc"))
          .setClass("wr-reverse-controls")
          .addColorPicker((picker) => {
            bgPickerEl = (picker as unknown as { colorPickerEl: HTMLInputElement }).colorPickerEl;
            picker
              .setValue(resolveRuleBg(initial.bgColor))
              .onChange(async (v) => { await onBgChange(v); });
          });

        let fgPickerEl: HTMLInputElement | null = null;
        new Setting(groupEl)
          .setName(t("settings.tagRule.fg.name"))
          .setDesc(t("settings.tagRule.fg.desc"))
          .setClass("wr-reverse-controls")
          .addColorPicker((picker) => {
            fgPickerEl = (picker as unknown as { colorPickerEl: HTMLInputElement }).colorPickerEl;
            picker
              .setValue(resolveRuleText(initial.textColor))
              .onChange(async (v) => { await onFgChange(v); });
          });

        let accentPicker: ColorComponent;
        let accentPickerEl: HTMLInputElement | null = null;
        let accentResetBtnEl: HTMLElement | null = null;
        new Setting(groupEl)
          .setName(t("settings.tagRule.accent.name"))
          .setDesc(t("settings.tagRule.accent.desc"))
          .setClass("wr-reverse-controls")
          .addColorPicker((picker) => {
            accentPicker = picker;
            accentPickerEl = (picker as unknown as { colorPickerEl: HTMLInputElement }).colorPickerEl;
            const initialAccent =
              initial.accentColor && /^#[0-9a-fA-F]{6}$/.test(initial.accentColor)
                ? initial.accentColor
                : getDefaultAccent();
            picker
              .setValue(initialAccent)
              .onChange(async (v) => { await onAccentChange(v); });
          })
          .addExtraButton((btn) => {
            accentResetBtnEl = btn.extraSettingsEl;
            btn.setIcon("reset").setTooltip(t("settings.tooltip.resetDefault")).onClick(async () => {
              if (!isUnlocked()) return;
              await onAccentChange(undefined);
              accentPicker.setValue(getDefaultAccent());
            });
          });

        let subPicker: ColorComponent;
        let subPickerEl: HTMLInputElement | null = null;
        let subResetBtnEl: HTMLElement | null = null;
        let suppressSubChange = false;
        new Setting(groupEl)
          .setName(t("settings.tagRule.sub.name"))
          .setDesc(t("settings.tagRule.sub.desc"))
          .setClass("wr-reverse-controls")
          .addColorPicker((picker) => {
            subPicker = picker;
            subPickerEl = (picker as unknown as { colorPickerEl: HTMLInputElement }).colorPickerEl;
            const initialSub =
              initial.subColor && /^#[0-9a-fA-F]{6}$/.test(initial.subColor)
                ? initial.subColor
                : getDefaultSub(initial);
            picker
              .setValue(initialSub)
              .onChange(async (v) => {
                if (suppressSubChange) return;
                await onSubChange(v);
                renderScope();
                applyLockState();
              });
          })
          .addExtraButton((btn) => {
            subResetBtnEl = btn.extraSettingsEl;
            btn.setIcon("reset").setTooltip(t("settings.tooltip.resetDefault")).onClick(async () => {
              if (!isUnlocked()) return;
              await onSubChange(undefined);
              suppressSubChange = true;
              subPicker.setValue(getDefaultSub(initial));
              suppressSubChange = false;
              renderScope();
              applyLockState();
            });
          });

        const scopeContainer = groupEl.createDiv({ cls: "wr-sub-color-scope" });
        const scopeToggleEls: HTMLElement[] = [];

        const isSubCustomized = (): boolean =>
          !!initial.subColor && /^#[0-9a-fA-F]{6}$/.test(initial.subColor);

        const renderScope = () => {
          scopeContainer.empty();
          scopeToggleEls.length = 0;
          if (!isSubCustomized()) return;

          const isOn = (key: keyof SubColorScope): boolean => {
            const s = initial.subColorScope;
            if (!s) return true;
            return s[key] !== false;
          };

          const groups: Array<[keyof SubColorScope, string, string]> = [
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

        const setDisabled = (el: HTMLElement | null, disabled: boolean) => {
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
          setDisabled(trailingBtnEl, !unlocked);
          for (const el of scopeToggleEls) setDisabled(el, !unlocked);
          if (lockBtnEl) {
            setIcon(lockBtnEl, unlocked ? "lock-keyhole-open" : "lock-keyhole");
            lockBtnEl.setAttr(
              "aria-label",
              unlocked ? t("settings.tooltip.lock") : t("settings.tooltip.unlock")
            );
          }
        };

        renderScope();
        applyLockState();
      };

      const isEmpty = this.plugin.settings.tagColorRules.length === 0;

      if (isEmpty) {
        const placeholderBg = getDefaultBg();
        const placeholderText = getDefaultText();
        const placeholder: TagColorRule = {
          tag: "",
          bgColor: placeholderBg,
          textColor: placeholderText,
        };
        const promoteIfNeeded = async () => {
          const hasTag = placeholder.tag.trim() !== "";
          const bgChanged = placeholder.bgColor !== placeholderBg;
          const fgChanged = placeholder.textColor !== placeholderText;
          const accentChanged = placeholder.accentColor !== undefined;
          const subChanged = placeholder.subColor !== undefined;
          if (hasTag || bgChanged || fgChanged || accentChanged || subChanged) {
            this.plugin.settings.tagColorRules.push({ ...placeholder });
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
            this.plugin.refreshAllWrDecorations();
            renderRules();
          }
        };

        buildRuleGroup(
          true,
          1,
          0,
          placeholder,
          async (v) => { placeholder.tag = v; await promoteIfNeeded(); },
          async (v) => { placeholder.bgColor = v; await promoteIfNeeded(); },
          async (v) => { placeholder.textColor = v; await promoteIfNeeded(); },
          async (v) => {
            if (v === undefined) delete placeholder.accentColor;
            else placeholder.accentColor = v;
            await promoteIfNeeded();
          },
          async (v) => {
            if (v === undefined) {
              delete placeholder.subColor;
              delete placeholder.subColorScope;
            } else {
              placeholder.subColor = v;
            }
            await promoteIfNeeded();
          },
          async (key, value) => {
            const current = placeholder.subColorScope ?? {
              buttons: true, quote: true, list: true, ogp: true,
            };
            current[key] = value;
            placeholder.subColorScope = current;
            await promoteIfNeeded();
          },
          null,
        );

        addBtnContainer.empty();
        return;
      }

      const ruleCount = this.plugin.settings.tagColorRules.length;
      this.plugin.settings.tagColorRules.forEach((rule, idx) => {
        const trailing =
          ruleCount === 1
            ? {
                kind: "reset" as const,
                handler: async () => {
                  rule.tag = "";
                  rule.bgColor = getDefaultBg();
                  rule.textColor = getDefaultText();
                  delete rule.accentColor;
                  delete rule.subColor;
                  delete rule.subColorScope;
                  await this.plugin.saveSettings();
                  this.plugin.applyTagColorRules();
                  this.plugin.refreshAllWrDecorations();
                  renderRules();
                },
              }
            : {
                kind: "delete" as const,
                handler: async () => {
                  this.plugin.settings.tagColorRules.splice(idx, 1);
                  await this.plugin.saveSettings();
                  this.plugin.applyTagColorRules();
                  this.plugin.refreshAllWrDecorations();
                  renderRules();
                },
              };
        buildRuleGroup(
          idx === 0,
          idx + 1,
          idx,
          rule,
          async (v) => {
            rule.tag = v;
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
            this.plugin.refreshAllWrDecorations();
          },
          async (v) => {
            rule.bgColor = v;
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
          },
          async (v) => {
            rule.textColor = v;
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
          },
          async (v) => {
            if (v === undefined) {
              delete rule.accentColor;
            } else {
              rule.accentColor = v;
            }
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
          },
          async (v) => {
            if (v === undefined) {
              delete rule.subColor;
              delete rule.subColorScope;
            } else {
              rule.subColor = v;
            }
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
          },
          async (key, value) => {
            const current = rule.subColorScope ?? {
              buttons: true, quote: true, list: true, ogp: true,
            };
            current[key] = value;
            rule.subColorScope = current;
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
          },
          trailing,
        );
      });

      addBtnContainer.empty();
      new Setting(addBtnContainer).addButton((btn) =>
        btn
          .setButtonText(t("settings.tagRule.button.add"))
          .setCta()
          .onClick(async () => {
            const newIndex = this.plugin.settings.tagColorRules.length;
            this.plugin.settings.tagColorRules.push({
              tag: "",
              bgColor: DEFAULT_SETTINGS.bgColorLight,
              textColor: DEFAULT_SETTINGS.textColorLight,
            });
            // 新規ルールを追加したら既存ルールはロックし直し、新ルールだけアンロック状態にする
            this.unlockedRules.clear();
            this.unlockedRules.add(newIndex);
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
            renderRules();
          })
      );
    };

    const renderRules = () => {
      this.withScrollPreserved(() => renderRulesInner());
    };

    renderRulesInner();
  }
}
