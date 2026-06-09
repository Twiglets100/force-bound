window.ForceBound = window.ForceBound || {};

ForceBound.SaveSystem = {
    saveKey: 'forcebound_save',
    save(data) {
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(data));
            return true;
        } catch (e) { return false; }
    },
    load() {
        try {
            const d = localStorage.getItem(this.saveKey);
            return d ? JSON.parse(d) : null;
        } catch (e) { return null; }
    },
    delete() {
        try { localStorage.removeItem(this.saveKey); return true; } catch (e) { return false; }
    },
    exists() {
        return localStorage.getItem(this.saveKey) !== null;
    }
};
