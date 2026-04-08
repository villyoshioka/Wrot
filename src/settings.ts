import { App, ColorComponent, PluginSettingTab, Setting, TextComponent } from "obsidian";
import type WrotPlugin from "./main";

export interface WrotSettings {
  viewPlacement: "left" | "right" | "main";
  timestampFormat: string;
  bgColorLight: string;
  bgColorDark: string;
  textColorLight: string;
  textColorDark: string;
  submitLabel: string;
  enableOgpFetch: boolean;
  checkStrikethrough: boolean;
}

export const DEFAULT_SETTINGS: WrotSettings = {
  viewPlacement: "right",
  timestampFormat: "YYYY/MM/DD HH:mm:ss",
  bgColorLight: "#f0efeb",
  bgColorDark: "#303030",
  textColorLight: "#454545",
  textColorDark: "#dcddde",
  submitLabel: "投稿",
  enableOgpFetch: true,
  checkStrikethrough: false,
};

export class WrotSettingTab extends PluginSettingTab {
  plugin: WrotPlugin;

  constructor(app: App, plugin: WrotPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("wr-settings");

    new Setting(containerEl)
      .setName("表示位置")
      .setDesc("Wrotパネルの表示位置")
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

    let tsText: TextComponent;
    new Setting(containerEl)
      .setName("タイムスタンプ表示形式")
      .setDesc("メモカードの日時フォーマット（YYYY, MM, DD, HH, mm, ss が使えます）")
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
      .setDesc("カード・入力エリアの背景色（ライトテーマ）")
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

    let darkPicker: ColorComponent;
    new Setting(containerEl)
      .setName("背景色（ダークモード）")
      .setDesc("カード・入力エリアの背景色（ダークテーマ）")
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

    let textLightPicker: ColorComponent;
    new Setting(containerEl)
      .setName("文字色（ライトモード）")
      .setDesc("テキスト・アイコンの色（ライトテーマ）")
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

    let textDarkPicker: ColorComponent;
    new Setting(containerEl)
      .setName("文字色（ダークモード）")
      .setDesc("テキスト・アイコンの色（ダークテーマ）")
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

    let submitText: TextComponent;
    new Setting(containerEl)
      .setName("投稿ボタンのテキスト")
      .setDesc("投稿ボタンに表示するテキスト")
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

    new Setting(containerEl)
      .setName("URLプレビュー")
      .setDesc("メモ内のURLからOGP情報を自動取得して表示する（オフにすると外部通信しません）")
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
      .setDesc("チェックボックスがONの項目に取り消し線を表示する")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.checkStrikethrough)
          .onChange(async (value) => {
            this.plugin.settings.checkStrikethrough = value;
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          })
      );
  }
}
