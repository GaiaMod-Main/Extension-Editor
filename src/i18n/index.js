// 国际化模块
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'app_language';

// 默认语言
const DEFAULT_LANGUAGE = 'en';

export const detectBrowserLanguage = () => {
    try {
        const lang = (navigator.language || navigator.browserLanguage || '').toLowerCase();
        if (lang.startsWith('zh')) return 'zh';
        return 'en';
    } catch {
        return DEFAULT_LANGUAGE;
    }
};

// 支持的语言列表
export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
];

export const BLOCK_TYPE_ID = {
    "textNumber": "Text and Number",
    "dropdown": "Dropdown",
    "dropdownReadOnly": "Dropdown Readonly",
    "boolean": "Boolean",
    "text": "Text",
    "number": "Number",
    "angle": "Angle",
    "color": "Color",
    "matrix": "Matrix",
    "note": "Note",
    "image": "Image",
    "costume": "Costume",
    "sound": "Sound"
}

const translations = {
    zh: {
        // Home
        'Welcome to AstraBlocktory': '欢迎使用 AstraBlocktory',
        'What would you like to do?': '您想要做什么？',
        'Create New Extension': '创建新扩展',
        'Load Extension (.ab)': '加载扩展 (.ab)',
        'Failed to load project: ': '加载项目失败: ',
        'Decompile Extension (.js)': "反编译扩展 (.js)",

        // NewProject
        'Create extension': '创建扩展',
        'Name': '名称',
        'Description': '描述',
        'Author': '作者',
        'License': '许可证',
        'Docs URL': '文档链接',
        'Menu Icon': '分类图标',
        'Block Icon': '积木图标',
        'Upload': '上传',
        'No icon selected': '未选择图标',
        'Custom ID?': '自定义ID?',
        'Extension id': '扩展ID',
        'Custom color': '自定义颜色',
        'Enable Translate': '启用翻译',
        'Done': '完成',
        'Invalid extension name!': '扩展名称无效!',
        'Invalid extension ID!': '扩展ID无效!',
        'Custom': '自定义',
        'Empty extension id':"空扩展ID",

        // Editor
        'Blocks': '积木',
        'Code': '代码',
        'Create new Block': '创建新积木',
        'Output': '输出',
        'Save': '保存',
        'Setting': '设置',
        'Loading editor...': '加载编辑器中...',
        'Flyout': '列表',
        'Back': '返回',
        'Editor Settings': '编辑器设置',
        'Monaco Settings': 'Monaco 设置',
        'Basic': '基础',
        'Advanced JSON': '高级 JSON',
        'Appearance': '外观',
        'Editor Behavior': '编辑行为',
        'JavaScript / TypeScript': 'JavaScript / TypeScript',
        'Theme': '主题',
        'Font Size': '字体大小',
        'Line Height': '行高',
        'Font Family': '字体族',
        'Minimap': '缩略图',
        'Enable Cursor Smooth Animation': '平滑光标',
        'Word Wrap': '自动换行',
        'Off': '关闭',
        'On': '开启',
        'Word Wrap Column': '按列换行',
        'Bounded': '受限换行',
        'Render Whitespace': '空白字符显示',
        'None': '不显示',
        'Boundary': '边界',
        'Selection': '选区',
        'Trailing': '行尾',
        'All': '全部',
        'Cursor Blinking': '光标闪烁',
        'Tab Size': 'Tab 宽度',
        'Insert Spaces': '使用空格缩进',
        'Smooth Scrolling': '平滑滚动',
        'Mouse Wheel Zoom': '滚轮缩放',
        'Format On Type': '输入时格式化',
        'Format On Paste': '粘贴时格式化',
        'Bracket Pair Colorization': '括号对着色',
        'Indentation Guides': '缩进引导线',
        'Bracket Pair Guides': '括号对引导线',
        'Suggest On Trigger Characters': '触发字符提示',
        'Quick Suggestions': '快速建议',
        'Check JS': '检查 JS',
        'Strict Mode': '严格模式',
        'Script Target': '脚本目标',
        'Advanced mode supports full Monaco config via JSON!': '高级模式可通过 JSON 配置完整 Monaco 选项!',
        'Invalid JSON. Please check syntax.': 'JSON 格式错误，请检查语法。',
        'Cancel': '取消',
        'Reset Defaults': '恢复默认',
        'Format JSON': '格式化 JSON',
        'Apply': '应用',
        'Load': '加载',
        'Translate': '翻译',
        'Block': '积木',
        'Public': '公共',
        'full opcode': '完整opcode',
        'Input ID': "输入 ID",
        "Hot Reload": "热重载",
        "Undo": "撤回",
        "Redo": "重做",
        "Drag to sort": "拖动排序",
        "Dark Mode": "深色模式",
        "Light Mode": "亮色模式",
        "Edit extension info": "编辑扩展信息",

        // NewBlock
        'New Block': '新建积木',
        'Block Preview': '积木预览',
        'ID': 'ID',
        'Enter ID (a-z, A-Z only)': '输入ID (仅 a-z, A-Z)',
        'Block Type': '积木类型',
        'Add Text': '添加文本',
        'Add Input': '添加输入',
        'Save Block': '保存积木',
        'Invalid Block ID!': '积木ID无效!',
        'Block Parts': '积木内容',
        'No parts yet. Add text or input to start building.': '还没有内容，先添加文本或输入。',
        'If the Addon is not enabled, the background of text and numbers will be consistent in AstraEditor.': "如果没有启用插件，文字和数字的背景在 AstraEditor 是一样的",
        "This Block can't use New Brach.": "这个积木无法使用新分支",
        "New Brach": "新分支",
        'Block Config': "积木配置",
        'End Block': "结束积木",
        'Loop': "循环",
        'Block ID already exists!': "积木ID已存在!",

        // NewInput
        'Add input': '添加输入',
        'Input Preview': '输入预览',
        'Mode': '模式',
        'Text': '文本',
        'Number': '数字',
        'Text and Number': '文本和数字',
        'Dropdown': '下拉框',
        'Boolean': '布尔值',
        'Angle': '角度',
        'Color': '颜色',
        'Matrix': '矩阵',
        'Note': '音符',
        'Image': '图片',
        'Special Input': '特殊输入框',
        'Sprite Property': '角色属性',
        'Costume': '造型',
        'Sound': '声音',
        'Default Input': '默认输入',
        'Image settings': '图片设置',
        'Image alt text': '图片替代文本',
        'Image width': '图片宽度',
        'Image height': '图片高度',
        'Flip image in RTL': 'RTL 时翻转图片',
        'read only': '不接受子积木',
        'Options': '选项',
        'Default Option': "默认选项",
        "Dropdown Readonly": "不接受子积木的下拉框",
        "Async Block":"异步积木",
        'Allow reporters': '允许插入返回值积木',
        'Block all threads': '阻塞所有线程',
        'Target Filter': '目标过滤',
        'Show on Sprite': '在角色中显示',
        'Show on Stage': '在舞台中显示',

        // Output Project
        'Output Project': '输出项目',
        'Loading...': '加载中...',

        // Block Types
        'stack': '命令积木',
        'hat': '帽子积木',
        'repoter': '返回值积木',
        'boolean': '布尔积木',
        'C block': 'C型积木',
        "event":"事件积木",

        // NewBlock additional
        'Text or Number': '文字或数字',
        'Read Only Dropdown': '不接受子积木的下拉框',
        'Menu-backed input': '菜单输入',

        // Common
        'Remove': '删除',
        'move to top': '移至顶部',
        'Modify': '修改',

        //Edit Block
        'Edit Block': "编辑积木",
        'Type: ': '类型：',
        'Found ': "找到了 ",
        " Input(s).": " 个输入项",

        // Public JS
        'Public JS': '公共JS',
        'Empty flyout': '空列表',
        'No code': '无代码',

        // InputPart
        'Insert': '插入',
        'Seek': '查看',

        // NewBlock
        'Divider': '分割线',
        'Label': '文字',
        'Label text': '标签文本',
        'Add Brach': '添加分支',
        'Are you sure to remove this block?': '确定要删除这个积木吗？',
        'Write program': '编写程序',
        'Event block use different grammar.': '事件积木使用不同的语法。',
        'Unknown Mode': '未知模式',
        'What licence do you like?': '您想要什么许可证？',

        // Translate
        'Translation Manager': '翻译管理器',
        'From JavaScript code': '来自 JavaScript 代码',
        'Target Language': '目标语言',
        'Search texts...': '搜索文本...',
        'Show only untranslated': '仅显示未翻译',
        'translated': '已翻译',
        'Translating...': '翻译中...',
        'Translate All': '翻译全部',
        'Texts to Translate': '待翻译文本',
        'No texts found': '没有找到文本',
        'Original': '原文',
        'Translation': '译文',
        'Enter translation': '输入翻译',
        'Auto translate': '自动翻译',
        'Translations saved!': '翻译已保存！',
        'Translation failed': '翻译失败',

        // FSC
        'Supported Platforms': '支持的平台',

        // Toast / FSC
        'Hot reloading FSC extension...': '正在热重载 FSC 扩展...',
        'FSC extension loaded successfully': 'FSC 扩展加载成功',
        'Failed to load FSC extension': 'FSC 扩展加载失败',
        'WebSocket is not supported in this environment.': '当前环境不支持 WebSocket。',
        'FSC WebSocket connection failed': 'FSC WebSocket 连接失败',
        'Fetching FSC extension...': '正在获取 FSC 扩展...',
        'FSC extension loaded': 'FSC 扩展已加载',
        'Failed to fetch FSC extension': '获取 FSC 扩展失败',
        "Can't send extension": "无法发送扩展",
        "Can't reload extension": "无法重载扩展"
    },
};

// 获取当前语言
export const getCurrentLanguage = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const detected = detectBrowserLanguage();
    localStorage.setItem(STORAGE_KEY, detected);
    return detected;
};

// 设置语言
export const setLanguage = (lang) => {
    if (lang === 'en' || translations[lang]) {
        localStorage.setItem(STORAGE_KEY, lang);
        window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
        return true;
    }
    return false;
};

// 获取翻译文本 - 直接使用英文文本作为键
export const t = (text) => {
    const lang = getCurrentLanguage();
    if (lang === 'en') {
        return text; // 英文直接返回原文
    }
    return translations[lang]?.[text] || text;
};

// React Hook - 自动响应语言变化
export const useTranslation = () => {
    const [language, setLanguageState] = useState(getCurrentLanguage());

    useEffect(() => {
        const handleLanguageChange = (e) => {
            setLanguageState(e.detail);
        };
        window.addEventListener('languageChange', handleLanguageChange);
        return () => window.removeEventListener('languageChange', handleLanguageChange);
    }, []);

    const translate = useCallback((text) => {
        if (language === 'en') {
            return text; // 英文直接返回原文
        }
        return translations[language]?.[text] || text;
    }, [language]);

    return { t: translate, language };
};

// 导出所有翻译（用于调试）
export const getAllTranslations = () => {
    const lang = getCurrentLanguage();
    if (lang === 'en') return {};
    return translations[lang] || {};
};

const i18n = { t, getCurrentLanguage, setLanguage, SUPPORTED_LANGUAGES, useTranslation, BLOCK_TYPE_ID };
export default i18n;
