import styles from "./home.module.css";
import { setLanguage, SUPPORTED_LANGUAGES, useTranslation } from "../../i18n";
import { useTheme } from "../../lib/theme.js";
import { loadProject } from "../editor/blockUtils";
import { translate, getClass } from "../../extension/decompile";
import fscWS, { getFSCPort, setFSCPort } from "../../extension/fsc-serve";

import logo from './logo.svg';

import { FaDownload } from "react-icons/fa6";
import { IoMdAdd } from "react-icons/io";
import { SiCompilerexplorer } from "react-icons/si";
import { VscColorMode } from "react-icons/vsc";
import { useState } from "react";
import { toast } from "../toast/toast.jsx";


const Home = props => {
    const { t, language } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const [fscPort, setFscPortState] = useState(getFSCPort());

    return (
        <div>
            <div className={styles.mainPanel}>
                <div className={styles.left}>
                    <div className={styles.logo}>
                        <img src={logo} className={styles.logoPic} alt="logo" /><span className={styles.title}>GaiaMod Extension Editor</span>
                    </div>
                    <span className={styles.tip}>{t('What would you like to do?')}</span>
                </div>
                <div className={styles.right}>
                    <button className={styles.actionButton} onClick={props.newProject}>
                        <IoMdAdd className={styles.buttonIcon} />
                        {t('Create New Extension')}
                    </button>
                    <button className={styles.actionButton} onClick={() => document.getElementById('file-input-c').click()}>
                        <FaDownload className={styles.buttonIcon} />
                        {t('Load Extension (.ab)')}
                    </button>
                    <button className={styles.actionButton} onClick={() => document.getElementById('file-input-d').click()}>
                        <SiCompilerexplorer className={styles.buttonIcon} />
                        {t('Decompile Extension (.js)')}
                    </button>
                    <button className={styles.actionButton} onClick={() => { setFSCPort(fscPort); fscWS(fscPort) }} >
                        FS-Context
                        <input
                            className={styles.portInput}
                            type="number"
                            value={fscPort}
                            onChange={e => {
                                const v = parseInt(e.target.value, 10);
                                if (!isNaN(v)) setFscPortState(v);
                            }}
                            placeholder="8000"
                            title="FSC Port"
                        />
                    </button>


                    <input id="file-input-c" type="file" accept=".ab,.json" style={{ display: 'none' }} onChange={(e) => loadProject(e, () => { props.loaded() })} />
                    <input id="file-input-d" type="file" accept=".js" style={{ display: 'none' }} onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        const reader = new FileReader();
                        reader.onload = async (event) => {
                            try {
                                const jsCode = event.target.result;
                                const className = getClass(jsCode);
                                translate(jsCode, className);
                                props.loaded();
                            } catch (err) {
                                toast.error(t('Failed to decompile extension: ') + err.message);
                            }
                        };
                        reader.readAsText(file);
                    }} />
                </div>
                <div className={styles.footer}>
                    <button className={styles.themeButton} onClick={toggleTheme}>
                        <VscColorMode />
                        {t(theme === 'dark' ? 'Dark Mode' : 'Light Mode')}
                    </button>
                    <select onChange={e => {
                        setLanguage(e.target.value);
                    }} value={language}>
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    )
}

export default Home
