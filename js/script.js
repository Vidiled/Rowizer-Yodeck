import {ZermeloApi} from "./zermelo/zermelo.js";
import {Changes} from "./controllers/changes/changes.js";
import Absences from "./controllers/absences/absences.js";
import {ZermeloAuthorizationError} from "./zermelo/utils/errors.js";
import ZermeloConnector from "./connectors/zermeloConnector.js";
import {ChangesUiManager} from "./views/changes/changesUiManager.js";
import AbsenceEntity from "./controllers/absences/absenceEntity.js";
import {AbsencesUiManager} from "./views/absences/absencesUiManager.js";
import OutOfOffice from "./controllers/outofoffice/outOfOffice.js";
import {OutOfOfficeUiManager} from "./views/outOfOffice/outOfOfficeUiManager.js";

// This script supports two initialization methods:
// 1) Local/dev: pass config via URL query parameters (portal, token, branch, ...)
// 2) Yodeck: the player calls window.init_widget(config) after loading the app

// On-screen error helpers
window.showError = function(message, {timeout} = {}){
    try{
        const el = document.getElementById('widget-error');
        const txt = document.getElementById('widget-error-text');
        if(!el || !txt){
            console.error('Widget error element not found, message:', message);
            return;
        }
        txt.textContent = message;
        el.style.display = 'flex';
        if(window.__widget_error_timeout){
            clearTimeout(window.__widget_error_timeout);
            window.__widget_error_timeout = null;
        }
        if(timeout && typeof timeout === 'number'){
            window.__widget_error_timeout = setTimeout(()=>{
                el.style.display = 'none';
            }, timeout);
        }
    }catch(e){
        console.error('showError failed', e);
    }
};

window.hideError = function(){
    try{
        const el = document.getElementById('widget-error');
        if(el) el.style.display = 'none';
    }catch(e){
        console.error('hideError failed', e);
    }
};

// wire close button when DOM ready
document.addEventListener('DOMContentLoaded', ()=>{
    const btn = document.getElementById('widget-error-close');
    if(btn) btn.addEventListener('click', ()=> window.hideError());
});

function _getFromConfigOrParams(key, config, params){
    if(config && (key in config) && config[key] !== null && config[key] !== undefined){
        return config[key];
    }
    return params.get(key);
}

function initApp(config){
    console.log("Initializing app with config:", config)

    // Apply style-related config (colors) early so UI renders with selected theme.
    try{
        const paramsPreview = new URLSearchParams(window.location.search);
        const styleMap = {
            background_start: '--bg-gradient-start',
            background_end: '--bg-gradient-end',
            panel_background: '--panel-bg',
            text_color: '--text-color',
            accent_color: '--accent-color',
            error_color: '--error-bg'
        };
        Object.keys(styleMap).forEach(key => {
            const val = _getFromConfigOrParams(key, config, paramsPreview);
            if(val !== null && val !== undefined){
                try{ document.documentElement.style.setProperty(styleMap[key], val); }catch(e){ /* ignore */ }
            }
        });
    }catch(e){
        console.warn('Applying style config failed', e);
    }

    const params = new URLSearchParams(window.location.search);

    // Build Zermelo API instance from either config or URL params
    const zapi = new ZermeloApi({
        portal: _getFromConfigOrParams('portal', config, params),
        token: _getFromConfigOrParams('token', config, params),
        branch: _getFromConfigOrParams('branch', config, params)
    });

    // Read other params
    const param_date = _getFromConfigOrParams('date', config, params);
    const param_branch = _getFromConfigOrParams('branch', config, params);
    const param_ignore = _getFromConfigOrParams('departmentsIgnore', config, params);
    const param_merge = _getFromConfigOrParams('mergeAppointments', config, params);
    let param_external = _getFromConfigOrParams('external', config, params);
    param_external = param_external ? param_external : "extern";

    // Create connector and wire up app
    let connector = new ZermeloConnector(zapi, param_date ? param_date : undefined, {branch: param_branch? param_branch : undefined, ignore_departments: param_ignore ? (typeof param_ignore === 'string' ? param_ignore.split(",") : param_ignore) : []});
    AbsenceEntity.Connector = connector;

    var changesManager = new Changes(connector, {
        merge_multiple_hour_span: !(param_merge && param_merge === "false")
    });
    var changesUiManager = new ChangesUiManager(document.querySelector("#content-container"), connector, changesManager);

    var absences = new Absences(connector);
    var absencesUiManager = new AbsencesUiManager(document.querySelector("#absences-container>div"),connector,absences);

    var outofoffice = new OutOfOffice(connector);
    var outOfOfficeUiManager = new OutOfOfficeUiManager(document.querySelector("#outofoffice-inner-container"),connector,outofoffice);

    window.cm = changesUiManager;
    window.zc = connector;

    let dayChanged = function(){
        changesManager.reset();
        changesUiManager.refreshTable();
        $("#title").text("Roosterwijzigingen " + connector.date.toLocaleString("nl-NL", {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
    };
    window.dc = dayChanged;

    connector.waitUntilReady().then(a=>{
        changesManager.loadData().then(cm => {
            changesUiManager.makeTable();
            changesUiManager.fillTable();
            var last_checked_date = new Date();
            setInterval(()=> {
                let new_date = new Date();
                if(last_checked_date.getDate() < new_date.getDate()){
                    // hard reload for day change
                    location.reload();
                    let diff = Math.round((new_date.getTime() - last_checked_date.getTime())/ (1000 * 3600 * 24));
                    let new_date_obk = new Date(connector.date);
                    new_date_obk.setDate(new_date_obk.getDate() + diff);
                    last_checked_date = new_date;
                    connector.setDate(new_date_obk).then(a=>{
                        changesManager.reset();
                        $("#title").text("Roosterwijzigingen " + connector.date.toLocaleString("nl-NL", {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }));
                        absences.reset();
                    });
                }
                changesUiManager.refreshTable();
            }, 5*60*1000);
        });
        absencesUiManager.refresh().then(a=>{
            setInterval(()=>{
                absencesUiManager.refresh();
            }, 5*60*1000);
            document.querySelector("#absences-container").style.display = null;
        }).catch(err=>{
            if(err instanceof ZermeloAuthorizationError){
                console.log("No authorization for absences");
            }
            else {
                throw err;
            }
        });

        connector.waitUntilReady().then(a=> outofoffice.setExternalLocationName(param_external)).catch(err=>console.log(err))
            .then(a=> outofoffice.loadAll())
            .then(items=>{
                if(outofoffice.outOfOffices.length){
                    document.querySelector("#outofoffice-container").style.display = null;
                }
                outOfOfficeUiManager.refresh();
                setInterval(()=>{
                    outOfOfficeUiManager.refresh();
                    if(outofoffice.outOfOffices.length){
                        document.querySelector("#outofoffice-container").style.display = null;
                    }
                    else{
                        document.querySelector("#outofoffice-container").style.display = "none";
                    }
                }, 5*60*1000);
            });
    });

    $("#title").text("Roosterwijzigingen " + changesUiManager.date.toLocaleString("nl-NL", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }));
}

// Yodeck will call init_widget(config) with a JS object containing the configuration
// See Yodeck docs: the player calls this function after loading the app
function init_widget(config){
    console.log('init_widget called with config:', config);
    try{
        initApp(config);
    }catch(e){
        console.error('Failed to initialize app with config', e);
        // show on-screen error for admins to notice
        try{
            const msg = (e && e.message) ? e.message : String(e);
            window.showError('Initialization error: ' + msg);
        }catch(_){/* ignore */}
    }
};

// For local development, if there are URL params, initialize immediately
if(window.location.search && window.location.search.length > 1){
    // pass undefined so initApp will read from URL params
    initApp(undefined);
}
