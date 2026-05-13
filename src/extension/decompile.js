import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import { setValueTo, init } from './storage.js';

// BlockType 映射
const BlockTypeMap = {
    'Scratch.BlockType.COMMAND': 'stack',
    'Scratch.BlockType.HAT': 'hat',
    'Scratch.BlockType.EVENT': 'event',
    'Scratch.BlockType.BOOLEAN': 'boolean',
    'Scratch.BlockType.REPORTER': 'round',
    'Scratch.BlockType.CONDITIONAL': 'cBlock',
    'Scratch.BlockType.LOOP': 'cBlock',
    'BlockType.COMMAND': 'stack',
    'BlockType.HAT': 'hat',
    'BlockType.EVENT': 'event',
    'BlockType.BOOLEAN': 'boolean',
    'BlockType.REPORTER': 'round',
    'BlockType.CONDITIONAL': 'cBlock',
    'BlockType.LOOP': 'cBlock',
};

/**
 * 解析表达式值
 */
function evaluateNode(node, scope = {}) {
    if (!node) return null;

    switch (node.type) {
        case 'StringLiteral':
            return node.value;
        case 'NumericLiteral':
            return node.value;
        case 'BooleanLiteral':
            return node.value;
        case 'NullLiteral':
            return null;
        case 'Identifier': {
            const name = node.name;
            if (scope[name] !== undefined) {
                return scope[name];
            }
            return { type: 'identifier', name };
        }
        case 'ArrayExpression':
            return node.elements.map(el => evaluateNode(el, scope));
        case 'ObjectExpression': {
            const obj = {};
            for (const prop of node.properties) {
                if (prop.type === 'ObjectProperty') {
                    const key = prop.key.type === 'Identifier' ? prop.key.name : 
                                prop.key.type === 'StringLiteral' ? prop.key.value : null;
                    if (key) {
                        obj[key] = evaluateNode(prop.value, scope);
                    }
                }
            }
            return obj;
        }
        case 'MemberExpression': {
            let objName = '';
            let propName = '';
            
            if (node.object.type === 'MemberExpression' && 
                node.object.object.type === 'Identifier') {
                objName = node.object.object.name;
                const midName = node.object.property.name || '';
                propName = node.property.name || '';
                
                if (objName === 'Scratch') {
                    if (midName === 'BlockType' || midName === 'ArgumentType') {
                        return `Scratch.${midName}.${propName}`;
                    }
                }
            } else if (node.object.type === 'Identifier') {
                objName = node.object.name;
                propName = node.property.name || '';
                
                if (objName === 'BlockType') {
                    return `BlockType.${propName}`;
                }
                if (objName === 'ArgumentType') {
                    return `ArgumentType.${propName}`;
                }
            }
            return null;
        }
        case 'CallExpression': {
            if (node.callee.type === 'MemberExpression' &&
                node.callee.object.type === 'Identifier' &&
                node.callee.object.name === 'Scratch' &&
                node.callee.property.type === 'Identifier' &&
                node.callee.property.name === 'translate') {
                const arg = node.arguments[0];
                if (arg && arg.type === 'StringLiteral') {
                    return { type: 'translate', text: arg.value };
                }
            }
            return null;
        }
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
            // 保留 AST 节点以便后续提取代码
            return { _astNode: node, _isFunction: true };
        default:
            return null;
    }
}

/**
 * 解析积木的 text 字段，提取 parts
 */
function parseBlockText(textValue, args) {
    const parts = [];
    
    if (typeof textValue === 'string') {
        parseTextWithInputs(textValue, args, parts);
    } else if (Array.isArray(textValue)) {
        for (const branchText of textValue) {
            if (typeof branchText === 'string') {
                parseTextWithInputs(branchText, args, parts);
            } else if (branchText && branchText.type === 'translate') {
                parseTextWithInputs(branchText.text, args, parts);
            }
            parts.push('_NextBrach_');
        }
        if (parts.length > 0 && parts[parts.length - 1] === '_NextBrach_') {
            parts.pop();
        }
    } else if (textValue && textValue.type === 'translate') {
        parseTextWithInputs(textValue.text, args, parts);
    } else if (textValue && textValue.type === 'identifier') {
        parts.push('');
    }
    
    return parts;
}

/**
 * 解析包含输入占位符的文本
 */
function parseTextWithInputs(text, args, parts) {
    if (!text || typeof text !== 'string') {
        parts.push(text || '');
        return;
    }

    const regex = /\[([^\]]+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        const inputId = match[1];
        const argInfo = args ? args[inputId] : null;

        if (argInfo && typeof argInfo === 'object') {
            const inputType = mapInputType(argInfo.type);
            const inputPart = {
                id: inputId,
                inputType: inputType,
                value: '',
            };
            
            // 处理图片类型参数
            if (inputType === 'image') {
                inputPart.value = {
                    dataURI: argInfo.dataURI || '',
                    width: argInfo.width || 40,
                    height: argInfo.height || 40,
                    alt: argInfo.alt || '',
                    flipRTL: argInfo.flipRTL || false,
                };
                parts.push(inputPart);
            } else {
                // 处理 defaultValue
                if (argInfo.defaultValue !== undefined) {
                    if (typeof argInfo.defaultValue === 'string') {
                        inputPart.value = argInfo.defaultValue;
                    } else if (argInfo.defaultValue && argInfo.defaultValue.type === 'translate') {
                        inputPart.value = argInfo.defaultValue.text;
                    } else {
                        inputPart.value = String(argInfo.defaultValue);
                    }
                }

                // 处理 menu - 可能是字符串或 identifier 引用
                if (argInfo.menu) {
                    inputPart.inputType = 'dropdown';
                    const mappedArgumentType = mapInputType(argInfo.type);
                    if (mappedArgumentType && mappedArgumentType !== 'text') {
                        inputPart.argumentType = mappedArgumentType;
                    }
                    if (typeof argInfo.menu === 'string') {
                        inputPart.menuId = argInfo.menu;
                    } else if (argInfo.menu.type === 'identifier') {
                        inputPart.menuId = argInfo.menu.name;
                    }
                }

                parts.push(inputPart);
            }
        } else {
            parts.push({
                id: inputId,
                inputType: 'text',
                value: '',
            });
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }
}

/**
 * 映射输入类型
 */
function mapInputType(scratchType) {
    if (!scratchType) return 'text';
    if (typeof scratchType !== 'string') return 'text';
    
    if (scratchType.includes('ANGLE') || scratchType === 'angle') return 'angle';
    if (scratchType.includes('COLOR') || scratchType === 'color') return 'color';
    if (scratchType.includes('MATRIX') || scratchType === 'matrix') return 'matrix';
    if (scratchType.includes('NOTE') || scratchType === 'note') return 'note';
    if (scratchType.includes('COSTUME') || scratchType === 'costume') return 'costume';
    if (scratchType.includes('SOUND') || scratchType === 'sound') return 'sound';
    if (scratchType.includes('NUMBER')) return 'number';
    if (scratchType.includes('BOOLEAN')) return 'boolean';
    if (scratchType.includes('STRING')) return 'text';
    if (scratchType.includes('IMAGE')) return 'image';
    
    return 'text';
}

/**
 * 标准化语言代码
 */
function normalizeLangCode(code) {
    const parts = code.split('-');
    if (parts.length === 2) {
        return parts[0].toLowerCase() + '-' + parts[1].toUpperCase();
    }
    return code;
}

/**
 * 获取js的class名
 */
export function getClass(extension) {
    const ast = parser.parse(extension, {
        sourceType: 'script',
        plugins: ['classProperties', 'classPrivateMethods']
    });

    let className = null;

    traverse(ast, {
        CallExpression(path) {
            if (path.node.callee.type === 'MemberExpression') {
                const memberExpr = path.node.callee;

                if (memberExpr.object.type === 'MemberExpression' &&
                    memberExpr.object.object.type === 'Identifier' &&
                    memberExpr.object.object.name === 'Scratch' &&
                    memberExpr.object.property.type === 'Identifier' &&
                    memberExpr.object.property.name === 'extensions' &&
                    memberExpr.property.type === 'Identifier' &&
                    memberExpr.property.name === 'register') {

                    const args = path.node.arguments;
                    if (args.length > 0 && args[0].type === 'NewExpression') {
                        const newExpr = args[0];
                        if (newExpr.callee.type === 'Identifier') {
                            className = newExpr.callee.name;
                        }
                    }
                }
            }
        }
    });

    return className;
}

/**
 * 反编译扩展js为.ab格式并存储
 */
export function translate(extension, className = null) {
    init();

    const ast = parser.parse(extension, {
        sourceType: 'script',
        plugins: ['classProperties', 'classPrivateMethods', 'jsx']
    });

    const comments = {
        name: 'A Extension',
        id: 'aExtension',
        description: 'a extension',
        color: ['#2D2DD2', '#1515B2', '#000087'],
        author: '',
        license: 'MPL-2.0',
        docsURI: '',
        menuIconURI: '',
        blockIconURI: '',
    };
    const blocks = {};
    const menus = {};
    const translateData = [];
    let publicJS = '';
    const scope = {};
    const methodCodes = {};
    const asyncMethodCodes = new Set(); // 存储 async 方法名

    // 提取文件头部注释
    const leadingComments = ast.comments || [];
    for (const comment of leadingComments) {
        if (comment.type === 'CommentLine') {
            const text = comment.value.trim();
            if (text.startsWith('Name:')) comments.name = text.substring(5).trim();
            else if (text.startsWith('ID:')) comments.id = text.substring(3).trim();
            else if (text.startsWith('Description:')) comments.description = text.substring(12).trim();
            else if (text.startsWith('By:')) comments.author = text.substring(3).trim();
            else if (text.startsWith('License:')) comments.license = text.substring(8).trim();
        }
    }

    // 提取翻译数据
    extractTranslations(ast, translateData);

    // 首先遍历找到所有顶层变量定义
    traverse(ast, {
        VariableDeclaration(path) {
            for (const declarator of path.node.declarations) {
                if (declarator.id.type === 'Identifier' && declarator.init) {
                    const name = declarator.id.name;
                    const value = evaluateNode(declarator.init, scope);
                    if (value !== null && typeof value !== 'object') {
                        scope[name] = value;
                    } else if (value && typeof value === 'object' && !value.type) {
                        scope[name] = value;
                    } else if (declarator.init.type === 'ArrayExpression') {
                        scope[name] = { _astNode: declarator.init, _isArray: true };
                    } else if (declarator.init.type === 'ObjectExpression') {
                        scope[name] = { _astNode: declarator.init, _isObject: true };
                    }
                }
            }
        }
    });

    // 遍历 IIFE 和类定义
    traverse(ast, {
        CallExpression(path) {
            if (path.node.callee.type === 'FunctionExpression' && 
                path.node.arguments.length > 0) {
                
                const functionBody = path.node.callee.body.body;
                
                for (const statement of functionBody) {
                    if (statement.type === 'ClassDeclaration') {
                        if (!className && statement.id) {
                            className = statement.id.name;
                        }

                        if (statement.body && statement.body.body) {
                            for (const method of statement.body.body) {
                                if (method.type === 'ClassMethod') {
                                    const methodName = method.key.name;
                                    
                                    if (methodName === 'getInfo') {
                                        parseGetInfoMethod(method, scope, comments, blocks, menus);
                                    } else if (methodName !== 'constructor') {
                                        // 检测是否为 async 方法
                                        if (method.async) {
                                            asyncMethodCodes.add(methodName);
                                        }
                                        
                                        const methodCode = generate(method.body, {
                                            comments: true,
                                            retainLines: false,
                                        }).code;
                                        
                                        let cleanCode = methodCode.trim();
                                        if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
                                            cleanCode = cleanCode.slice(1, -1).trim();
                                        }
                                        
                                        methodCodes[methodName] = cleanCode;
                                    }
                                }
                            }
                        }
                    } else if (statement.type === 'VariableDeclaration') {
                        for (const declarator of statement.declarations) {
                            if (declarator.id.type === 'Identifier' && declarator.init) {
                                const name = declarator.id.name;
                                if (declarator.init.type === 'ArrayExpression') {
                                    scope[name] = { _astNode: declarator.init, _isArray: true };
                                } else if (declarator.init.type === 'ObjectExpression') {
                                    const value = evaluateNode(declarator.init, scope);
                                    scope[name] = value;
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    // 如果 blocks 为空，尝试解析 definitions
    if (Object.keys(blocks).length === 0 && scope.definitions) {
        parseDefinitions(scope.definitions, scope, blocks, menus);
    }

    // 将方法代码关联到积木，非积木方法存储为 dynamicMenus
    // 注意：如果积木已经有 code（从 def 提取），不要覆盖
    const dynamicMenus = {};
    for (const [methodName, code] of Object.entries(methodCodes)) {
        if (blocks[methodName] && !blocks[methodName].code) {
            // 只有积木没有代码时才用 methodCodes 覆盖
            blocks[methodName].code = code;
        } else if (!blocks[methodName]) {
            // 非积木方法（如动态菜单方法）存储起来
            dynamicMenus[methodName] = code;
        }
        
        // 如果是 async 方法，设置 blockConfig.isAsync 属性
        if (blocks[methodName] && asyncMethodCodes.has(methodName)) {
            blocks[methodName].blockConfig.isAsync = true;
        }
    }

    // 处理 menus
    for (const [blockName, block] of Object.entries(blocks)) {
        if (block.parts) {
            for (const part of block.parts) {
                if (typeof part === 'object' && part.menuId && menus[part.menuId]) {
                    const menu = menus[part.menuId];
                    const menuItems = menu.items;
                    
                    // 检查是否是动态菜单（items 是字符串/函数名引用）
                    if (typeof menuItems === 'string') {
                        // 动态菜单 - 使用占位符，需要用户手动配置
                        part.value = [
                            { name: `[动态菜单: ${menuItems}]`, value: '' }
                        ];
                        part.isDynamicMenu = true;
                        part.dynamicMenuMethod = menuItems;
                    } else if (Array.isArray(menuItems)) {
                        part.value = menuItems;
                    } else {
                        part.value = [];
                    }
                    
                    part.inputType = menu.acceptReporters ? 'dropdown' : 'dropdownReadOnly';
                    delete part.menuId;
                }
            }
        }
    }

    // 提取 publicJS
    publicJS = extractPublicJS(ast, className);

    // 保存到 storage
    setValueTo('comments', comments);
    setValueTo('blocks', blocks);
    setValueTo('publicJS', publicJS.trim());
    setValueTo('translate', translateData);
    setValueTo('dynamicMenus', dynamicMenus);

    console.log('Decompiled extension:', { comments, blocks, publicJS, translateData, dynamicMenus });
    
    return { comments, blocks, publicJS, translateData, dynamicMenus };
}

/**
 * 解析 getInfo 方法
 */
function parseGetInfoMethod(method, scope, comments, blocks, menus) {
    traverse(method, {
        ReturnStatement(returnPath) {
            const returnArg = returnPath.node.argument;
            if (!returnArg) return;

            let infoObj = null;

            if (returnArg.type === 'ObjectExpression') {
                infoObj = evaluateNode(returnArg, scope);
            } else if (returnArg.type === 'Identifier') {
                infoObj = scope[returnArg.name];
            }

            if (infoObj && typeof infoObj === 'object') {
                if (infoObj.name) {
                    if (typeof infoObj.name === 'string') {
                        comments.name = infoObj.name;
                    } else if (infoObj.name.type === 'translate') {
                        comments.name = infoObj.name.text;
                    }
                }
                if (infoObj.id) comments.id = infoObj.id;
                if (infoObj.color1 || infoObj.color2 || infoObj.color3) {
                    comments.color = [
                        infoObj.color1 || '#0099ff',
                        infoObj.color2 || '#0066ff',
                        infoObj.color3 || '#0033ff',
                    ];
                }
                if (infoObj.docsURI) comments.docsURI = infoObj.docsURI;
                if (infoObj.menuIconURI) comments.menuIconURI = infoObj.menuIconURI;
                if (infoObj.blockIconURI) comments.blockIconURI = infoObj.blockIconURI;

                const blocksData = infoObj.blocks;
                if (Array.isArray(blocksData)) {
                    for (const blockInfo of blocksData) {
                        if (!blockInfo || typeof blockInfo !== 'object') continue;
                        if (blockInfo._astNode) continue;
                        
                        if (blockInfo.blockType === 'BUTTON' || blockInfo.blockType === 'button') continue;
                        if (blockInfo.blockType === 'LABEL' || blockInfo.blockType === 'label') continue;
                        if (!blockInfo.opcode && !blockInfo.func) continue;

                        const opcode = blockInfo.opcode || blockInfo.func;
                        const block = parseBlock(blockInfo);
                        blocks[opcode] = block;
                    }
                } else if (blocksData && blocksData._astNode) {
                    parseDefinitions(blocksData, scope, blocks, menus);
                }

                if (infoObj.menus && typeof infoObj.menus === 'object') {
                    for (const [menuName, menuData] of Object.entries(infoObj.menus)) {
                        // 处理两种菜单格式：
                        // 1. { items: [...], acceptReporters: true/false } 对象格式
                        // 2. [...] 直接数组格式
                        if (Array.isArray(menuData)) {
                            menus[menuName] = {
                                acceptReporters: false,
                                items: parseMenuItems(menuData, scope),
                            };
                        } else if (typeof menuData === 'string') {
                            menus[menuName] = {
                                acceptReporters: false,
                                items: menuData,
                            };
                        } else if (menuData?.type === 'identifier') {
                            menus[menuName] = {
                                acceptReporters: false,
                                items: menuData.name,
                            };
                        } else if (menuData && typeof menuData === 'object') {
                            // 检查是否是 { items: [...] } 格式
                            if (menuData.items || menuData._astNode) {
                                menus[menuName] = {
                                    acceptReporters: menuData.acceptReporters ?? false,
                                    items: parseMenuItems(menuData.items, scope),
                                };
                            } else if (menuData._isArray) {
                                // AST 节点包装的数组
                                menus[menuName] = {
                                    acceptReporters: false,
                                    items: parseMenuItems(menuData, scope),
                                };
                            }
                        }
                    }
                }
            }
        }
    }, { noScope: true });
}

/**
 * 解析 definitions 数组
 */
function parseDefinitions(definitionsData, scope, blocks, menus) {
    let definitionsArray = definitionsData;
    
    if (definitionsData && definitionsData._astNode) {
        const astNode = definitionsData._astNode;
        if (astNode.type === 'ArrayExpression') {
            definitionsArray = astNode.elements.map(el => evaluateNode(el, scope));
        }
    }

    if (!Array.isArray(definitionsArray)) return;

    for (const blockInfo of definitionsArray) {
        if (!blockInfo || typeof blockInfo !== 'object') continue;
        if (typeof blockInfo === 'string') continue;
        
        const blockType = blockInfo.blockType;
        if (blockType === 'BUTTON' || blockType === 'button') continue;
        if (blockType === 'LABEL' || blockType === 'label') continue;
        if (!blockInfo.opcode && !blockInfo.func) continue;

        const opcode = blockInfo.opcode || blockInfo.func;
        const block = parseBlock(blockInfo);
        
        // 提取 def 函数代码
        if (blockInfo.def && blockInfo.def._astNode) {
            const defNode = blockInfo.def._astNode;
            if (defNode.type === 'FunctionExpression') {
                const code = generate(defNode.body, { comments: true }).code;
                let cleanCode = code.trim();
                if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
                    cleanCode = cleanCode.slice(1, -1).trim();
                }
                block.code = cleanCode;
                
                // 检测 def 是否为 async 函数
                if (defNode.async) {
                    block.blockConfig.isAsync = true;
                }
            }
        }
        
        blocks[opcode] = block;
    }
}

/**
 * 解析 menu items，处理 Scratch.translate 调用
 */
function parseMenuItems(items, scope = {}) {
    if (!items) return [];
    
    // 处理 AST 节点包装的数组
    if (items._astNode && items._isArray) {
        const astNode = items._astNode;
        if (astNode.type === 'ArrayExpression') {
            items = astNode.elements.map(el => evaluateNode(el, scope));
        }
    }
    
    if (!Array.isArray(items)) return items; // 可能是函数名引用
    
    return items.map(item => {
        if (typeof item === 'string') {
            return { name: item, value: item };
        }
        if (typeof item === 'object' && item !== null) {
            // 处理 AST 节点包装的对象
            if (item._astNode) {
                const evaluated = evaluateNode(item._astNode, scope);
                if (evaluated && typeof evaluated === 'object' && !evaluated._astNode) {
                    item = evaluated;
                }
            }
            
            const name = item.text;
            const value = item.value;
            
            // 处理 Scratch.translate 包装
            if (name && typeof name === 'object' && name.type === 'translate') {
                return { name: name.text, value: value };
            }
            
            return {
                name: name === undefined || name === null ? '' : String(name),
                value: value === undefined ? '' : value
            };
        }
        return { name: String(item), value: item };
    });
}

/**
 * 解析单个积木定义
 */
function parseBlock(blockInfo) {
    const block = {
        type: 'stack',
        parts: [],
        code: blockInfo.code || '',
        blockConfig: {
            hasNextConnection: true,
            branches: 0,
            isLoop: false,
            isAsync: false,
            blockAllThreads: false,
            filter: [],
            blockIconURI: null,
        },
    };

    if (blockInfo.blockType) {
        const blockTypeStr = String(blockInfo.blockType);
        if (BlockTypeMap[blockTypeStr]) {
            block.type = BlockTypeMap[blockTypeStr];
        } else if (blockTypeStr.includes('HAT') || blockTypeStr.includes('EVENT')) {
            block.type = 'event';
        } else if (blockTypeStr.includes('BOOLEAN')) {
            block.type = 'boolean';
        } else if (blockTypeStr.includes('REPORTER')) {
            block.type = 'round';
        } else if (blockTypeStr.includes('CONDITIONAL') || blockTypeStr.includes('LOOP')) {
            block.type = 'cBlock';
            if (blockTypeStr.includes('LOOP')) {
                block.blockConfig.isLoop = true;
            }
        }
    }

    if (blockInfo.branchCount) {
        const branchCount = parseInt(blockInfo.branchCount, 10);
        if (!isNaN(branchCount) && branchCount > 0) {
            block.blockConfig.branches = branchCount;
        }
    }

    if (blockInfo.isTerminal) {
        block.blockConfig.hasNextConnection = false;
    }
    if (blockInfo.blockAllThreads) {
        block.blockConfig.blockAllThreads = true;
    }
    if (blockInfo.blockIconURI) {
        block.blockConfig.blockIconURI = blockInfo.blockIconURI;
    }
    if (Array.isArray(blockInfo.filter) && blockInfo.filter.length > 0) {
        block.blockConfig.filter = [...blockInfo.filter];
    } else if (typeof blockInfo.filter === 'string') {
        block.blockConfig.filter = [blockInfo.filter];
    }

    let textValue = blockInfo.text;
    const args = blockInfo.arguments || {};
    
    if (textValue && textValue.type === 'translate') {
        textValue = textValue.text;
    }
    
    block.parts = parseBlockText(textValue, args);

    // 处理图片类型的参数 - 它们可能不在 text 中出现
    for (const [argId, argInfo] of Object.entries(args)) {
        if (argInfo && typeof argInfo === 'object') {
            const argType = argInfo.type || '';
            if (argType.includes('IMAGE') || argType === 'image') {
                // 检查这个参数是否已经在 parts 中
                const alreadyInParts = block.parts.some(part => 
                    typeof part === 'object' && part.id === argId
                );
                
                if (!alreadyInParts) {
                    // 图片参数不在 text 中，需要单独添加到 parts 开头
                    const imagePart = {
                        id: argId,
                        inputType: 'image',
                        value: {
                            dataURI: argInfo.dataURI || '',
                            width: argInfo.width || 40,
                            height: argInfo.height || 40,
                            alt: argInfo.alt || '',
                            flipRTL: argInfo.flipRTL || false,
                        },
                    };
                    // 图片通常放在积木开头
                    block.parts.unshift(imagePart);
                }
            }
        }
    }

    return block;
}

/**
 * 提取翻译数据
 */
function extractTranslations(ast, translateData) {
    traverse(ast, {
        CallExpression(path) {
            const callee = path.node.callee;
            
            // 检查 Scratch.translate.setup(...)
            if (callee.type === 'MemberExpression' &&
                callee.object.type === 'MemberExpression' &&
                callee.object.object.type === 'Identifier' &&
                callee.object.object.name === 'Scratch' &&
                callee.object.property.type === 'Identifier' &&
                callee.object.property.name === 'translate' &&
                callee.property.type === 'Identifier' &&
                callee.property.name === 'setup') {
                
                const arg = path.node.arguments[0];
                if (!arg) return;
                
                let translationsObj = null;
                
                // 直接传递对象
                if (arg.type === 'ObjectExpression') {
                    translationsObj = evaluateNode(arg, {});
                }
                // JSON.parse("...")
                else if (arg.type === 'CallExpression' &&
                         arg.callee.type === 'MemberExpression' &&
                         arg.callee.object.type === 'Identifier' &&
                         arg.callee.object.name === 'JSON' &&
                         arg.callee.property.type === 'Identifier' &&
                         arg.callee.property.name === 'parse') {
                    const jsonArg = arg.arguments[0];
                    if (jsonArg && jsonArg.type === 'StringLiteral') {
                        try {
                            translationsObj = JSON.parse(jsonArg.value);
                        } catch (e) {
                            console.error('Failed to parse JSON:', e);
                            return;
                        }
                    }
                }
                
                if (translationsObj && typeof translationsObj === 'object') {
                    for (const [langCode, translations] of Object.entries(translationsObj)) {
                        if (translations && typeof translations === 'object') {
                            const stringObj = {};
                            
                            for (const [key, value] of Object.entries(translations)) {
                                const cleanKey = key.startsWith('_') ? key.substring(1) : key;
                                stringObj[cleanKey] = value;
                            }
                            
                            const normalizedLangCode = normalizeLangCode(langCode);
                            
                            translateData.push({
                                id: normalizedLangCode,
                                string: stringObj
                            });
                        }
                    }
                }
            }
        }
    });
}

/**
 * 检查节点是否包含对类名的引用
 */
function nodeContainsClassName(node, className) {
    if (!node || !className) return false;
    
    // 检查标识符
    if (node.type === 'Identifier' && node.name === className) {
        return true;
    }
    
    // 递归检查所有子节点
    for (const key of Object.keys(node)) {
        const child = node[key];
        if (child && typeof child === 'object') {
            if (Array.isArray(child)) {
                for (const item of child) {
                    if (nodeContainsClassName(item, className)) return true;
                }
            } else {
                if (nodeContainsClassName(child, className)) return true;
            }
        }
    }
    
    return false;
}

/**
 * 提取 publicJS
 */
function extractPublicJS(ast, className) {
    let publicJS = '';
    
    traverse(ast, {
        CallExpression(path) {
            if (path.node.callee.type === 'FunctionExpression' && 
                path.node.arguments.length > 0) {
                
                const functionBody = path.node.callee.body.body;
                const publicStatements = [];

                for (const statement of functionBody) {
                    // 只跳过主扩展类，保留其他辅助类定义
                    if (statement.type === 'ClassDeclaration') {
                        if (className && statement.id && statement.id.name === className) {
                            continue; // 跳过主扩展类
                        }
                        // 其他类定义保留
                    }
                    
                    if (statement.type === 'ExpressionStatement' &&
                        statement.expression.type === 'CallExpression' &&
                        statement.expression.callee.type === 'MemberExpression') {
                        const callee = statement.expression.callee;
                        
                        // 跳过 Scratch.extensions.register
                        if (callee.object.type === 'MemberExpression' &&
                            callee.object.object.type === 'Identifier' &&
                            callee.object.object.name === 'Scratch' &&
                            callee.object.property.type === 'Identifier' &&
                            callee.object.property.name === 'extensions' &&
                            callee.property.type === 'Identifier' &&
                            callee.property.name === 'register') {
                            continue;
                        }
                        
                        // 跳过 Scratch.translate.setup
                        if (callee.object.type === 'MemberExpression' &&
                            callee.object.object.type === 'Identifier' &&
                            callee.object.object.name === 'Scratch' &&
                            callee.object.property.type === 'Identifier' &&
                            callee.object.property.name === 'translate' &&
                            callee.property.type === 'Identifier' &&
                            callee.property.name === 'setup') {
                            continue;
                        }
                    }
                    
                    // 跳过所有引用类名的代码（包括 for 循环）
                    if (nodeContainsClassName(statement, className)) {
                        continue;
                    }
                    
                    if (statement.type === 'ExpressionStatement' &&
                        statement.expression.type === 'StringLiteral' &&
                        statement.expression.value === 'use strict') {
                        continue;
                    }
                    
                    publicStatements.push(statement);
                }

                if (publicStatements.length > 0) {
                    for (const stmt of publicStatements) {
                        const code = generate(stmt, { comments: true }).code;
                        publicJS += code + '\n';
                    }
                }
            }
        }
    });

    return publicJS;
}
