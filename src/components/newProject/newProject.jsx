import { useEffect, useState } from 'react';
import {
    init,
    returnValue,
    setValueTo,
} from '../../extension/storage';
import { spawnExtID } from '../../extension/check';
import { useTranslation } from '../../i18n';
import Tip from '../tip/tip.jsx';

import styles from './newProject.module.css';
import { toast } from '../toast/toast.jsx';

const DEFAULT_COLORS = ['#2D2DD2', '#1515B2', '#000087'];
const BUILTIN_LICENSES = ['MPL-2.0', 'MIT', 'GPL-3.0', 'Apache-2.0', 'CC-BY-SA-4.0'];

const Input = props => (
    <input placeholder={props.placeholder} className={styles.input}
        type={props.type || "text"}
        onChange={(e) => props.setname(e.target.value)}
        value={props.nowvalue}
        {...props}
    />
)

const normalizeCommentData = (comment = {}) => ({
    name: comment.name || '',
    id: comment.id || '',
    description: comment.description || '',
    author: comment.author || '',
    license: comment.license || 'MPL-2.0',
    docsURI: comment.docsURI || '',
    menuIconURI: comment.menuIconURI || '',
    blockIconURI: comment.blockIconURI || '',
    color: [
        comment.color?.[0] || DEFAULT_COLORS[0],
        comment.color?.[1] || DEFAULT_COLORS[1],
        comment.color?.[2] || DEFAULT_COLORS[2]
    ]
});

export default function NewProject(props) {
    const { t } = useTranslation();
    const isModal = props.variant === 'modal';
    const initialCommentData = normalizeCommentData(props.initialData);
    const customLicenseLabel = BUILTIN_LICENSES.includes(initialCommentData.license)
        ? 'Custom'
        : initialCommentData.license;

    const [nowName, setname] = useState(initialCommentData.name);
    const [nowID, setID] = useState(initialCommentData.id);
    const [nowDesc, setDesc] = useState(initialCommentData.description);
    const [nowAuthor, setAuthor] = useState(initialCommentData.author);
    const [nowLicense, setLicense] = useState(initialCommentData.license);
    const [nowDocsURI, setDocsURI] = useState(initialCommentData.docsURI);
    const [nowMenuIconURI, setMenuIconURI] = useState(initialCommentData.menuIconURI);
    const [nowBlockIconURI, setBlockIconURI] = useState(initialCommentData.blockIconURI);
    const [useCustomID, setUseCustomID] = useState(Boolean(props.initialData));

    const [nowCustomLicence, setCustomLicencse] = useState(customLicenseLabel);
    const [nowColor, setColor] = useState(initialCommentData.color);
    const [isDisabledCustomColor, setDisabledCustomColor] = useState(!props.initialData);
    const [customColor, setCustomColor] = useState(props.initialData ? [true, true, true] : [false, false, false]); // 追踪每个颜色是否被自定义

    // 这个函数是AI来的，AI太好用了你知道吗
    const calculateColors = (baseColor) => {
        if (!isDisabledCustomColor) return [baseColor, nowColor[1], nowColor[2]]
        // 解析十六进制颜色
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const darken = (value, factor) => Math.round(value * factor);

        const color2 = `#${darken(r, 0.7).toString(16).padStart(2, '0')}${darken(g, 0.7).toString(16).padStart(2, '0')}${darken(b, 0.7).toString(16).padStart(2, '0')}`;
        const color3 = `#${darken(r, 0.4).toString(16).padStart(2, '0')}${darken(g, 0.4).toString(16).padStart(2, '0')}${darken(b, 0.4).toString(16).padStart(2, '0')}`;

        return [baseColor, color2, color3];
    };

    const setnameAndID = (Name) => {
        setname(Name);
        if (!useCustomID) setID(Name ? spawnExtID(Name) : "");
    }

    useEffect(() => {
        if (props.initializeStorage !== false) {
            init(); // 扩展初始化
        }
    }, [props.initializeStorage])

    useEffect(() => {
        if (!useCustomID) {
            setID(nowName ? spawnExtID(nowName) : "");
        }
    }, [useCustomID, nowName])

    const uploadImage = (setter) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => setter(event.target?.result || "");
            reader.readAsDataURL(file);
        };
        input.click();
    };

    const handleLicenseChange = (value) => {
        if (value === 'Custom') {
            const customLicense = prompt(t('What licence do you like?'), nowLicense || nowCustomLicence);
            if (customLicense && customLicense.trim()) {
                const nextLicense = customLicense.trim();
                setCustomLicencse(nextLicense);
                setLicense(nextLicense);
            }
            return;
        }
        setLicense(value);
    };

    const setComment = () => {
        const newComment = {
            ...(returnValue("comments") || {})
        };
        if (!(nowName && nowName.trim().length > 0)) {
            toast.error(t('Invalid extension name!'));
            return;
        }
        if (!(nowID && nowID.trim().length > 0)) {
            toast.error(t('Invalid extension ID!'));
            return;
        }
        newComment.name = nowName || "";
        newComment.id = nowID || "extension";
        newComment.description = nowDesc || "";
        newComment.author = nowAuthor || "";
        newComment.license = nowLicense || "MPL-2.0";
        newComment.color = nowColor || ["#2D2DD2", "#1515B2", "#000087"];
        newComment.docsURI = nowDocsURI || "";
        newComment.menuIconURI = nowMenuIconURI || "";
        newComment.blockIconURI = nowBlockIconURI || "";
        setValueTo("comments", newComment);
        props.Done?.(newComment)
    }
    const rootClassName = isModal ? `${styles.newProject} ${styles.newProjectModal}` : styles.newProject;
    const previewClassName = isModal ? `${styles.view} ${styles.viewModal}` : styles.view;
    const formClassName = isModal ? `${styles.main} ${styles.mainModal}` : styles.main;
    const selectValue = BUILTIN_LICENSES.includes(nowLicense) ? nowLicense : 'Custom';

    return (
        <div className={rootClassName}>
            <div className={previewClassName}>
                <div
                    style={{
                        backgroundColor: nowColor[1] == undefined ? nowColor[0] : nowColor[1],
                        position: 'relative'
                    }}
                    className={styles.Extbg}
                >
                    {nowMenuIconURI && <img src={nowMenuIconURI} style={{
                        filter: 'drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.3))',
                        marginLeft: '20px',
                        width: '48px',
                        height: '48px',
                        zIndex: '11'
                    }} />}
                    <div className={styles.manages}>
                        <div>

                            <div style={{ position: 'relative', zIndex: '11' }}>
                                <span className={styles.ExtTitle} style={{
                                    textShadow: '0 0 3px rgba(0, 0, 0, 0.8), 0 0 6px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.5)'
                                }}>
                                    {nowName}
                                </span><br />
                                <span className={styles.ExtId} style={{
                                    textShadow: '0 0 3px rgba(0, 0, 0, 0.8), 0 0 6px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.5)'
                                }}>
                                    {nowID}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <div className={formClassName}>
                {props.showFormHeading !== false && <h1>{props.formTitle || t('Create extension')}</h1>}
                <Input
                    setname={value => setnameAndID(value)}
                    nowvalue={nowName}
                    placeholder={t('Name')}
                />
                <div className={styles.ID}>
                    {
                        (nowID.trim() !== "" || useCustomID) ?
                            <div>
                                {t('Extension id')}:
                                {useCustomID ? (<input value={nowID} onChange={e => {
                                    setID(e.target.value)
                                }} />
                                ) : (
                                    <input value={nowID} readOnly />
                                )}
                            </div> :
                            <div style={{
                                width: "200px"
                            }}>
                                <Tip title={t('Empty extension id')} />
                            </div>
                    }
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center'
                }} className={styles.useCustomID}>
                    <input type="checkbox" checked={useCustomID} onChange={e => {
                        setUseCustomID(e.target.checked)
                    }} />
                    {t('Custom ID?')}
                </div>


                <Input
                    setname={value => setDesc(value)}
                    nowvalue={nowDesc}
                    placeholder={t('Description')}
                />
                <Input
                    setname={value => setAuthor(value)}
                    nowvalue={nowAuthor}
                    placeholder={t('Author')}
                />
                <Input
                    setname={value => setDocsURI(value)}
                    nowvalue={nowDocsURI}
                    placeholder={t('Docs URL')}
                />
                <select
                    onChange={(e) => {
                        handleLicenseChange(e.target.value)
                    }}
                    value={selectValue}
                    placeholder={t('License')}
                    className={styles.input}
                >
                    <option value="MPL-2.0">MPL-2.0</option>
                    <option value="MIT">MIT</option>
                    <option value="GPL-3.0">GPL-3.0</option>
                    <option value="Apache-2.0">Apache-2.0</option>
                    <option value="CC-BY-SA-4.0">CC-BY-SA-4.0</option>
                    <hr />
                    <option value="Custom">{t('Custom')}({nowCustomLicence})</option>
                </select>
                <div className={styles.SetColor}>
                    <span>{t('Custom color')}: </span>
                    <input type='checkbox'
                        checked={!isDisabledCustomColor}
                        onChange={(e) => setDisabledCustomColor(!e.target.checked)}
                    />
                </div>
                <div>
                    <Input
                        setname={value => {
                            const newColors = calculateColors(value);
                            // 更新未自定义的颜色
                            setColor([
                                newColors[0],
                                customColor[1] ? nowColor[1] : newColors[1],
                                customColor[2] ? nowColor[2] : newColors[2]
                            ]);
                        }}
                        nowvalue={nowColor[0]}
                        type="color"
                        placeholder="Color"
                        className={styles.colorInput}
                    />
                    <Input
                        setname={value => {
                            setColor([nowColor[0], value, nowColor[2]]);
                            setCustomColor([customColor[0], true, customColor[2]]);
                        }}
                        nowvalue={nowColor[1]}
                        type="color"
                        placeholder="Color"
                        className={styles.colorInput}
                        disabled={isDisabledCustomColor}

                    />
                    <Input
                        setname={value => {
                            setColor([nowColor[0], nowColor[1], value]);
                            setCustomColor([customColor[0], customColor[1], true]);
                        }}
                        nowvalue={nowColor[2]}
                        type="color"
                        placeholder="Color"
                        className={styles.colorInput}
                        disabled={isDisabledCustomColor}
                    />

                </div>
                <div className={styles.iconSection}>
                    <div className={styles.iconSectionCard}>
                        <div className={styles.iconLabel}>{t('Menu Icon')}</div>
                        <div className={styles.iconPickerRow}>
                            <button onClick={() => uploadImage(setMenuIconURI)}>{t('Upload')}</button>
                            {nowMenuIconURI ? (
                                <img className={styles.iconPreview} src={nowMenuIconURI} alt="menu icon" onClick={() =>
                                    setMenuIconURI(initialCommentData.menuIconURI)
                                } />
                            ) : (
                                <span className={styles.iconPlaceholder}>{t('No icon selected')}</span>
                            )}
                        </div>
                    </div>
                    <div className={styles.iconSectionCard}>
                        <div className={styles.iconLabel}>{t('Block Icon')}</div>
                        <div className={styles.iconPickerRow}>
                            <button onClick={() => uploadImage(setBlockIconURI)}>{t('Upload')}</button>
                            {nowBlockIconURI ? (
                                <img className={styles.iconPreview} src={nowBlockIconURI} alt="block icon" onClick={() =>
                                    setBlockIconURI(initialCommentData.blockIconURI)
                                } />
                            ) : (
                                <span className={styles.iconPlaceholder}>{t('No icon selected')}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles.actions}>
                    {props.close && (
                        <button type="button" className={styles.secondaryButton} onClick={props.close}>{t('Cancel')}</button>
                    )}
                    <button type="button" onClick={() => setComment()}>{props.submitLabel || t('Done')}</button>
                </div>
            </div>
        </div>
    )
}
