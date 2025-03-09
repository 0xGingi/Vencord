import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    defaultPassword: {
        type: OptionType.STRING,
        default: "",
        description: "Default encryption password to use"
    },
    autoDecrypt: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Automatically try to decrypt messages with your default password"
    },
    indicatorColor: {
        type: OptionType.STRING,
        default: "#45f5f5",
        description: "Color for the decrypted message indicator"
    },
    autoEncrypt: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Automatically encrypt all messages (using default password)"
    },
    savePasswordsPerChannel: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Remember encryption passwords per channel"
    }
}); 