import styles from "./FSCEditor.module.css";

import { t } from "../../i18n";
import { toast } from "../toast/toast.jsx";

// 这些平台Logo均不作为商业用处，仅作为展示使用
import tw from './platform/tw.svg';
import FZcode from "./platform/40code.png";
import gandi from "./platform/gandi.png";
import ZTengine from "./platform/02engine.png";
import clipcc from "./platform/clipcc.svg";
import zerocat from "./platform/zerocat.png";
import ae from './platform/ae.svg'

import hotReloadService from "../../extension/HotReloadService.js";

import { useEffect } from "react";

const FSCEditor = props => {
    const ext = props.fscData;

    const platform = {
        tw: { name: "TurboWarp", color: "#ff4c4c", logo: tw },
        ae: { name: "AstraEditor", color: "#0099ff", logo: ae },
        "02engine": { name: "02Engine", color: "#01b8ac", logo: ZTengine },
        clipcc: { name: "ClipCC", color: "#0072F5", logo: clipcc },
        // mblock: { name: "mBlock", color: "#1EAAFF", logo: mblock },
        gandi: { name: "Gandi", color: "#17b6f3", logo: gandi },
        zerocat: { name: "ZeroCat", color: "#1867c0", logo: zerocat },
        "40code": { name: "40Code", color: "#1867c0", logo: FZcode },
         gm: { name: "GaiaMod", color: "#2D2DD2", logo: gm },
    }
    const getPlatform = name => {
        if (platform[name]) return platform[name].name;
        return name;
    }
    const getPlatformColor = name => {
        if (platform[name]) return platform[name].color;
        return "var(--text-color)";
    }

    const getPlatformLogo = name => {
        const pfName = getPlatform(name);
        const img = pf => (<img className={styles.platformLogo} src={pf} alt={pfName} />);

        if (platform[name]) return img(platform[name].logo)
        return null;
    }

    useEffect(() => {
        const hotreload = async () => {
            toast.info(t('Hot reloading FSC extension...'));
            const result = await hotReloadService.hotReloadFSC(ext);
            if (result.success) {
                toast.success(t('FSC extension loaded successfully'));
            } else {
                toast.error(result.error || t('Failed to load FSC extension'));
            }
        }
        hotreload();
    }, [ext])

    return (
        <div className={styles.fscEditor}>
            <div>
                <span className={styles.extName}>{ext.name}</span>
                <span className={styles.extVersion}>{ext.version}</span><br />
                <span className={styles.extId}>{ext.id}</span><br /><br />
                <span className={styles.extDescription}>"{ext.description}"</span>
            </div>
            <div>
                <div>
                    <h3>{t('Supported Platforms')}</h3>
                    {ext.platform.map(name => (
                        <div className={styles.platformDiv} key={name}>
                            {getPlatformLogo(name)}
                            <p style={{ color: getPlatformColor(name) }}>
                                {getPlatform(name)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default FSCEditor