import { App, ColorComponent, PluginSettingTab, Setting, TextComponent } from "obsidian";
import type WrotPlugin from "./main";

export interface TagColorRule {
  tag: string;
  bgColor: string;
  textColor: string;
  accentColor?: string;
}

export interface PinEntry {
  timestamp: string;
  file: string;
}

export type PinLimit = 1 | 3 | 5;

export interface WrotSettings {
  viewPlacement: "left" | "right" | "main";
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
  pins: PinEntry[];
  pinLimit: PinLimit;
}

export const DEFAULT_SETTINGS: WrotSettings = {
  viewPlacement: "right",
  timestampFormat: "YYYY/MM/DD HH:mm:ss",
  bgColorLight: "#f0efeb",
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
  pins: [],
  pinLimit: 3,
};

const SETTINGS_NARROW_THRESHOLD_PX = 600;

export class WrotSettingTab extends PluginSettingTab {
  plugin: WrotPlugin;
  private narrowObserver: ResizeObserver | null = null;

  constructor(app: App, plugin: WrotPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  hide(): void {
    if (this.narrowObserver) {
      this.narrowObserver.disconnect();
      this.narrowObserver = null;
    }
    super.hide();
  }

  /** Collect all scrollable ancestors of containerEl. Different Obsidian
   * versions/platforms put scroll on different elements (`.modal-content`,
   * `.vertical-tab-content`, the tab's own containerEl, etc.), so we track
   * every candidate and restore whichever one actually moved. */
  private collectScrollCandidates(): HTMLElement[] {
    const list: HTMLElement[] = [];
    // Include containerEl itself — some Obsidian builds scroll it directly.
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
      // Also include elements whose scrollTop is already non-zero even if
      // computed overflow is visible (some WebViews report it that way).
      if (scrolls || el.scrollTop > 0) {
        list.push(el);
      }
      el = el.parentElement;
      if (!el || el === document.body || el === document.documentElement) break;
    }
    return list;
  }

  /** Run `work` while preserving the settings scroll position. */
  private withScrollPreserved(work: () => void): void {
    const before = this.collectScrollCandidates().map((el) => ({ el, top: el.scrollTop }));
    work();
    const restore = () => {
      for (const { el, top } of before) {
        if (el.scrollTop !== top) el.scrollTop = top;
      }
    };
    // Multiple restore attempts — synchronous, next frame, and a fallback tick.
    restore();
    requestAnimationFrame(restore);
    setTimeout(restore, 0);
    setTimeout(restore, 50);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("wr-settings");

    if (this.narrowObserver) {
      this.narrowObserver.disconnect();
      this.narrowObserver = null;
    }
    const updateNarrow = () => {
      const narrow = containerEl.clientWidth > 0 && containerEl.clientWidth < SETTINGS_NARROW_THRESHOLD_PX;
      containerEl.toggleClass("wr-settings-narrow", narrow);
    };
    requestAnimationFrame(updateNarrow);
    if (typeof ResizeObserver !== "undefined") {
      this.narrowObserver = new ResizeObserver(() => {
        requestAnimationFrame(updateNarrow);
      });
      this.narrowObserver.observe(containerEl);
    }

    new Setting(containerEl).setName("基本設定").setHeading();

    new Setting(containerEl)
      .setName("表示位置")
      .setDesc("Wrotパネルの表示位置を選びます。")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("left", "左サイドバー")
          .addOption("right", "右サイドバー")
          .addOption("main", "メインエリア")
          .setValue(this.plugin.settings.viewPlacement)
          .onChange(async (value) => {
            this.plugin.settings.viewPlacement = value as WrotSettings["viewPlacement"];
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Obsidianのフォントサイズに追従")
      .setDesc("Obsidianの外観設定にWrotの文字サイズを合わせます。")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.followObsidianFontSize)
          .onChange(async (value) => {
            this.plugin.settings.followObsidianFontSize = value;
            await this.plugin.saveSettings();
            this.plugin.applyFontFollow();
          })
      );

    let tsText: TextComponent;
    new Setting(containerEl)
      .setName("タイムスタンプ表示形式")
      .setDesc("投稿の日時フォーマットを指定します。（YYYY, MM, DD, HH, mm, ss が使えます）")
      .addText((text) => {
        tsText = text;
        text
          .setPlaceholder("YYYY/MM/DD HH:mm:ss")
          .setValue(this.plugin.settings.timestampFormat)
          .onChange(async (value) => {
            this.plugin.settings.timestampFormat = value || DEFAULT_SETTINGS.timestampFormat;
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          });
      })
      .addExtraButton((btn) =>
        btn.setIcon("reset").setTooltip("初期値に戻す").onClick(async () => {
          this.plugin.settings.timestampFormat = DEFAULT_SETTINGS.timestampFormat;
          await this.plugin.saveSettings();
          this.plugin.refreshViews();
          tsText.setValue(DEFAULT_SETTINGS.timestampFormat);
        })
      );

    let lightPicker: ColorComponent;
    new Setting(containerEl)
      .setName("背景色（ライトモード）")
      .setDesc("ライトテーマでの投稿・投稿フォームの背景色を設定します。")
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
        btn.setIcon("reset").setTooltip("初期値に戻す").onClick(async () => {
          this.plugin.settings.bgColorLight = DEFAULT_SETTINGS.bgColorLight;
          await this.plugin.saveSettings();
          this.plugin.applyBgColor();
          lightPicker.setValue(DEFAULT_SETTINGS.bgColorLight);
        })
      );

    let textLightPicker: ColorComponent;
    new Setting(containerEl)
      .setName("文字色（ライトモード）")
      .setDesc("ライトテーマでのテキスト・アイコンの色を設定します。")
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
        btn.setIcon("reset").setTooltip("初期値に戻す").onClick(async () => {
          this.plugin.settings.textColorLight = DEFAULT_SETTINGS.textColorLight;
          await this.plugin.saveSettings();
          this.plugin.applyBgColor();
          textLightPicker.setValue(DEFAULT_SETTINGS.textColorLight);
        })
      );

    let darkPicker: ColorComponent;
    new Setting(containerEl)
      .setName("背景色（ダークモード）")
      .setDesc("ダークテーマでの投稿・投稿フォームの背景色を設定します。")
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
        btn.setIcon("reset").setTooltip("初期値に戻す").onClick(async () => {
          this.plugin.settings.bgColorDark = DEFAULT_SETTINGS.bgColorDark;
          await this.plugin.saveSettings();
          this.plugin.applyBgColor();
          darkPicker.setValue(DEFAULT_SETTINGS.bgColorDark);
        })
      );

    let textDarkPicker: ColorComponent;
    new Setting(containerEl)
      .setName("文字色（ダークモード）")
      .setDesc("ダークテーマでのテキスト・アイコンの色を設定します。")
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
        btn.setIcon("reset").setTooltip("初期値に戻す").onClick(async () => {
          this.plugin.settings.textColorDark = DEFAULT_SETTINGS.textColorDark;
          await this.plugin.saveSettings();
          this.plugin.applyBgColor();
          textDarkPicker.setValue(DEFAULT_SETTINGS.textColorDark);
        })
      );

    new Setting(containerEl).setName("表示設定").setHeading();

    let submitText: TextComponent;
    new Setting(containerEl)
      .setName("投稿ボタンのテキスト")
      .setDesc("投稿ボタンに表示するテキストを変更できます。")
      .addText((text) => {
        submitText = text;
        text
          .setPlaceholder("投稿")
          .setValue(this.plugin.settings.submitLabel)
          .onChange(async (value) => {
            this.plugin.settings.submitLabel = value || DEFAULT_SETTINGS.submitLabel;
            await this.plugin.saveSettings();
            this.plugin.updateSubmitLabel();
          });
      })
      .addExtraButton((btn) =>
        btn.setIcon("reset").setTooltip("初期値に戻す").onClick(async () => {
          this.plugin.settings.submitLabel = DEFAULT_SETTINGS.submitLabel;
          await this.plugin.saveSettings();
          submitText.setValue(DEFAULT_SETTINGS.submitLabel);
          this.plugin.updateSubmitLabel();
        })
      );

    let iconText: TextComponent;
    const iconSetting = new Setting(containerEl)
      .setName("投稿ボタンのアイコン");
    const descEl = iconSetting.descEl;
    descEl.appendText("投稿ボタンのアイコンを変更できます。アイコン名は ");
    const link = descEl.createEl("a", { text: "こちら", href: "https://lucide.dev/icons/" });
    link.setAttr("target", "_blank");
    descEl.appendText(" からコピーしてください。空欄にするとアイコンを非表示にできます。");
    iconSetting
      .addText((text) => {
        iconText = text;
        text
          .setPlaceholder("send")
          .setValue(this.plugin.settings.submitIcon)
          .onChange(async (value) => {
            this.plugin.settings.submitIcon = value.trim();
            await this.plugin.saveSettings();
            this.plugin.updateSubmitIcon();
          });
      })
      .addExtraButton((btn) =>
        btn.setIcon("reset").setTooltip("初期値に戻す").onClick(async () => {
          this.plugin.settings.submitIcon = DEFAULT_SETTINGS.submitIcon;
          await this.plugin.saveSettings();
          iconText.setValue(DEFAULT_SETTINGS.submitIcon);
          this.plugin.updateSubmitIcon();
        })
      );

    let placeholderText: TextComponent;
    new Setting(containerEl)
      .setName("投稿フォームの空欄メッセージ")
      .setDesc("投稿フォームが空の時に表示されるテキストを変更できます。空欄にすると非表示になります。")
      .addText((text) => {
        placeholderText = text;
        text
          .setPlaceholder(DEFAULT_SETTINGS.inputPlaceholder)
          .setValue(this.plugin.settings.inputPlaceholder)
          .onChange(async (value) => {
            this.plugin.settings.inputPlaceholder = value;
            await this.plugin.saveSettings();
            this.plugin.updateInputPlaceholder();
          });
      })
      .addExtraButton((btn) =>
        btn.setIcon("reset").setTooltip("初期値に戻す").onClick(async () => {
          this.plugin.settings.inputPlaceholder = DEFAULT_SETTINGS.inputPlaceholder;
          await this.plugin.saveSettings();
          placeholderText.setValue(DEFAULT_SETTINGS.inputPlaceholder);
          this.plugin.updateInputPlaceholder();
        })
      );

    new Setting(containerEl)
      .setName("ピン留めの上限")
      .setDesc("タイムラインに固定できるメモの最大件数を設定します。")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("1", "1 件")
          .addOption("3", "3 件")
          .addOption("5", "5 件")
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
      .setName("URLプレビュー")
      .setDesc("メモ内のURLからOGP情報を自動取得して表示します。オフにすると外部通信を行いません。")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableOgpFetch)
          .onChange(async (value) => {
            this.plugin.settings.enableOgpFetch = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("チェック済みの取り消し線")
      .setDesc("チェックボックスがONの項目に取り消し線を表示します。")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.checkStrikethrough)
          .onChange(async (value) => {
            this.plugin.settings.checkStrikethrough = value;
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          })
      );

    // --- Tag color rules ---
    new Setting(containerEl)
      .setName("タグ別に色を変える")
      .setDesc(
        "指定タグを含む投稿の背景色と文字色を変更します。複数ルールに該当する場合は本文で先に出たタグが優先されます。"
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.tagColorRulesEnabled).onChange(async (v) => {
          this.plugin.settings.tagColorRulesEnabled = v;
          await this.plugin.saveSettings();
          this.plugin.applyTagColorRules();
          this.plugin.refreshAllWrDecorations();
          // Rebuild the whole settings tab so the rules block shows/hides cleanly.
          this.withScrollPreserved(() => this.display());
        })
      );

    const rulesContainer = containerEl.createDiv({ cls: "wr-tag-rules-container" });
    const addBtnContainer = containerEl.createDiv();

    const renderRulesInner = () => {
      rulesContainer.empty();
      addBtnContainer.empty();

      if (!this.plugin.settings.tagColorRulesEnabled) return;

      const isDarkTheme = (): boolean => document.body.classList.contains("theme-dark");
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
        const raw = getComputedStyle(document.body).getPropertyValue("--text-accent").trim();
        if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
        return getDefaultText();
      };

      const buildRuleGroup = (
        isFirst: boolean,
        ruleNumber: number,
        initial: TagColorRule,
        onTagChange: (v: string) => Promise<void>,
        onBgChange: (v: string) => Promise<void>,
        onFgChange: (v: string) => Promise<void>,
        onAccentChange: (v: string | undefined) => Promise<void>,
        trailing: { kind: "delete"; handler: () => Promise<void> } | { kind: "reset"; handler: () => Promise<void> } | null
      ) => {
        if (!isFirst) {
          rulesContainer.createEl("hr", { cls: "wr-tag-rule-separator" });
        }

        const labelSetting = new Setting(rulesContainer)
          .setName(`ルール ${ruleNumber}`)
          .setClass("wr-tag-rule-label-setting");
        if (trailing) {
          labelSetting.addExtraButton((btn) =>
            btn
              .setIcon(trailing.kind === "delete" ? "trash-2" : "reset")
              .setTooltip(trailing.kind === "delete" ? "このルールを削除" : "初期値に戻す")
              .onClick(async () => { await trailing.handler(); })
          );
        }

        new Setting(rulesContainer)
          .setName("タグ")
          .setDesc("色を変えたいタグ名を入力します。（# は省略できます）")
          .addText((text) => {
            text
              .setPlaceholder("タグ名")
              .setValue(initial.tag)
              .onChange(async (v) => {
                await onTagChange(v.replace(/^#/, "").trim());
              });
          });

        new Setting(rulesContainer)
          .setName("背景色")
          .setDesc("このタグを含む投稿の背景色を設定します。")
          .setClass("wr-reverse-controls")
          .addColorPicker((picker) => {
            picker
              .setValue(resolveRuleBg(initial.bgColor))
              .onChange(async (v) => { await onBgChange(v); });
          });

        new Setting(rulesContainer)
          .setName("文字色")
          .setDesc("このタグを含む投稿の本文文字色を設定します。（タグ・リンク・URLはアクセントカラー側で設定します）")
          .setClass("wr-reverse-controls")
          .addColorPicker((picker) => {
            picker
              .setValue(resolveRuleText(initial.textColor))
              .onChange(async (v) => { await onFgChange(v); });
          });

        let accentPicker: ColorComponent;
        new Setting(rulesContainer)
          .setName("アクセントカラー")
          .setDesc("タグ・リンク・URL・コピー完了アイコンなどアクセントカラーが使われる要素の色を設定します。未設定時はテーマのアクセントカラーを使います。")
          .setClass("wr-reverse-controls")
          .addColorPicker((picker) => {
            accentPicker = picker;
            const initialAccent =
              initial.accentColor && /^#[0-9a-fA-F]{6}$/.test(initial.accentColor)
                ? initial.accentColor
                : getDefaultAccent();
            picker
              .setValue(initialAccent)
              .onChange(async (v) => { await onAccentChange(v); });
          })
          .addExtraButton((btn) =>
            btn.setIcon("reset").setTooltip("初期値に戻す").onClick(async () => {
              await onAccentChange(undefined);
              accentPicker.setValue(getDefaultAccent());
            })
          );
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
          if (hasTag || bgChanged || fgChanged || accentChanged) {
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
          placeholder,
          async (v) => { placeholder.tag = v; await promoteIfNeeded(); },
          async (v) => { placeholder.bgColor = v; await promoteIfNeeded(); },
          async (v) => { placeholder.textColor = v; await promoteIfNeeded(); },
          async (v) => { placeholder.accentColor = v; await promoteIfNeeded(); },
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
          trailing,
        );
      });

      addBtnContainer.empty();
      new Setting(addBtnContainer).addButton((btn) =>
        btn
          .setButtonText("ルールを追加")
          .setCta()
          .onClick(async () => {
            this.plugin.settings.tagColorRules.push({
              tag: "",
              bgColor: DEFAULT_SETTINGS.bgColorLight,
              textColor: DEFAULT_SETTINGS.textColorLight,
            });
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
