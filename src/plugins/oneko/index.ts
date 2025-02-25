/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Devs } from "@utils/constants";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    coinsEnabled: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Enable coins feature (Requires reload)"
    }
});

export default definePlugin({
    name: "oneko",
    description: "cat follow mouse (real)",
    authors: [Devs.Ven, Devs.adryd, Devs.Gingi],
    settings,
    start() {
        const coinsEnabled = settings.store.coinsEnabled;
        if (coinsEnabled) {
            fetch("https://raw.githubusercontent.com/0xGingi/oneko.js/acf1ae58ca8bacd9af47a783c2e134136c35f948/oneko.js")
                .then(x => x.text())
                .then(s => s.replace("./oneko.gif", "https://raw.githubusercontent.com/adryd325/oneko.js/14bab15a755d0e35cd4ae19c931d96d306f99f42/oneko.gif")
                    .replace("(isReducedMotion)", "(false)"))
                .then(x => x.replace("./coin.gif", "https://raw.githubusercontent.com/0xGingi/oneko.js/3de1bf554bb82b58a2c70f828e2420a881e5f283/coin.gif"))
                .then(eval);
        }
        if (!coinsEnabled) {
            fetch("https://raw.githubusercontent.com/adryd325/oneko.js/8fa8a1864aa71cd7a794d58bc139e755e96a236c/oneko.js")
                .then(x => x.text())
                .then(s => s.replace("./oneko.gif", "https://raw.githubusercontent.com/adryd325/oneko.js/14bab15a755d0e35cd4ae19c931d96d306f99f42/oneko.gif")
                    .replace("(isReducedMotion)", "(false)"))
                .then(eval);
        }
    },
    stop() {
        document.getElementById("oneko")?.remove();
        if (typeof window.removeCoins === 'function') {
            window.removeCoins();
        }
    }
});