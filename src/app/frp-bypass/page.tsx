import FrontendFooter from "@/components/frontend/FrontendFooter";
import FrontendHeader from "@/components/frontend/FrontendHeader";

type FrpShortcut = {
  label: string;
  href: string;
  imageUrl: string;
  alt: string;
};

type FrpDownload = {
  name: string;
  href?: string;
};

const shortcuts: FrpShortcut[] = [
  { label: "*#0*#", href: "tel:*#0*#/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/10/Dial-Pad.webp", alt: "Dial Pad" },
  { label: "QR Scan Activity", href: "intent://com.google.android.setupwizard.qrprovision.QrScanActivity/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/02/QR-Scan-Activity.webp", alt: "QR Scan Activity" },
  { label: "*#85# (adb Tecno/Infinix)", href: "tel:100-000-000/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/10/phone-dialer.webp", alt: "Phone Dialer" },
  { label: "Activity Manager", href: "intent://com.activitymanager/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/10/activity-manager.webp", alt: "Activity Manager" },
  { label: "Galaxy Store", href: "intent://com.sec.android.app.samsungapps/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/07/galaxy-store.webp", alt: "Galaxy Store" },
  { label: "Alliance Shield (Galaxy Store)", href: "samsungapps://ProductDetail/com.rrivenllc.shieldx", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/07/galaxy-store.webp", alt: "Galaxy Store" },
  { label: "Activity Manager (Galaxy Store)", href: "samsungapps://ProductDetail/com.activitymanager", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/07/galaxy-store.webp", alt: "Galaxy Store" },
  { label: "XShare (Galaxy Store)", href: "samsungapps://ProductDetail/com.infinix.xshare", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/07/galaxy-store.webp", alt: "Galaxy Store" },
  { label: "File Shorts (Galaxy Store)", href: "samsungapps://ProductDetail/org.aospstudio.files", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/07/galaxy-store.webp", alt: "Galaxy Store" },
  { label: "Smart Switch (Galaxy Store)", href: "samsungapps://ProductDetail/com.sec.android.easyMover", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/07/galaxy-store.webp", alt: "Galaxy Store" },
  { label: "Chrome", href: "intent://com.android.chrome/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/chrome.png.webp", alt: "Chrome" },
  { label: "Cambiar navegador Xiaomi", href: "intent://#Intent;action=android.settings.MANAGE_DEFAULT_APPS_SETTINGS;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/settings.png.webp", alt: "Cambiar navegador Xiaomi" },
  { label: "Youtube", href: "intent://com.google.android.youtube/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/youtube.webp", alt: "Youtube" },
  { label: "Google Quick Search Box", href: "intent://com.google.android.googlequicksearchbox/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/google-search.webp", alt: "Google Search" },
  { label: "Google Help", href: "intent://com.google.android.gms/.googlehelp.helpactivities.DeviceSignalsExportActivity/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/google-search.webp", alt: "Google Help" },
  { label: "Login Account", href: "intent://com.google.android.gsf.login.LoginActivity/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/google-login.webp", alt: "Google Login" },
  { label: "Settings", href: "intent://com.android.settings/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/settings.png.webp", alt: "Settings" },
  { label: "Set Screen Lock", href: "intent://com.google.android.gms/#Intent;scheme=promote_smartlock_scheme;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/screen-smartlock.webp", alt: "Smart Lock" },
  { label: "Quick Shortcut Maker", href: "intent://jp.snowlife01.android.quickshortcut/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/Quick-shortcut-maker.webp", alt: "Quick Shortcut Maker" },
  { label: "Samsung My Files", href: "intent://com.sec.android.app.myfiles/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/samsung-my-file.png.webp", alt: "Samsung My Files" },
  { label: "Samsung Internet Browser", href: "intent://com.sec.android.app.sbrowser/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/samsung-internet.png.webp", alt: "Samsung Internet" },
  { label: "KNOXCheck", href: "intent://com.samsung.knox.knoxcheck/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/09/KNOXCheck.webp", alt: "KNOXCheck" },
  { label: "ES File Explorer", href: "intent://com.estrongs.android.pop/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/09/ES-File-Explorer.webp", alt: "ES File Explorer" },
  { label: "Find My Phone", href: "https://www.google.com/android/find/", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/10/Find-My-Phone.webp", alt: "Find My Phone" },
  { label: "Alliance Shield App", href: "intent://com.rrivenllc.shieldx/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/alliance-shield.webp", alt: "Alliance Shield" },
  { label: "Knox CloudMDM App", href: "intent://com.cloudmdm.tools.cloud/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/02/Knox-CloudMDM.webp", alt: "Knox CloudMDM" },
  { label: "Samsung Service Mode", href: "intent://com.sec.android.app.modemui.activities.USB.settings/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/10/Samsung-Service-Mode.webp", alt: "Samsung Service Mode" },
  { label: "Samsung Home Launcher", href: "intent://com.sec.android.app.launcher/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/home-launcher.webp", alt: "Samsung Home Launcher" },
  { label: "Samsung Touch ID", href: "intent://com.samsung.android.samsungpassautofill/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/10/touch-id-icon.webp", alt: "Samsung Touch ID" },
  { label: "Samsung Secure Folder", href: "intent://com.samsung.knox.securefolder/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/Samsung-Secure-Folder.webp", alt: "Samsung Secure Folder" },
  { label: "Accessibility", href: "intent://com.google.android.accessibility.switchaccess/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/09/Accessibility.webp", alt: "Accessibility" },
  { label: "ADP Settings", href: "intent://com.sec.android.app.modemui.activities.USB.settings/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/09/ADP-Settings.webp", alt: "ADP Settings" },
  { label: "Palm Store", href: "https://m.palmplaystore.com/#category=HOME#subCategory=", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/09/Palm-Store.webp", alt: "Palm Store" },
  { label: "Dial Pad", href: "intent://com.samsung.android.dialer/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/10/Dial-Pad.webp", alt: "Dial Pad" },
  { label: "Android Hidden Settings", href: "https://apps.samsung.com/appquery/appDetail.as?appId=com.jami.tool.hiddensetting.other", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/android-hidden-settings.webp", alt: "Android Hidden Settings" },
  { label: "Smart Switch", href: "intent://com.samsung.android.smartswitchassistant/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/Smart-Switch.png.webp", alt: "Smart Switch" },
  { label: "ADB", href: "intent://com.sec.android.app.modemui.activities.USB.settings/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/12/ADB.png.webp", alt: "ADB" },
  { label: "USB Setting", href: "https://com.sec.android.app.servicemodeapp/#Intent;scheme=promote_USBSettings_scheme;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/12/USB-Setting.png.webp", alt: "USB Setting" },
  { label: "S9 Launcher", href: "intent://com.galaxys9launcher.galaxylaucher2018/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/S9-Launcher.webp", alt: "S9 Launcher" },
  { label: "Home Launcher", href: "intent://com.sec.android.app.launcher/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/09/Home-Launcher.webp", alt: "Home Launcher" },
  { label: "Google Maps", href: "intent://com.google.android.apps.maps/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/Google-Maps.webp", alt: "Google Maps" },
  { label: "Google Maps V2", href: "https://www.google.com/maps/@54.5260,15.2551,4z", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/Google-Maps.webp", alt: "Google Maps" },
  { label: "Calculator", href: "intent://com.sec.android.app.popupcalculator/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/calculator.png.webp", alt: "Calculator" },
  { label: "Hw Module Test", href: "intent://com.sec.android.app.hwmoduletest/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/09/HwModuleTest-App.webp", alt: "Hw Module Test" },
  { label: "Pin Code", href: "intent://com.google.android.gms/#Intent;scheme=promote_smartlock_scheme;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/09/Pin-Code.webp", alt: "Pin Code" },
  { label: "Google Gmail", href: "intent://com.google.android.gm/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/Google-Gmail.webp", alt: "Google Gmail" },
  { label: "Google Gmail V2", href: "mailto:google@gmail.com", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/Google-Gmail.webp", alt: "Google Gmail" },
  { label: "Google Assistant", href: "intent://com.google.android.googlequicksearchbox/com.google.android.voicesearch.greco.GrecoLogger?launcher=deeplink_query_phrase;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/Google-Assistant.webp", alt: "Google Assistant" },
  { label: "Mi File Manager", href: "intent://com.mi.android.globalFileexplorer/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/Mi-File-Manager.webp", alt: "Mi File Manager" },
  { label: "EasyShare (Vivo)", href: "intent://com.vivo.easyshare/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/EasyShare-vivo.png.webp", alt: "EasyShare Vivo" },
  { label: "Xshare", href: "https://com.infinix.xshare/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/12/xshare-mini.png.webp", alt: "Xshare" },
  { label: "Xshare Mini", href: "https://com.infinix.xshare/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/12/xshare-mini.png.webp", alt: "Xshare Mini" },
  { label: "Xiaomi ShareME", href: "intent://com.xiaomi.midrop/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/02/ShareME.webp", alt: "ShareME" },
  { label: "Segundo espacio Xiaomi", href: "intent://#Intent;component=com.miui.securitycore/com.miui.securityspace.settings.SecondSpaceSettingsActivity;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/settings.png.webp", alt: "Segundo espacio Xiaomi" },
  { label: "Mi Mover", href: "intent://#Intent;package=com.miui.huanji;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/09/Mi-Mover.webp", alt: "Mi Mover" },
  { label: "OPPO Phone Clone", href: "https://com.coloros.backuprestore/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/12/OPPO-Phone-Clone.png.webp", alt: "OPPO Phone Clone" },
  { label: "OnePlus Clone Phone", href: "https://com.coloros.backuprestore/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/09/Clone-Phone-OnePlus.webp", alt: "OnePlus Clone Phone" },
  { label: "ASUS Phone Clone", href: "intent://com.oneplus.backuprestore/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/09/ASUS-Phone-Clone.webp", alt: "ASUS Phone Clone" },
  { label: "Data Transfer", href: "intent://com.dt.datatransfer/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2026/06/Data-Transfer.webp", alt: "Data Transfer" },
  { label: "File Shorts", href: "intent://org.aospstudio.files/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/10/File-Shorts.webp", alt: "File Shorts" },
  { label: "Notification Bar", href: "intent://com.treydev.ons/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2024/01/Power-Shade-Notification-Bar.png.webp", alt: "Notification Bar" },
  { label: "Package Disabler App", href: "intent://com.school.optimize/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/Package-Disabler-Pro.png.webp", alt: "Package Disabler App" },
  { label: "Package Disabler Pro", href: "intent://com.elmklab.package.disabler.pro/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2023/09/Package-Disabler-Pro.png.webp", alt: "Package Disabler Pro" },
  { label: "Moto Launcher", href: "intent://com.motorola.launcher3/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/10/Moto-Launcher.webp", alt: "Moto Launcher" },
  { label: "Moto Secure", href: "intent://com.motorola.securityhub/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/10/Moto-Secure.webp", alt: "Moto Secure" },
  { label: "Moto", href: "intent://com.motorola.moto/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/10/Motorola.webp", alt: "Moto" },
  { label: "Moto Hello You", href: "intent://com.motorola.ccc.notification/#Intent;scheme=android-app;end", imageUrl: "https://frpbypass.cc/wp-content/uploads/2025/09/Moto-Hello-You.webp", alt: "Moto Hello You" },
];

const downloads: FrpDownload[] = [
  { name: "Alliance_Shield.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Alliance%20Shield.apk" },
  { name: "Disable_GoogleService.xml", href: "https://raw.githubusercontent.com/AddromBypass/FRP/refs/heads/master/Disable_GoogleService.xml" },
  { name: "Disable_PlayServices.xml", href: "https://raw.githubusercontent.com/AddromBypass/FRP/refs/heads/master/Disable_PlayServices.xml" },
  { name: "Disable_MDM_Knox.xml", href: "https://raw.githubusercontent.com/AddromBypass/FRP/refs/heads/master/Disable_MDM_Knox.xml" },
  { name: "Disable systemUI.xml", href: "https://raw.githubusercontent.com/AddromBypass/FRP/refs/heads/master/Disable_systemUI.xml" },
  { name: "Menu_Button.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Menu_Button.apk" },
  { name: "FRP_Bypass_2.0.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/FRP_Bypass.apk" },
  { name: "Account_Login.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Account_Login.apk" },
  { name: "Technocare.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Technocare.apk" },
  { name: "Android_5_GAM.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Android_5_GAM.apk" },
  { name: "Android_6_GAM.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Android_6_GAM.apk" },
  { name: "Android_7_GAM.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Android_7_GAM.apk" },
  { name: "Android_8_9_10_GAM.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Android_8-9-10_GAM.apk" },
  { name: "QuickShortcutMaker.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/QuickShortcutMaker.apk" },
  { name: "Test_DPC.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Testdpc.apk" },
  { name: "FRP_Android_7.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/FRP_Android_7.apk" },
  { name: "ES_File_Explorer.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/ES_File_Explorer.apk" },
  { name: "HushSMS.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/HushSMS.apk" },
  { name: "Development_Settings.apk" },
  { name: "Settings.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Setting.apk" },
  { name: "Palm_Store.apk", href: "https://www.dropbox.com/scl/fi/drkwoes3gnrskabzdtwk3/palm.store.apk?rlkey=g5ia71ave8ipnsqr7bvk4m0z8&st=mq0cko7s&dl=1" },
  { name: "LGBackup_Market", href: "https://www.dropbox.com/scl/fi/2xvx265zpxn6eac6a5oxm/LGBackup_Market.lbf?rlkey=f3mefjehudlyv61klhg89ue9s&st=figveqq8&dl=1" },
  { name: "LGBackup_2022", href: "https://www.dropbox.com/scl/fi/n7hecvyapymiipaoxx14j/LGBackup_2022.lbf?rlkey=8xe89xky16ie46m07246ww3wn&st=jms3vvtr&dl=1" },
  { name: "XShare.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/XShare.apk" },
  { name: "Phone_Clone.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Phone_Clone.apk" },
  { name: "Huawei_Phone_Clone.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Phone_Clone_Huawei%20-%20Copy.apk" },
  { name: "PackageDisabler_Free.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/disabler_free.apk" },
  { name: "PackageDisabler_crk.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/PackageDisabler.apk" },
  { name: "Package_Disabler_PDC.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Package_Disabler_PDC.apk" },
  { name: "Package_Disabler_Pro.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Package_Disabler_Pro_13.5.apk" },
  { name: "Package_Manager.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Package_Manager_v7.0.apk" },
  { name: "GeekLockAccount.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/GeekLockAccount.apk" },
  { name: "Bar_Settings.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Bar_Settings.apk" },
  { name: "Factory_Reset.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Phone%20Factory%20Reset_1.7.apk" },
  { name: "Addrom.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Addrom%20Bypass.apk" },
  { name: "Kids_Dashboard.apk" },
  { name: "vnROM.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/vnROM.apk" },
  { name: "Apex_Launcher.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Apex_Launcher.apk" },
  { name: "Nova_Launcher.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Nova_Launcher.apk" },
  { name: "Shortcut_Master.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/Shortcut_Master_1.2.7.apk" },
  { name: "System_App_Remover_Pro.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/System_app_remover_pro_v7.2.apk" },
  { name: "Smart_Switch_Mobile.apk" },
  { name: "File_Commander_Manager.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/File_Commander_Manager.apk" },
  { name: "(Navigation Bar) Power_Shade.apk", href: "https://github.com/AddromBypass/FRP/raw/master/PowerShade.apk" },
  { name: "IPTV_OTT_Navigator.apk", href: "https://raw.githubusercontent.com/FRPbypass-cc/FRP/master/OTT_Navigator_v1.7.1.2_full.apk" },
  { name: "IPTV_Smarters_Pro.apk", href: "https://www.dropbox.com/scl/fi/2lqulkej63lq2bb2f78y9/IPTV_Smarters_Pro_v3.1.3.apk?rlkey=dfwfbiufwdmotc930xqxlgjhj&st=3t9hpuht&dl=1" },
];

const shortcutGroupOrder = [
  "general",
  "samsung",
  "xiaomi",
  "motorola",
  "vivo-infinix-tecno",
  "oppo-oneplus-asus",
  "google",
  "otros",
];

function getShortcutGroup(item: FrpShortcut) {
  const text = `${item.label} ${item.alt}`.toLowerCase();

  if (
    text.includes("samsung") ||
    text.includes("galaxy") ||
    text.includes("knox") ||
    text.includes("adb") ||
    text.includes("usb setting") ||
    text.includes("hw module")
  ) {
    return "samsung";
  }

  if (
    text.includes("xiaomi") ||
    text.includes(" mi ") ||
    text.includes("mi file") ||
    text.includes("mi mover") ||
    text.includes("shareme") ||
    text.includes("segundo espacio")
  ) {
    return "xiaomi";
  }

  if (text.includes("motorola") || text.includes("moto")) {
    return "motorola";
  }

  if (
    text.includes("vivo") ||
    text.includes("infinix") ||
    text.includes("tecno") ||
    text.includes("xshare")
  ) {
    return "vivo-infinix-tecno";
  }

  if (
    text.includes("oppo") ||
    text.includes("oneplus") ||
    text.includes("asus")
  ) {
    return "oppo-oneplus-asus";
  }

  if (
    text.includes("google") ||
    text.includes("gmail") ||
    text.includes("youtube") ||
    text.includes("chrome") ||
    text.includes("maps")
  ) {
    return "google";
  }

  if (
    text.includes("dial") ||
    text.includes("qr") ||
    text.includes("activity manager") ||
    text.includes("settings") ||
    text.includes("accessibility") ||
    text.includes("calculator") ||
    text.includes("notification")
  ) {
    return "general";
  }

  return "otros";
}

function sortShortcutsByBrand(items: FrpShortcut[]) {
  return [...items].sort((a, b) => {
    const groupA = shortcutGroupOrder.indexOf(getShortcutGroup(a));
    const groupB = shortcutGroupOrder.indexOf(getShortcutGroup(b));

    if (groupA !== groupB) {
      return groupA - groupB;
    }

    return a.label.localeCompare(b.label, "es");
  });
}

export default function FrpBypassPage() {
  const orderedShortcuts = sortShortcutsByBrand(shortcuts);
  const firstColumn = orderedShortcuts.slice(0, Math.ceil(orderedShortcuts.length / 2));
  const secondColumn = orderedShortcuts.slice(Math.ceil(orderedShortcuts.length / 2));
  const firstDownloadColumn = downloads.slice(0, Math.ceil(downloads.length / 2));
  const secondDownloadColumn = downloads.slice(Math.ceil(downloads.length / 2));

  return (
    <>
      <FrontendHeader />
      <main className="bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <section className="border-b border-gray-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f7f6ff_58%,#eef3ff_100%)] dark:border-gray-900 dark:bg-none dark:bg-gray-950">
          <div className="mx-auto w-full max-w-7xl px-5 py-14 text-center sm:px-6 lg:px-8">
            <h1 className="mx-auto max-w-5xl text-[40px] font-extrabold leading-tight text-gray-950 dark:text-white sm:text-[58px]">
              FRP Bypass
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-400">
              Accesos rapidos para soporte tecnico autorizado en dispositivos Android.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-2">
            {[firstColumn, secondColumn].map((column, columnIndex) => (
              <ul
                key={columnIndex}
                className="space-y-2"
                aria-label={`FRP Bypass columna ${columnIndex + 1}`}
              >
                {column.map((item) => (
                  <li key={`${item.href}-${item.label}`}>
                    <a
                      href={item.href}
                      rel="nofollow"
                      className="flex min-h-12 w-full items-center gap-2 rounded-lg border border-gray-100 bg-white px-2 py-2 text-sm font-semibold text-gray-800 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-500 dark:border-gray-900 dark:bg-gray-950 dark:text-gray-200 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/10 sm:min-h-14 sm:gap-3 sm:px-3"
                    >
                      <span className="shrink-0 rounded-md bg-brand-500 px-2.5 py-1.5 text-xs font-bold text-white sm:px-3">
                        Open
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.alt}
                        width={30}
                        height={30}
                        className="h-7 w-7 shrink-0 object-contain sm:h-[30px] sm:w-[30px]"
                      />
                      <span className="min-w-0 flex-1 break-words text-[13px] leading-5 sm:text-sm">
                        {item.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-6 text-center sm:text-left">
            <h2 className="text-2xl font-extrabold text-gray-950 dark:text-white">
              APK Files
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Archivos y recursos listos para descargar.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {[firstDownloadColumn, secondDownloadColumn].map((column, columnIndex) => (
              <ul
                key={columnIndex}
                className="space-y-2"
                aria-label={`APK Files columna ${columnIndex + 1}`}
              >
                {column.map((item) => (
                  <li key={item.name}>
                    <div className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-3 text-sm font-semibold text-gray-800 dark:border-gray-900 dark:bg-gray-950 dark:text-gray-200">
                      <span className="min-w-0 flex-1 break-all leading-5">
                        {item.name}
                      </span>
                      {item.href ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="shrink-0 rounded-md bg-brand-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-600"
                        >
                          Descargar
                        </a>
                      ) : (
                        <span className="shrink-0 rounded-md bg-gray-100 px-3 py-2 text-xs font-bold text-gray-400 dark:bg-gray-900 dark:text-gray-600">
                          No disponible
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </section>
      </main>
      <FrontendFooter />
    </>
  );
}
